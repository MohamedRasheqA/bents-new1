'use client';

import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} Bent's Woodworking Assistant. All rights reserved.
          </p>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link 
                  href="/"
                  className="text-sm hover:text-gray-300 transition-colors cursor-pointer"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy"
                  className="text-sm hover:text-gray-300 transition-colors cursor-pointer"
                >
                  Privacy
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
