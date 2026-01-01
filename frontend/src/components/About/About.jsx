import Banner from "../Banner/Banner";
import './About.css'
import OurApproach from '/src/assets/img/OurApproach1.png'
import RamImg from '../../assets/img/Ramgopal Yarra.jpg'
import './About.css'
import Video from "../Video/Video";
import BannerThree from "../Banner3/BannerThree";
import TeamCard from "../TeamCard/TeamCard";
import team from "../../data/team";

const About = () => {
  const valuesData = [
  {
    icon: "bi-shield-check",
    title: "Integrity",
    desc: "Demonstrating honesty, transparency, ethical conduct, and accountability in all situations, thereby fostering trust and credibility.",
  },
  {
    icon: "bi-lightbulb-fill",
    title: "Innovation",
    desc: "Supporting creativity, experimentation, continual improvement, and openness to rethinking traditional methods.",
  },
  {
    icon: "bi-people-fill",
    title: "Collaboration",
    desc: "Encouraging teamwork, open communication, mutual support, and aligned objectives to achieve collective success.",
  },
  {
    icon: "bi-people-fill",
    title: "Respect",
    desc: "Valuing every individual—whether team members, partners, or clients—by treating others with dignity and appreciating their unique contributions.",
  },
  {
    icon: "bi-graph-up-arrow",
    title: "Results-driven",
    desc: "Committing to achieving high-quality outcomes, demonstrating ownership, and maintaining accountability for performance.",
  },
  {
    icon: "bi-globe2",
    title: "Social Responsibility",
    desc: "Upholding ethical principles beyond profit, including community engagement, sustainability efforts, and giving back to society.",
  },
];

    return (
        <div >
            {/* <Banner headingText='Where Innovation Transforms into Action'
            content='YVI Soft is a results-driven information technology firm dedicated to providing distinctive, dependable, and innovative software solutions.'
            imageName='Innovation.jpg' /> */}
            <BannerThree headingText='Where Innovation Transforms into Action'
                        content="YVI Tech is a results-driven information technology firm dedicated to providing distinctive, dependable, and innovative software solutions."
                        videoName="About.mp4" />
            <Video/>
             <section className="leaderr" style={{backgroundColor: '#3B3B3B'}}>
                <div className="container aos-init aos-animate" data-aos="fade-up">
                    <div className="section-title">
                        <h2>Board & Executive Committee</h2>
                        <p style={{color:'white'}}>Meet Our Executive and Board Members</p>
                        <span className="text-white-50 fs-5">Our Board and Executive Committee are responsible for setting the direction, strategy, organization, and governance of the company, as well as overseeing its business operations.</span>
                    </div>
                    <div className="d-flex  gap-4">
                      {team.map((team) => (
                        <TeamCard key={team.id} team={team} />
                      ))}
                    </div>
                </div>
            </section>    
            <section id="values" className="values" style={{backgroundColor: '#3B3B3B'}}>
                <div className="container aos-init aos-animate" data-aos="fade-up">
                    <div className="section-title">
                        <h2>Our Values</h2>
                        <p style={{color:'white'}}>Core Values</p>
                    </div>
                    {/* <div className="container aos-init aos-animate" data-aos="fade-up"  style={{backgroundColor:' #3B3B3B'}}>
                <header className="section-title"></header>

    <div className="row mb-4">

      <div className="col-lg-4 aos-init aos-animate" data-aos="fade-up" data-aos-delay="200">
        <div className="box">
          <h3 style={{color:'#FFCD6D'}}>Integrity </h3>
          <p style={{color:'white'}}>Demonstrating honesty, transparency, ethical conduct, and accountability in all situations, thereby fostering trust and credibility.</p>
        </div>
      </div>

      <div className="col-lg-4 mt-4 mt-lg-0 aos-init aos-animate" data-aos="fade-up" data-aos-delay="400">
        <div className="box">
          <h3 style={{color:'#FFCD6D'}}>Innovation</h3>
          <p style={{color:'white'}}>Supporting creativity, experimentation, continual improvement, and openness to rethinking traditional methods.
            </p>
        </div>
      </div>

      <div className="col-lg-4 mt-4 mt-lg-0 aos-init aos-animate" data-aos="fade-up" data-aos-delay="600">
        <div className="box">
          <h3 style={{color:'#FFCD6D'}} >Collaboration</h3>
          <p style={{color:'white'}} >Encouraging teamwork, open communication, mutual support, and aligned objectives to achieve collective success.</p>
        </div>
      </div>

     

    </div>

    <div className="row" >
      <div className="col-lg-4 mt-4 mt-lg-0 aos-init aos-animate" data-aos="fade-up" data-aos-delay="600">
        <div className="box">
          <h3 style={{color:'#FFCD6D'}}  >Respect</h3>
          <p style={{color:'white'}} >Valuing every individual—whether team members, partners, or clients—by treating others with dignity and appreciating their unique contributions.</p>
        </div>
      </div>

      <div className="col-lg-4 mt-4 mt-lg-0 aos-init aos-animate" data-aos="fade-up" data-aos-delay="600">
        <div className="box" >
          <h3 style={{color:'#FFCD6D'}} >Results-driven</h3>
          <p style={{color:'white'}} >Committing to achieving high-quality outcomes, demonstrating ownership, and maintaining accountability for performance.</p>
        </div>
      </div>
      <div className="col-lg-4 mt-4 mt-lg-0 aos-init aos-animate" data-aos="fade-up" data-aos-delay="600">
        <div className="box" >
          <h3 style={{color:'#FFCD6D'}} >Social Responsibility</h3>
          <p style={{color:'white'}} >Upholding ethical principles beyond profit, including community engagement, sustainability efforts,  and giving back to society</p>
        </div>
      </div>
    </div>
    </div>*/}
    <div className="container text-center">
        <div className="row g-4 justify-content-center">
          {valuesData.map((item, index) => (
            <div className="col-md-4 " key={index}>
              <div className="card custom-card border-0 h-100 shadow">
                <div className="card-body text-start p-4">
                  <div className="iconn mb-3 ">
                    <i className={`bi ${item.icon}  fs-1 `}></i>
                  </div>
                  <h5 className="fw-semibold">{item.title}</h5>
                  <p className=" mb-0">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
  </div> 

</section>
{/* -- End Values Section -- */}
        {/*!-- ======= F.A.Q Section ======= --*/}
    <section id="faq" className="faq" style={{backgroundColor: '#3B3B3B'}}>
      <div className="container" data-aos="fade-up">
      <div className="section-title">
          <h2> Our process</h2>
          <p style={{color:'white'}}>GENERIC APPROACH</p>
        </div>
        <div className="row gy-4">

          <div className="col-lg-7 d-flex flex-column justify-content-center align-items-stretch  order-2 order-lg-1">

            <div className="content px-xl-5">
              <h3 style={{color:'white'}}> <strong>We provide flawless services through our approach</strong></h3>
              {/* <!--<h3> For your reference!</h3>--> */}
            </div>

            <div className="accordion accordion-flush px-xl-5" id="faqlist">

              <div className="accordion-item" data-aos="fade-up" data-aos-delay="200">
                <h3 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq-content-1">
                   {/* <!-- <i className="bi bi-question-circle question-icon"></i>--> */}
                    REQUIREMENTS AND CONSULTING
                  </button>
                </h3>
                <div id="faq-content-1" className="accordion-collapse collapse" data-bs-parent="#faqlist">
                  <div className="accordion-body">
                    Learning your business processes to understand the objectives you want to achieve and provide the right clear roadmap with KPIs and timelines. Defining metrics to set the project up for success. 

                  </div>
                </div>
                </div>{/* {/* <!-- # Faq item--> */} 

              <div className="accordion-item" data-aos="fade-up" data-aos-delay="300">
                <h3 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq-content-2">
                    {/* <!--<i className="bi bi-question-circle question-icon"></i>--> */}
                    DEVELOPMENT
                  </button>
                </h3>
                <div id="faq-content-2" className="accordion-collapse collapse" data-bs-parent="#faqlist">
                  <div className="accordion-body">
                    Configuration, customization, and technical work that is required to automate the business processes with appropriate IT services.

                  </div>
                </div>
              </div>{/* <!-- # Faq item--> */}

              <div className="accordion-item" data-aos="fade-up" data-aos-delay="400">
                <h3 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq-content-3">
                    {/* <!--<i className="bi bi-question-circle question-icon"></i>--> */}
                    TESTING
                  </button>
                </h3>
                <div id="faq-content-3" className="accordion-collapse collapse" data-bs-parent="#faqlist">
                  <div className="accordion-body">
                    Thoroughly checking the system to make sure it complies with the agreed-upon plan and does what it is supposed to.

                  </div>
                </div>
              </div>{/* <!-- # Faq item--> */}

              <div className="accordion-item" data-aos="fade-up" data-aos-delay="500">
                <h3 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq-content-4">
                    {/* <!--<i className="bi bi-question-circle question-icon"></i>--> */}
                    RELEASE
                  </button>
                </h3>
                <div id="faq-content-4" className="accordion-collapse collapse" data-bs-parent="#faqlist">
                  <div className="accordion-body">
                    Rolling out your solution and making sure the adoption process is hassle-free for business users.


                  </div>
                </div>
              </div>{/* <!-- # Faq item--> */}

              <div className="accordion-item" data-aos="fade-up" data-aos-delay="600">
                <h3 className="accordion-header">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq-content-5">
                    {/* <!--<i className="bi bi-question-circle question-icon"></i>--> */}
                    ENHANCEMENT  AND MAINTENANCE
                  </button>
                </h3>
                <div id="faq-content-5" className="accordion-collapse collapse" data-bs-parent="#faqlist">
                  <div className="accordion-body">
                    Release is not the end of our collaboration. We will continue working with you and help you grow the system so it can bring you even more value in the long term. 

                  </div>
                </div>
              </div>{/* <!-- # Faq item--> */}

            </div>

          </div>

         {/* <!-- <div className="col-lg-2 align-items-stretch order-1 order-lg-4 img" style='background-image: url("assets/img/OurApproach.png");'>&nbsp;</div>
        </div>--> */}

        <div className="col-xl-2 col-md-4 d-flex aos-init aos-animate" data-aos="fade-up" data-aos-delay="800" >
      <img src={OurApproach}  className="img-fluid animated" alt=""/>
    </div>

      </div>
      </div>
    </section>
    <br/>

    </div>
    );
}
export default About;