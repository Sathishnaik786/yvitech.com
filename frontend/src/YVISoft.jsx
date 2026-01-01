import About from "./components/About/About";
import TeamDetail from "./components/TeamDetail/TeamDetail";
import Client from "./components/Client/Client";
import Contact from "./components/Contact/Contact";
import Footer from "./components/Footer/Footer";
import Header from "./components/Header/Header";
import Home from "./components/Home/Home";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import OracleHCM from "./components/Services/OracleHCM/OracleHCM";
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useLocation } from "react-router-dom";

import { useEffect } from "react";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
import OracleSCM from "./components/Services/OracleSCM/OracleSCM";
import OracleFinancials from "./components/Services/OracleFinancials/OracleFinancials";
import OracleOtherStreams from "./components/Services/OracleOtherStreams/OracleOtherStreams";
import AI_Data from "./components/Services/AI_Data/AI_Data";
import RPAServices from "./components/Services/RPAServices/RPAServices";
import UI_UX from "./components/Services/UI_UX_Design/UI_UX";
import MobileAppDevelopment from "./components/Services/MobileAppDevelopment/MobileAppDevelopment";
import WebDevelopment from "./components/Services/WebDevelopment/WebDevelopment";
import Salesforce from "./components/Services/Salesforce/Salesforce";
import SAP from "./components/Services/SAP/SAP";
import ManagedServices from "./components/Services/ManagedServices/ManagedServices";

import Arrow from "./components/Arrow/Arrow";
import DigitalMarketing from "./components/Services/DigitalMarketing/DigitalMarketing";
import ChatWidget from "./components/Chat/ChatWidget";


const YVISoft = () => {
  const location = useLocation();

  const isTeamDetailPage = location.pathname.startsWith("/team/");


  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: true,
      offset: 0,
    });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      AOS.refresh();
    }, 50);

    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <>
      <ScrollToTop />
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/team/:id" element={<TeamDetail />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/oracle-hcm" element={<OracleHCM />} />
        <Route path="/oracle-scm" element={<OracleSCM />} />
        <Route path="/oracle-financials" element={<OracleFinancials />} />
        <Route path="/other-core-capabilities" element={<OracleOtherStreams />} />
        <Route path="/ai-and-data-platform" element={<AI_Data />} />
        <Route path="/rpa-services" element={<RPAServices />} />
        <Route path="/ui-ux-design" element={<UI_UX />} />
        <Route path="/web-development" element={<WebDevelopment />} />
        <Route path="/mobile-app-development" element={<MobileAppDevelopment />} />
        <Route path="/digital-marketing" element={<DigitalMarketing />} />
        <Route path="/managed-services" element={<ManagedServices />} />
        <Route path="/salesforce" element={<Salesforce />} />
        <Route path="/sap" element={<SAP />} />
      </Routes>

      {!isTeamDetailPage && <Client />}

      <Footer />
      <Arrow />
      <ChatWidget />
    </>
  );
};

export default YVISoft;