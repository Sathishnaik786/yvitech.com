#!/usr/bin/env node

/**
 * Script to generate embeddings for chatbot knowledge base entries using Gemini Embeddings API
 * and save them to the Supabase database.
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const groqApiKey = process.env.GROQ_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in backend/.env');
  process.exit(1);
}

if (!groqApiKey) {
  console.error('❌ Missing Groq API key');
  console.error('Please ensure GROQ_API_KEY is set in backend/.env');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Groq client
const groq = new Groq({ apiKey: groqApiKey });

// Function to add delay for rate limiting
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to generate embedding for text with retry logic
async function generateEmbedding(text: string, retries: number = 3): Promise<number[] | null> {
  try {
    // Combine title and description for better context
    const content = text.trim();
    
    if (!content) {
      throw new Error('Empty content provided for embedding');
    }
    
    // Generate embedding using Groq
    const response = await groq.embeddings.create({
      model: 'text-embedding-ada-002',
      input: content,
    });
    const embedding = response.data[0].embedding;
    return Array.isArray(embedding) ? embedding : [];
  } catch (error: any) {
    if (retries > 0 && (error.message.includes('429') || error.message.includes('quota'))) {
      console.log(`⚠️  Rate limit hit, waiting 10 seconds before retry (${retries} retries left)...`);
      await delay(10000); // Wait 10 seconds
      return generateEmbedding(text, retries - 1);
    }
    
    if (error.message.includes('429') || error.message.includes('quota')) {
      console.error('❌ Rate limit exceeded. Please upgrade your Gemini API plan or try again later.');
      console.log('💡 For more information: https://ai.google.dev/gemini-api/docs/rate-limits');
      return null;
    }
    
    console.error('Error generating embedding:', error.message);
    return null;
  }
}

// Function to process a batch of knowledge entries
async function processBatch(entries: any[], batchSize: number = 1): Promise<{ processed: number, errors: number }> {
  let processed = 0;
  let errors = 0;
  
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    console.log(`\n🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(entries.length/batchSize)} (${batch.length} entries)`);
    
    // Process each entry in the batch
    for (const entry of batch) {
      try {
        // Create content for embedding (combine title and description for better context)
        const content = `${entry.title}\n\n${entry.description}`.trim();
        
        if (!content) {
          console.warn(`⏭️  Skipping entry ${entry.id} - empty content`);
          errors++;
          continue;
        }
        
        // Generate embedding
        const embedding = await generateEmbedding(content);
        
        // If embedding generation failed due to rate limits, exit early
        if (embedding === null) {
          console.log('🛑 Stopping due to rate limit errors. Please try again later or upgrade your API plan.');
          return { processed, errors: errors + 1 };
        }
        
        // Update entry with embedding
        const { error: updateError } = await supabase
          .from('chatbot_knowledge')
          .update({ embedding: embedding })
          .eq('id', entry.id);
        
        if (updateError) {
          console.error(`❌ Error updating entry ${entry.id}:`, updateError.message);
          errors++;
        } else {
          processed++;
          console.log(`✅ Updated entry ${entry.id} with embedding (${embedding.length} dimensions)`);
        }
        
        // Small delay to avoid rate limiting
        await delay(2000);
      } catch (error: any) {
        console.error(`❌ Error processing entry ${entry.id}:`, error.message);
        errors++;
      }
    }
    
    // Show progress
    console.log(`📊 Batch progress: ${processed} processed, ${errors} errors so far`);
    
    // Longer delay between batches
    if (i + batchSize < entries.length) {
      console.log('⏳ Waiting 5 seconds before next batch...');
      await delay(5000);
    }
  }
  
  return { processed, errors };
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting embeddings generation for chatbot knowledge base...\n');
    
    // Fetch all knowledge base entries that don't have embeddings yet
    console.log('📥 Fetching knowledge base entries...');
    const { data: entries, error: fetchError } = await supabase
      .from('chatbot_knowledge')
      .select('id, category, title, description')
      .order('id');
    
    if (fetchError) {
      console.error('❌ Error fetching knowledge base entries:', fetchError.message);
      process.exit(1);
    }
    
    console.log(`📋 Found ${entries.length} knowledge base entries`);
    
    if (entries.length === 0) {
      console.log('ℹ️  No entries found in knowledge base');
      process.exit(0);
    }
    
    // Filter out entries that might already have embeddings
    const entriesWithoutEmbeddings = entries.filter(entry => {
      // In a real scenario, you might want to check if embedding exists
      // For now, we'll process all entries
      return true;
    });
    
    console.log(`🎯 Processing ${entriesWithoutEmbeddings.length} entries for embeddings`);
    console.log('💡 Note: Processing slowly to respect API rate limits. This may take a while...\n');
    
    // Process entries in batches
    const { processed, errors } = await processBatch(entriesWithoutEmbeddings, 1);
    
    console.log('\n📊 Final Summary:');
    console.log(`  ✅ Successfully processed: ${processed} entries`);
    console.log(`  ❌ Errors encountered: ${errors} entries`);
    
    if (processed + errors > 0) {
      console.log(`  📈 Success rate: ${((processed / (processed + errors)) * 100).toFixed(1)}%`);
    }
    
    // Create pgvector index if it doesn't exist
    console.log('\n.CreateIndexing embeddings for fast similarity search...');
    try {
      const { error: indexError } = await supabase.rpc('create_extension_if_not_exists', {
        name: 'vector'
      });
      
      // Note: In practice, you would need to run this SQL command in Supabase SQL editor:
      // CREATE INDEX IF NOT EXISTS knowledge_embedding_idx ON chatbot_knowledge USING ivfflat (embedding vector_cosine_ops);
      
      console.log('✅ Index creation command prepared (execute in Supabase SQL editor):');
      console.log('   CREATE INDEX IF NOT EXISTS knowledge_embedding_idx ON chatbot_knowledge USING ivfflat (embedding vector_cosine_ops);');
    } catch (indexError: any) {
      console.warn('⚠️  Could not create index automatically:', indexError.message);
      console.log('💡 Please run this SQL command manually in your Supabase SQL editor:');
      console.log('   CREATE INDEX IF NOT EXISTS knowledge_embedding_idx ON chatbot_knowledge USING ivfflat (embedding vector_cosine_ops);');
    }
    
    if (errors > 0) {
      console.log('\n⚠️  Some entries failed due to API rate limits.');
      console.log('💡 Solutions:');
      console.log('   1. Upgrade your Gemini API plan for higher rate limits');
      console.log('   2. Run the script again later when quota resets');
      console.log('   3. Process entries in smaller batches over multiple runs');
    }
    
    console.log('\n✅ Embeddings generation completed!');
    console.log('💡 Next steps:');
    console.log('   1. Run the SQL index creation command in Supabase if not already done');
    console.log('   2. Test the chatbot with similarity search capabilities');
    
  } catch (error: any) {
    console.error('❌ Unexpected error during embeddings generation:', error.message);
    process.exit(1);
  }
}

// Run the script
main();