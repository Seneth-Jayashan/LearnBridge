import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiFacebook, 
  FiTwitter, 
  FiInstagram, 
  FiLinkedin, 
  FiMail, 
  FiPhone, 
  FiMapPin 
} from 'react-icons/fi';
import LogoImage from '../assets/Learn Bridge Logo 2.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* --- Brand & Mission --- */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6 group w-max">
              <img 
                src={LogoImage} 
                alt="LearnBridge Logo" 
                className="w-10 h-10 rounded-xl object-cover shadow-sm group-hover:rotate-3 transition-transform" 
              />
              <span className="text-2xl font-extrabold tracking-tight bg-linear-to-r from-[#0E2A47] to-[#207D86] bg-clip-text text-transparent">
                LearnBridge
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm mb-8 font-medium">
              Empowering rural Sri Lanka by bridging the gap between passionate educators, generous donors, and students in need of quality education.
            </p>
            <div className="flex gap-3">
              <SocialLink href="#" icon={FiFacebook} ariaLabel="Facebook" />
              <SocialLink href="#" icon={FiTwitter} ariaLabel="Twitter" />
              <SocialLink href="#" icon={FiInstagram} ariaLabel="Instagram" />
              <SocialLink href="#" icon={FiLinkedin} ariaLabel="LinkedIn" />
            </div>
          </div>

          {/* --- Quick Links --- */}
          <div>
            <h4 className="text-[#0A1D32] font-black mb-6 uppercase text-sm tracking-widest">Quick Links</h4>
            <ul className="space-y-4">
              <FooterLink to="/register-donor">Donate Now</FooterLink>
              <FooterLink to="/register-teacher">Join as Teacher</FooterLink>
              <FooterLink to="/knowledge-base">Knowledge Base</FooterLink>
              <FooterLink to="/about">About Us</FooterLink>
            </ul>
          </div>

          {/* --- Contact Information --- */}
          <div>
            <h4 className="text-[#0A1D32] font-black mb-6 uppercase text-sm tracking-widest">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-500 text-sm font-medium hover:text-[#207D86] transition-colors cursor-pointer w-max">
                <div className="p-2 bg-[#207D86]/10 rounded-lg text-[#207D86]">
                  <FiMail size={16} />
                </div>
                hello@learnbridge.lk
              </li>
              <li className="flex items-center gap-3 text-slate-500 text-sm font-medium hover:text-[#207D86] transition-colors cursor-pointer w-max">
                <div className="p-2 bg-[#207D86]/10 rounded-lg text-[#207D86]">
                  <FiPhone size={16} />
                </div>
                +94 11 234 5678
              </li>
              <li className="flex items-start gap-3 text-slate-500 text-sm font-medium">
                <div className="p-2 bg-[#207D86]/10 rounded-lg text-[#207D86] shrink-0 mt-0.5">
                  <FiMapPin size={16} />
                </div>
                <span>123 Innovation Drive,<br/>Colombo 00300, Sri Lanka</span>
              </li>
            </ul>
          </div>
        </div>

        {/* --- Bottom Legal Bar --- */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm font-semibold text-center md:text-left tracking-wide">
            © {currentYear} OneX Universe (Pvt) Ltd. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-400 font-semibold tracking-wide">
            <Link to="/privacy" className="hover:text-[#207D86] transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#207D86] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Helper component for standardizing text links
const FooterLink = ({ to, children }) => (
  <li>
    <Link 
      to={to} 
      className="text-slate-500 hover:text-[#207D86] hover:translate-x-1 inline-block transition-all duration-300 text-sm font-semibold"
    >
      {children}
    </Link>
  </li>
);

// Helper component for social media buttons
const SocialLink = ({ href, icon: Icon, ariaLabel }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer"
    aria-label={ariaLabel}
    className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-[#207D86] hover:border-[#207D86] hover:text-white transition-all duration-300 hover:-translate-y-1 shadow-sm"
  >
    <Icon size={18} />
  </a>
);

export default Footer;