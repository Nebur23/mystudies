import React, { useState } from 'react';
import {
  // Facebook,
  // Twitter,
  // Linkedin,
  // Instagram,
  // Youtube,
  ChevronDown,
  ExternalLink,
  Globe,
  Apple
} from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Facebook01Icon as Facebook, YoutubeIcon as Youtube } from '@hugeicons/core-free-icons';
import Logo from '~/components/logo';

// --- Data Structure for Links ---
type LinkItem = {
  label: string;
  href: string;
  external?: boolean;
};

type Column = {
  title: string;
  links: LinkItem[];
};

const FOOTER_DATA: Column[] = [
  {
    title: "FOR STUDENTS",
    links: [
      { label: "Past Papers", href: "/" },
      { label: "Courses", href: "/courses" },
      { label: "Learning experience", href: "/leaderboard" },
      { label: "Forums", href: "/forums" },
    ],
  },
  {
    title: "FOR EMPLOYERS",
    links: [
      { label: "Training and recruitment solutions", href: "/employers/solutions" },
      { label: "Enhance your knowledge", href: "/employers/knowledge" },
      { label: "Promote hard and soft skills", href: "/employers/skills" },
      { label: "Employers blog", href: "/employers/blog", external: true },
    ],
  },
  {
    title: "SUPPORT",
    links: [
      { label: "Contact us", href: "masteryourstudies100@gmail.com" },
      { label: "FAQ", href: "/support/faq", external: true },
    ],
  },
  {
    title: "MASTERYOURSTUDIES",
    links: [
      { label: "What we do", href: "/about-us" },
      { label: "Sponsorships", href: "/sponsorships" },
      { label: "Become a Lecturer", href: "/become-lecturer" },
    ],
  },
];

// --- Sub-components ---

const SocialIcons = () => (
  <div className="flex gap-3 mb-6">
    {[
       { icon: Facebook, href: "#" },
       //{ icon: Twitter, href: "#" }, // X logo
       //{ icon: Linkedin, href: "#" },
//{ icon: Instagram, href: "#" },
       { icon: Youtube, href: "#" },
    ].map((social, idx) => (
      <a
        key={idx}
        href={social.href}
        className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:border-purple-500 hover:text-purple-500 transition-colors"
        aria-label="Social media link"
      >

        <HugeiconsIcon icon={social.icon} />
      </a>
    ))}
  </div>
);

const LanguageSelector = () => (
  <div className="mb-6">
    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Language</h3>
    <div className="relative group cursor-pointer w-full md:w-48">
      <div className="flex items-center gap-2 text-slate-600 pb-1 border-b border-transparent hover:border-purple-400 transition-colors">
        <Globe size={16} />
        <span>English</span>
        <ChevronDown size={16} className="ml-auto" />
      </div>
    </div>
  </div>
);

const CertificationBadges = () => (
  <div className="flex flex-col gap-4 mt-4">
    {/* App Store Button Simulation */}
    <a href="#" className="flex items-center border border-slate-900 rounded-lg px-3 py-1 w-fit hover:bg-slate-50 transition">
      <Apple size={24} className="text-slate-900 mr-2" />
      <div className="flex flex-col leading-none">
        <span className="text-xs font-semibold text-slate-600">Download on the</span>
        <span className="text-lg font-bold text-slate-900">App Store</span>
      </div>
    </a>

    {/* B Corp Badge Simulation */}
    <div className="flex items-start gap-3 mt-2">
      <div className="font-bold text-xl leading-none">Certified<br /><span className="text-4xl border-2 border-slate-900 rounded-full w-14 h-14 flex items-center justify-center font-black">B</span><br />Corporation</div>
      <p className="text-xs text-slate-600 max-w-[150px]">
        This company meets high standards of social and environmental impact.
      </p>
    </div>
  </div>
);

const MobileAccordionSection = ({ column }: { column: Column }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex justify-between items-center text-left focus:outline-none"
      >
        <span className="font-bold text-sm uppercase tracking-wider text-slate-900">{column.title}</span>
        <ChevronDown 
          size={20} 
          className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      {isOpen && (
        <ul className="pb-4 pl-2 space-y-3 animate-in slide-in-from-top-2">
          {column.links.map((link) => (
            <li key={link.label}>
              <a 
                href={link.href} 
                className="text-slate-600 hover:text-purple-600 flex items-center gap-1 text-sm"
              >
                {link.label}
                {link.external && <ExternalLink size={12} />}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// --- Main Footer Component ---

export const Footer = () => {
  return (
    <footer className="bg-white text-slate-900 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* --- Top Section: Links --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">

          
          {/* Column 1: For Students */}
          <div>
            {/* Mobile View */}
            <div className="md:hidden">
              <MobileAccordionSection column={FOOTER_DATA[0]} />
            </div>
            {/* Desktop View */}
            <div className="hidden md:block">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                {FOOTER_DATA[0].title}
              </h3>
              <ul className="space-y-3">
                {FOOTER_DATA[0].links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-slate-600 hover:text-purple-600 flex items-center gap-1 text-sm">
                      {link.label}
                      {link.external && <ExternalLink size={12} />}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 2: For Employers */}
          {/* <div>
            <div className="md:hidden">
              <MobileAccordionSection column={FOOTER_DATA[1]} />
            </div>
            <div className="hidden md:block">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                {FOOTER_DATA[1].title}
              </h3>
              <ul className="space-y-3">
                {FOOTER_DATA[1].links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-slate-600 hover:text-purple-600 flex items-center gap-1 text-sm">
                      {link.label}
                      {link.external && <ExternalLink size={12} />}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div> */}

          {/* Column 3: Support & OpenClassrooms */}
          <div>
             {/* Mobile View: Stacked support and openclassrooms */}
             <div className="md:hidden">
              <MobileAccordionSection column={FOOTER_DATA[2]} />
              <MobileAccordionSection column={FOOTER_DATA[3]} />
            </div>
            {/* Desktop View */}
            <div className="hidden md:block">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">SUPPORT</h3>
              <ul className="space-y-3 mb-8">
                {FOOTER_DATA[2].links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-slate-600 hover:text-purple-600 flex items-center gap-1 text-sm">
                      {link.label}
                      {link.external && <ExternalLink size={12} />}
                    </a>
                  </li>
                ))}
              </ul>

              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">MASTERYOURSTUDIES</h3>
              <ul className="space-y-3">
                {FOOTER_DATA[3].links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-slate-600 hover:text-purple-600 text-sm">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 4: Language, Socials, Badges */}
          <div>
            {/* Mobile View: Always visible */}
            <div className=" md:border-none md:pb-0">
              <LanguageSelector />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Follow Us</h3>
              <SocialIcons />
            </div>
            
            {/* Desktop View: Hidden logic handled by layout in parent, but keeping specific order */}
             {/* Note: In desktop grid, this column usually sits on the right */}
          </div>
        </div>
        
        {/* --- Desktop Right Column Fix --- */}
        {/* Since the mobile accordion messes up the 4-column grid flow for the last column, 
            we explicitly render the language/socials column only on desktop using flex/grid order tricks 
            or just separate layout. Here is a cleaner approach for the desktop layout specifically. */}
        
        

        {/* --- Bottom Section: Logo & Legal --- */}
        <div className="mt-12 pt-8 border-t border-slate-200">
         <div className="flex items-center gap-2 mb-6 md:mb-0">
            <Logo className='max-h-14' /> <p>MASTERYOURSTUDIES</p>
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            {/* <a href="#" className="hover:text-slate-900">Legal information</a> */}
            <a href="#" className="hover:text-slate-900">Terms of use</a>
            <a href="#" className="hover:text-slate-900">Privacy policy</a>
            <a href="#" className="hover:text-slate-900">Cookies</a>
            {/* <a href="#" className="hover:text-slate-900">Accessibility statement</a> */}
            {/* <a href="#" className="hover:text-slate-900">Security</a> */}
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;