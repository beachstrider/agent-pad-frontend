import React, { useState, useCallback, useRef, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';

const PrivacyPolicy: React.FC = () => {
    return (
      <Layout>
        <div className="md:shine-overlay"></div>
        <div className='card p-5 md:p-10 mb-5'>
          <p className='font-title text-title text-xl mb-2.5'>Privacy Policy</p>
          <p className='font-semibold text-title mb-5'>January 10th, 2025</p>
          <div className='text-title'>
            <p>{'At Agent Pad ("we," "our," or "us"), your privacy is of utmost importance. This Privacy Policy outlines how we collect, use, and protect your information when you access and use our platform (the "Service"). By using Agent Pad, you agree to the terms of this Privacy Policy.'}</p>
            <br/>
            <p className='font-semibold text-title'>1. Information We Collect</p>
            <div>
              <p className='ml-3'>We may collect the following types of information:</p>
              <ul className='list-disc ml-8'>
                <li>Personal Information: Such as your name, email address, and payment information when you create an account, subscribe, or make a transaction.</li>
                <li>Usage Data: Information about your interactions with the platform, including IP addresses, browser type, operating system, and browsing activity.</li>
                <li>Cookies and Tracking Technologies: Data collected through cookies and similar technologies to improve your user experience.</li>
              </ul>
            </div>
            <br/>
            <p className='font-semibold text-title'>2. How We Use Your Information</p>
            <div>
              <p className='ml-3'>We use your information for the following purposes:</p>
              <ul className='list-disc ml-8'>
                <li>To provide and improve our Service.</li>
                <li>To communicate with you about updates, promotions, or support.</li>
                <li>To comply with legal obligations and enforce our terms.</li>
                <li>To analyze usage trends and enhance platform security.</li>
              </ul>
            </div>
            <br/>
            <p className='font-semibold text-title'>3. Sharing of Information</p>
            <div>
              <p className='ml-3'>We do not sell your personal information. We may share your information with third <br/>
                parties in the following cases:</p>
              <ul className='list-disc ml-8'>
                <li>With service providers assisting us in operating our platform.</li>
                <li>To comply with legal obligations or respond to lawful requests.</li>
                <li>To protect the rights, property, or safety of Agent Pad and its users.</li>
              </ul>
            </div>
            <br/>
            <p className='font-semibold text-title'>4. Security</p>
            <div>
              <p className='ml-3'>We implement industry-standard measures to safeguard your information. However, no<br/> 
              system is completely secure, and we cannot guarantee absolute security.</p>
            </div>
            <br/>
            <p className='font-semibold text-title'>5. Your Rights</p>
            <div>
              <p className='ml-3'>You may access, update, or delete your personal information by contacting us at<br/> 
              [Insert Contact Email].</p>
            </div>
            <br/>
            <p className='font-semibold text-title'>6. Changes to This Privacy Policy</p>
            <div>
              <ul className='list-disc ml-8'>
                <li>We reserve the right to modify this Privacy Policy at any time. Changes will be effective upon posting to our website.</li>
                <li>Terms and Conditions for Agent Pad</li>
                <li>Effective Date: [Insert Date]</li>
                <li>{'These Terms and Conditions ("Terms") govern your use of the Agent Pad platform ("Service"). By accessing or using Agent Pad, you agree to these Terms.'}</li>
              </ul>
            </div>
          </div>
        </div>
      </Layout>
    )
}

export default PrivacyPolicy;