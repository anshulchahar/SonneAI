'use client';

import Navigation from '@/components/Navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

export default function TermsPage() {
    const { isOpen } = useSidebar();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1E1E1E] transition-colors duration-200">
            <Navigation history={[]} />

            <div className={`pt-16 pb-8 w-full transition-all duration-300 ease-in-out ${isOpen ? 'pl-64' : 'pl-16'}`}>
                <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full">
                    <div className="mx-auto w-full max-w-4xl">
                        <div className="bg-white dark:bg-[#2C2C2C] border dark:border-[#333333] rounded-lg shadow-lg p-6 mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <DocumentTextIcon className="h-8 w-8 text-primary" />
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms & Policies</h1>
                            </div>

                            <div className="space-y-8">
                                <section>
                                    <div className="prose dark:prose-invert max-w-none">
                                        <p className="text-gray-700 dark:text-gray-200">
                                            These Terms and Conditions (“Agreement”) govern your access to and use of the SonneAI website and any of its related services and features (collectively, “Services”). This Agreement is legally binding between you (“User”, “you”, or “your”) and SonneAI (“we”, “us”, or “our”). By accessing or using the Services, you confirm that you have read, understood, and agree to be bound by this Agreement and our Privacy Policy.
                                        </p>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            If you are using the Services on behalf of a business or legal entity, you represent that you have the authority to bind that entity. If you do not agree to these terms, you may not access or use the Services.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">1. Description of Services</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            SonneAI is a web-based AI platform that analyzes uploaded PDF documents and provides insights through:
                                        </p>
                                        <ul className="list-disc pl-5 text-gray-900 dark:text-gray-100">
                                            <li>AI-powered document content extraction and analysis</li>
                                            <li>Visualization of analytical results</li>
                                            <li>Retrieval-Augmented Generation (RAG)-based chatbot interaction</li>
                                            <li>Document history and review capabilities</li>
                                        </ul>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            We are expanding support to additional formats such as DOCX and TXT. Services may be updated or modified without prior notice.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">2. User Accounts and Authentication</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            To access SonneAI, you must authenticate using Google Sign-In. By creating or accessing an account, you agree to:
                                        </p>
                                        <ul className="list-disc pl-5 text-gray-900 dark:text-gray-100">
                                            <li>Provide accurate and current information</li>
                                            <li>Maintain the confidentiality of your credentials</li>
                                            <li>Accept full responsibility for all activities under your account</li>
                                        </ul>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            We reserve the right to monitor new accounts and may suspend, disable, or delete any account for violations of these terms or other misuse. Re-registration following termination is not permitted without express written consent.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">3. User Content and Responsibilities</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            You retain full ownership of all content uploaded to SonneAI. However, by uploading documents, you grant us a limited, non-exclusive, revocable license to use your content solely for processing, analysis, service improvement, and internal testing.
                                        </p>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            You agree not to upload or use the Service to distribute content that:
                                        </p>
                                        <ul className="list-disc pl-5 text-gray-900 dark:text-gray-100">
                                            <li>Violates any laws or regulations</li>
                                            <li>Infringes intellectual property or privacy rights</li>
                                            <li>Contains malicious code, viruses, or attempts to compromise the platform</li>
                                            <li>Circumvents any authentication or access controls</li>
                                        </ul>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            Violation of these terms will result in immediate suspension or termination of your account and potential legal action.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">4. Data Privacy and Security</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            We take the privacy and security of your data seriously. All uploaded documents and associated data are:
                                        </p>
                                        <ul className="list-disc pl-5 text-gray-900 dark:text-gray-100">
                                            <li>Encrypted in transit and at rest</li>
                                            <li>Stored using secure, industry-standard practices</li>
                                            <li>Protected by controlled access and subject to regular security audits</li>
                                        </ul>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            No system is entirely immune from security breaches. By using the Services, you acknowledge and accept the inherent risks of data transmission over the internet. We do not share your documents or personal data with third parties, except as required by law.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">5. AI Usage and Limitations</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            SonneAI uses advanced machine learning models (e.g., Google Gemini) to generate insights. You understand that:
                                        </p>
                                        <ul className="list-disc pl-5 text-gray-900 dark:text-gray-100">
                                            <li>Outputs are generated probabilistically and may not always be accurate</li>
                                            <li>Results are provided “as-is” for informational purposes only</li>
                                            <li>The Service is not intended to replace professional, legal, medical, or financial advice</li>
                                        </ul>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            We do not guarantee the accuracy, completeness, or reliability of the results and disclaim any liability arising from reliance on AI-generated content.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">6. Free Plan Usage Limits</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            Free account holders may analyze up to five (5) documents per month. For extended capabilities, including unlimited analysis and premium features, please refer to our Pricing Plans.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">7. Prohibited Uses</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            You agree not to use the Website or Services to:
                                        </p>
                                        <ul className="list-disc pl-5 text-gray-900 dark:text-gray-100">
                                            <li>Commit unlawful or fraudulent acts</li>
                                            <li>Harm or exploit minors</li>
                                            <li>Interfere with or disrupt the operation of the platform</li>
                                            <li>Transmit malicious software or engage in data scraping</li>
                                            <li>Infringe on intellectual property rights</li>
                                            <li>Harass, abuse, or discriminate against others</li>
                                        </ul>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            We reserve the right to immediately suspend or terminate your access if you violate these restrictions.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">8. Intellectual Property Rights</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            All intellectual property rights related to SonneAI, including but not limited to trademarks, service marks, software, and content, are the exclusive property of SonneAI or its licensors. You may not copy, modify, distribute, or create derivative works without explicit permission.
                                        </p>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            Your use of the platform does not grant you any right or license to use SonneAI’s trademarks or content.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">9. Indemnification</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            You agree to indemnify, defend, and hold harmless SonneAI, its officers, directors, employees, affiliates, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of:
                                        </p>
                                        <ul className="list-disc pl-5 text-gray-900 dark:text-gray-100">
                                            <li>Your use of the Services</li>
                                            <li>Any content you upload or share</li>
                                            <li>Your violation of this Agreement or applicable laws</li>
                                        </ul>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">10. Limitation of Liability</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            To the maximum extent permitted by law, SonneAI shall not be liable for any indirect, incidental, special, or consequential damages, including:
                                        </p>
                                        <ul className="list-disc pl-5 text-gray-900 dark:text-gray-100">
                                            <li>Inability to use the Services</li>
                                            <li>Inaccurate or incomplete results</li>
                                            <li>Loss or unauthorized alteration of data</li>
                                        </ul>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            Our total liability shall be limited to the amount paid (if any) by you for the Services in the previous twelve (12) months.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">11. Modifications and Service Changes</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            We reserve the right to:
                                        </p>
                                        <ul className="list-disc pl-5 text-gray-900 dark:text-gray-100">
                                            <li>Modify or discontinue the Services at any time</li>
                                            <li>Upgrade models or add/remove features (including chatbots, file types)</li>
                                            <li>Change or amend these terms at our sole discretion</li>
                                        </ul>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            We will notify users of significant changes via email and/or announcements on the website. Continued use of the Services after such changes constitutes acceptance.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">13. Severability</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            If any provision of this Agreement is found to be unlawful, void, or unenforceable, the remaining provisions will remain in full force and effect.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">14. Third-Party Links and Services</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            SonneAI may include links to third-party services or websites. We are not responsible for their content, terms, or practices. Use them at your own risk and discretion.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">15. Acceptance of These Terms</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            By accessing and using SonneAI, you acknowledge that you have read, understood, and agreed to this Agreement. If you do not agree, you may not use the Services.
                                        </p>

                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">16. Contact</h3>
                                        <p className="text-gray-700 dark:text-gray-200">
                                            If you have any questions or concerns about these Terms and Conditions, please <a href="https://sonneai.com/contact" className="text-primary">contact us</a>.
                                        </p>
                                    </div>
                                </section>

                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-8 pt-4 border-t border-gray-200 dark:border-[#333333]">
                                    <p>Last updated: May 16, 2025</p>
                                    <p>For questions about our terms or policies, please <a href="https://sonneai.com/contact" className="text-primary">contact our support team</a>. </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}