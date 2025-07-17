'use client';

import { useState } from 'react';

export default function SecurityBanner() {
  const [showSecurityBanner, setShowSecurityBanner] = useState(true);

  if (!showSecurityBanner) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-purple-600 text-white p-3 rounded-lg text-xs max-w-xs shadow-lg relative">
        <button 
          onClick={() => setShowSecurityBanner(false)}
          className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
          aria-label="Dismiss security notice"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-3.5 w-3.5" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        </button>
        <p className="font-medium pr-4">🔒 Secure Platform</p>
        <p className="opacity-90 mt-0.5">All conversations are encrypted and protected</p>
      </div>
    </div>
  );
} 