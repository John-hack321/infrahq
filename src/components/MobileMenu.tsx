'use client';

import { useEffect } from 'react';

interface MobileMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function MobileMenu({ isOpen, setIsOpen }: MobileMenuProps) {
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


    </div>
  );
}
