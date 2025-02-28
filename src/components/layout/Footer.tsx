import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Footer: React.FC = () => {
  return (
    <footer className="z-10 bg-dark">
      <div className='main-wrapper py-5 text-center md:py-2.5 mt-auto w-full md:flex space-y-5 md:space-y-0 justify-between items-center'>
        <div className='flex justify-center'>
          <Link href="/" className="flex items-center gap-2 h-full">
            <Image
              src="/logo/logo.png"
              alt="Agent Pad Logo"
              width={21.3}
              height={24}
            />
            <span className="text-title font-title mt-1">AGENT PAD</span>
          </Link>
        </div>
        <p className="hidden md:block text-sm text-subtext">
          © {new Date().getFullYear()} Agent Pad. All rights reserved.
        </p>
        <div className='flex gap-5 text-primary text-sm justify-center'>
          <Link href="/policy">Privacy Policy</Link>
          <Link href="/terms">Terms of use</Link>
        </div>
        <p className="md:hidden block text-sm text-subtext">
          © {new Date().getFullYear()} Agent Pad. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;