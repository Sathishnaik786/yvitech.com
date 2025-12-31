#!/usr/bin/env node

/**
 * Deployment Configuration Helper Script
 * 
 * This script helps verify and configure environment variables for deployment
 * to prevent common issues like the Supabase configuration errors you're experiencing.
 */

const fs = require('fs');
const path = require('path');

// Function to check if environment variables are properly set
function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...\n');
  
  const requiredBackendVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GROQ_API_KEY'
  ];
  
  const requiredFrontendVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  let hasMissingBackendVars = false;
  let hasMissingFrontendVars = false;
  
  console.log('📋 Backend Environment Variables:');
  for (const varName of requiredBackendVars) {
    const value = process.env[varName];
    const isSet = value && value !== '' && !value.includes('your-');
    console.log(`  ${isSet ? '✅' : '❌'} ${varName}: ${isSet ? 'SET' : 'MISSING OR INVALID'}`);
    if (!isSet) hasMissingBackendVars = true;
  }
  
  console.log('\n📋 Frontend Environment Variables:');
  for (const varName of requiredFrontendVars) {
    const value = process.env[varName];
    const isSet = value && value !== '' && !value.includes('your-');
    console.log(`  ${isSet ? '✅' : '❌'} ${varName}: ${isSet ? 'SET' : 'MISSING OR INVALID'}`);
    if (!isSet) hasMissingFrontendVars = true;
  }
  
  return { hasMissingBackendVars, hasMissingFrontendVars };
}

// Function to validate Supabase URL format
function validateSupabaseUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('supabase.co');
  } catch {
    return false;
  }
}

// Function to check if Supabase configuration is valid
function checkSupabaseConfig() {
  console.log('\n🔍 Checking Supabase configuration...\n');
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const urlValid = validateSupabaseUrl(supabaseUrl);
  const anonKeyValid = supabaseAnonKey && supabaseAnonKey.length > 10 && !supabaseAnonKey.includes('your-');
  const serviceKeyValid = supabaseServiceKey && supabaseServiceKey.length > 10 && !supabaseServiceKey.includes('your-');
  
  console.log(`  ${urlValid ? '✅' : '❌'} SUPABASE_URL: ${urlValid ? 'VALID' : 'INVALID OR MISSING'}`);
  console.log(`  ${anonKeyValid ? '✅' : '❌'} SUPABASE_ANON_KEY: ${anonKeyValid ? 'VALID' : 'INVALID OR MISSING'}`);
  console.log(`  ${serviceKeyValid ? '✅' : '❌'} SUPABASE_SERVICE_ROLE_KEY: ${serviceKeyValid ? 'VALID' : 'INVALID OR MISSING'}`);
  
  return { urlValid, anonKeyValid, serviceKeyValid };
}

// Function to create a deployment checklist
function createDeploymentChecklist() {
  console.log('\n📋 Deployment Checklist:');
  console.log('  1. Verify all environment variables are set in production');
  console.log('  2. Confirm Supabase project is active and not suspended');
  console.log('  3. Test API endpoints before deployment');
  console.log('  4. Verify backend server is accessible');
  console.log('  5. Test chat functionality after deployment');
  console.log('  6. Check browser console for errors');
  console.log('  7. Review server logs for any issues');
}

// Main function
function main() {
  console.log('🚀 YVI-Tech Deployment Configuration Helper');
  console.log('=========================================\n');
  
  // Check environment variables
  const { hasMissingBackendVars, hasMissingFrontendVars } = checkEnvironmentVariables();
  
  // Check Supabase configuration
  const { urlValid, anonKeyValid, serviceKeyValid } = checkSupabaseConfig();
  
  // Overall status
  console.log('\n📊 Overall Status:');
  const allGood = !hasMissingBackendVars && !hasMissingFrontendVars && urlValid && anonKeyValid && serviceKeyValid;
  
  if (allGood) {
    console.log('  ✅ All configurations appear to be properly set!');
    console.log('  🚀 You should be ready for deployment.');
  } else {
    console.log('  ❌ Some configurations need attention before deployment.');
    console.log('  📝 Please review the issues above and fix them before deploying.');
  }
  
  // Provide recommendations
  console.log('\n💡 Recommendations:');
  if (!urlValid) {
    console.log('  • Get your Supabase URL from your Supabase dashboard (should end with supabase.co)');
  }
  if (!anonKeyValid) {
    console.log('  • Get your Supabase ANON KEY from your Supabase dashboard (Project Settings > API)');
  }
  if (!serviceKeyValid) {
    console.log('  • Get your Supabase SERVICE ROLE KEY from your Supabase dashboard (Project Settings > API)');
  }
  if (!process.env.GROQ_API_KEY) {
    console.log('  • Get your Groq API key from https://console.groq.com/keys');
  }
  
  createDeploymentChecklist();
  
  console.log('\n📖 For detailed deployment instructions, see DEPLOYMENT_GUIDE.md');
  
  // Exit with appropriate code
  process.exit(allGood ? 0 : 1);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentVariables,
  validateSupabaseUrl,
  checkSupabaseConfig,
  createDeploymentChecklist
};