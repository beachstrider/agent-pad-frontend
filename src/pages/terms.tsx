import React, { useState, useCallback, useRef, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import SEO from '@/components/seo/SEO';

const PrivacyPolicy: React.FC = () => {
    return (
      <Layout>
        <div className="md:shine-overlay"></div>
        <div className='card p-5 md:p-10 mb-5'>
          <p className='font-title text-title text-xl mb-2.5'>Terms and Conditions</p>
          <p className='font-semibold text-title mb-5'>January 10th, 2025</p>
          <div className='text-title'>
            <p className='font-semibold text-title'>1. Use of the Service</p>
            <div>
              <ul className='list-disc ml-8'>
                <li>You must be at least 18 years old or the age of majority in your jurisdiction to use Agent Pad.</li>
                <li>You agree to use the Service in compliance with all applicable laws and regulations.</li>
                <li>You are responsible for maintaining the confidentiality of your account and password.</li>
              </ul>
            </div>
            <br/>
            <p className='font-semibold text-title'>2. Prohibited Activities</p>
            <div>
              <p className='ml-3'>You agree not to:</p>
              <ul className='list-disc ml-8'>
                <li>Use the Service for unlawful purposes.</li>
                <li>Attempt to disrupt or interfere with the platform’s operation.</li>
                <li>Submit false or misleading information.</li>
                <li>Reverse engineer or exploit the platform’s code or functionality.</li>
              </ul>
            </div>
            <br/>
            <p className='font-semibold text-title'>3. Intellectual Property</p>
            <div>
              <p className='ml-3'>All content, trademarks, and intellectual property on Agent Pad are owned by or licensed to us. You may not use or reproduce our intellectual property without prior written consent.</p>
            </div>
            <br/>
            <p className='font-semibold text-title'>4. Limitation of Liability</p>
            <div>
              <p className='ml-3'>To the maximum extent permitted by law, Agent Pad shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
            </div>
            <br/>
            <p className='font-semibold text-title'>5. Disclaimer of Warranties</p>
            <div>
              <p className='ml-3'>{'The Service is provided "as is" without any warranties, express or implied. We do not guarantee uninterrupted or error-free access to the platform.'}</p>
            </div>
            <br/>
            <p className='font-semibold text-title'>6. Termination</p>
            <div>
              <p className='ml-3'>We reserve the right to suspend or terminate your account at any time for violating these Terms or engaging in prohibited activities.</p>
            </div>
            <br/>
            <p className='font-semibold text-title'>7. Governing Law</p>
            <div>
              <p className='ml-3'>These Terms are governed by and construed in accordance with the laws of [Insert Jurisdiction].</p>
            </div>
            <br/>
            <p className='font-semibold text-title'>8. Changes to These Terms</p>
            <div>
              <p className='ml-3'>We may update these Terms from time to time. Changes will be effective upon posting to our website.</p>
            </div>
            <br/>
            <p className='font-semibold text-title'>9. Contact Us</p>
            <div>
              <p className='ml-3'>For questions or concerns about these Terms or the Privacy Policy, please contact us at [Insert Contact Email].</p>
            </div>
            <br/>
          </div>
        </div>
      </Layout>
    )
}

export default PrivacyPolicy;