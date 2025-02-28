import React from 'react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';
import { Ban } from 'lucide-react';

const Custom404: React.FC = () => {
    return (
      <Layout>
        <SEO 
          title="404 - Oops! Page Missing | Agent Pad"
          description="The page you&apos;re searching for isn&apos;t available yet or may still be under review."
        />
        <div className="flex flex-col items-center justify-start px-4 text-center pt-20 sm:pt-32 pb-10">
          <Ban className="w-16 h-16 sm:w-20 sm:h-20 text-red-500 mb-3" />
          <h1 className="text-xl sm:text-2xl font-bold text-blue-400 mb-4">Not Found</h1>
          <p className="text-[10px] sm:text-xs text-gray-300 mb-5 max-w-xs sm:max-w-sm">
            Please check back soon. The content you&apos;re looking for might still be on its way or may not exist.
          </p>
          <Link href="/" passHref>
            <button className="bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-bold py-2 px-3 rounded transition duration-300">
              Return Home
            </button>
          </Link>
        </div>
      </Layout>
    );
};

export default Custom404;