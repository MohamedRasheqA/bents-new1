import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-12">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-[#169BD7]"></div>
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">Privacy Policy</h1>
          <p className="text-sm text-[#169BD7] text-center mb-6">Effective Date: 01/01/2025</p>
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-[#169BD7]"></div>
        </div>
        
        <div className="prose prose-lg prose-invert max-w-none">
          <div className="bg-gray-800/50 p-6 rounded-lg border border-[#169BD7]/20 shadow-lg mb-8">
            <p className="text-lg leading-relaxed">
              Bent's Assistant ("we," "us," or "our") is an AI-based chat assistant designed to help users better understand information about YouTube content posted by Jason Bent. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.
            </p>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="text-3xl font-bold text-[#169BD7] mb-6 flex items-center">
                <span className="bg-[#169BD7] w-8 h-8 rounded-full text-black text-lg flex items-center justify-center mr-3">1</span>
                Information We Collect
              </h2>
              <div className="bg-gray-800/30 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-[#169BD7]/90 mb-4">a. Information You Provide</h3>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li className="text-gray-200">Chat Content: The messages, queries, and interactions you share with the assistant.</li>
                  <li className="text-gray-200">Feedback: Any feedback or ratings you provide about your experience.</li>
                </ul>

                <h3 className="text-xl font-semibold text-[#169BD7]/90 mb-4">b. Automatically Collected Information</h3>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li className="text-gray-200">Device Information: Your device type, operating system, and browser type.</li>
                  <li className="text-gray-200">Usage Data: Details about how you interact with Bent's Assistant.</li>
                  <li className="text-gray-200">IP Address: For analytical and security purposes.</li>
                </ul>

                <h3 className="text-xl font-semibold text-[#169BD7]/90 mb-4">c. Third-Party Data</h3>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li className="text-gray-200">Bent's Assistant may access publicly available YouTube data related to Jason Bent's content.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-[#169BD7] mb-6 flex items-center">
                <span className="bg-[#169BD7] w-8 h-8 rounded-full text-black text-lg flex items-center justify-center mr-3">2</span>
                How We Use Your Information
              </h2>
              <div className="bg-gray-800/30 p-6 rounded-lg">
                <ul className="list-disc pl-6 space-y-2">
                  <li className="text-gray-200">Provide and improve the functionality of Bent's Assistant.</li>
                  <li className="text-gray-200">Personalize responses to better address your queries.</li>
                  <li className="text-gray-200">Monitor and analyze usage trends to improve performance.</li>
                  <li className="text-gray-200">Ensure compliance with applicable laws and our terms of use.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-[#169BD7] mb-6 flex items-center">
                <span className="bg-[#169BD7] w-8 h-8 rounded-full text-black text-lg flex items-center justify-center mr-3">3</span>
                Sharing Your Information
              </h2>
              <div className="bg-gray-800/30 p-6 rounded-lg">
                <p className="text-gray-200 mb-4">We do not sell, rent, or trade your information. We may share your information in the following circumstances:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li className="text-gray-200">Service Providers: With third-party providers who assist in maintaining or enhancing the service.</li>
                  <li className="text-gray-200">Legal Compliance: When required to comply with laws, regulations, or legal processes.</li>
                  <li className="text-gray-200">Business Transfers: In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-[#169BD7] mb-6 flex items-center">
                <span className="bg-[#169BD7] w-8 h-8 rounded-full text-black text-lg flex items-center justify-center mr-3">4</span>
                Data Retention
              </h2>
              <div className="bg-gray-800/30 p-6 rounded-lg">
                <p className="text-gray-200 mb-6">
                  We retain information for as long as necessary to fulfill the purposes outlined in this policy or as required by law. Anonymized usage data may be stored indefinitely for analysis.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-[#169BD7] mb-6 flex items-center">
                <span className="bg-[#169BD7] w-8 h-8 rounded-full text-black text-lg flex items-center justify-center mr-3">5</span>
                Data Security
              </h2>
              <div className="bg-gray-800/30 p-6 rounded-lg">
                <p className="text-gray-200 mb-6">
                  We implement industry-standard security measures to protect your information. However, no system can guarantee complete security, and we cannot ensure or warrant the security of your data.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-[#169BD7] mb-6 flex items-center">
                <span className="bg-[#169BD7] w-8 h-8 rounded-full text-black text-lg flex items-center justify-center mr-3">6</span>
                Your Privacy Choices
              </h2>
              <div className="bg-gray-800/30 p-6 rounded-lg">
                <ul className="list-disc pl-6 space-y-2">
                  <li className="text-gray-200">Opt-Out: You can stop using Bent's Assistant at any time to prevent further data collection.</li>
                  <li className="text-gray-200">Access and Deletion: You may request access to or deletion of your personal data by contacting us at <a href="mailto:hello@bentsassistant.com" className="text-[#169BD7] hover:underline">hello@bentsassistant.com</a></li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-[#169BD7] mb-6 flex items-center">
                <span className="bg-[#169BD7] w-8 h-8 rounded-full text-black text-lg flex items-center justify-center mr-3">7</span>
                Children's Privacy
              </h2>
              <div className="bg-gray-800/30 p-6 rounded-lg">
                <p className="text-gray-200 mb-6">
                  Bent's Assistant is not intended for use by individuals under the age of 13. We do not knowingly collect personal information from children. If we become aware that a child's information has been collected, we will delete it immediately.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-[#169BD7] mb-6 flex items-center">
                <span className="bg-[#169BD7] w-8 h-8 rounded-full text-black text-lg flex items-center justify-center mr-3">8</span>
                Changes to This Privacy Policy
              </h2>
              <div className="bg-gray-800/30 p-6 rounded-lg">
                <p className="text-gray-200 mb-6">
                  We may update this Privacy Policy from time to time. Changes will be effective immediately upon posting the revised policy. Your continued use of Bent's Assistant signifies your acceptance of the updated terms.
                </p>
              </div>
            </section>

            <section className="bg-gradient-to-r from-[#169BD7]/10 to-gray-800/30 p-8 rounded-lg border border-[#169BD7]/20">
              <h2 className="text-3xl font-bold text-[#169BD7] mb-6">Contact Us</h2>
              <p className="text-gray-200 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <a 
                href="mailto:hello@bentsassistant.com" 
                className="inline-block bg-[#169BD7] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#169BD7]/80 transition-colors duration-300"
              >
                hello@bentsassistant.com
              </a>
            </section>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-400 italic">
              Thank you for trusting Bent's Assistant. We are committed to protecting your privacy while delivering a helpful and engaging user experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 