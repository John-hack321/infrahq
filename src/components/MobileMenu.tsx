'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { name: 'About', href: '#' },
  { name: 'Blog', href: '#' },
  { name: 'Contact', href: '#' },
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      {/* Hamburger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 p-2 focus:outline-none"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <div className="w-6 flex flex-col items-end">
          <span className={`block h-0.5 w-6 bg-black transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1' : 'mb-1.5'}`}></span>
          <span className={`block h-0.5 ${isOpen ? 'w-0 opacity-0' : 'w-6'} bg-black transition-all duration-300 mb-1.5`}></span>
          <span className={`block h-0.5 ${isOpen ? '-rotate-45 -translate-y-1 w-6' : 'w-4'} bg-black transition-all duration-300`}></span>
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', ease: 'easeInOut' }}
            className="fixed inset-0 z-40 bg-white p-8 pt-24 flex flex-col items-center"
          >
            <nav className="flex flex-col items-center space-y-8 w-full">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-3xl font-bold text-emerald-600 hover:text-black transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
