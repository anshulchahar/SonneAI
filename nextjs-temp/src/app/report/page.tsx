'use client';

import { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import Navigation from '@/components/Navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import CustomSelect, { SelectOption } from '@/components/CustomSelect';
import ValidatedInput from '@/components/ValidatedInput';
import ErrorMessage from '@/components/ErrorMessage';

export default function ReportPage() {
    const { isOpen } = useSidebar();

    // Initialize EmailJS
    useEffect(() => {
        emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_USER_ID!);
    }, []);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        contentType: '',
        url: '',
        details: ''
    });
    const [formErrors, setFormErrors] = useState({
        name: '',
        email: '',
        contentType: '',
        url: '',
        details: ''
    });
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

    const contentTypeOptions: SelectOption[] = [
        { value: 'copyright', label: 'Copyright Infringement' },
        { value: 'harmful', label: 'Harmful or Dangerous Content' },
        { value: 'hateful', label: 'Hate Speech or Harassment' },
        { value: 'personal', label: 'Personal Information' },
        { value: 'other', label: 'Other Illegal Content' }
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Mark field as touched
        if (!touchedFields[name]) {
            setTouchedFields(prev => ({ ...prev, [name]: true }));
        }

        // Clear error when user types
        if (formErrors[name as keyof typeof formErrors]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name } = e.target;

        // Mark field as touched
        setTouchedFields(prev => ({ ...prev, [name]: true }));

        // Validate field on blur
        validateField(name, formData[name as keyof typeof formData]);
    };

    const validateField = (name: string, value: string) => {
        let error = '';

        switch (name) {
            case 'name':
                if (!value.trim()) {
                    error = 'Name is required';
                } else if (value.trim().length < 2) {
                    error = 'Name must be at least 2 characters';
                }
                break;
            case 'email':
                if (!value.trim()) {
                    error = 'Email is required';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    error = 'Please enter a valid email address';
                }
                break;
            case 'contentType':
                if (!value) {
                    error = 'Please select a content type';
                }
                break;
            case 'url':
                if (!value.trim()) {
                    error = 'URL is required';
                }
                break;
            case 'details':
                if (!value.trim()) {
                    error = 'Details are required';
                } else if (value.trim().length < 10) {
                    error = 'Please provide more details (at least 10 characters)';
                }
                break;
            default:
                break;
        }

        setFormErrors(prev => ({ ...prev, [name]: error }));
        return error === '';
    };

    const validateForm = () => {
        // Mark all fields as touched
        const allFields = { name: true, email: true, contentType: true, url: true, details: true };
        setTouchedFields(allFields);

        // Validate all fields
        let isValid = true;
        Object.entries(formData).forEach(([name, value]) => {
            const fieldValid = validateField(name, value);
            if (!fieldValid) isValid = false;
        });

        return isValid;
    };

    const handleSelectChange = (name: string) => (value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));

        // Mark field as touched
        setTouchedFields(prev => ({ ...prev, [name]: true }));

        // Validate select field
        validateField(name, value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all fields before submitting
        if (!validateForm()) {
            return;
        }

        setSubmitStatus('submitting');

        // Prepare template parameters for EmailJS
        const templateParams = {
            name: formData.name,
            email: formData.email,
            subject: `Report: ${contentTypeOptions.find(option => option.value === formData.contentType)?.label || formData.contentType}`,
            message: `URL: ${formData.url}\n\nDetails: ${formData.details}`,
            // Add these additional fields that might be expected by your template
            to_name: "Sonne Support Team",
            from_name: formData.name,
            reply_to: formData.email,
            report_type: contentTypeOptions.find(option => option.value === formData.contentType)?.label || formData.contentType,
            report_url: formData.url,
            report_details: formData.details
        };

        console.log('EmailJS params:', templateParams);
        console.log('Using service ID:', process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID);
        console.log('Using template ID:', process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID);

        // Send email using EmailJS
        emailjs.send(
            process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
            process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
            templateParams
        )
            .then((response) => {
                console.log('Report email sent successfully!', response.status, response.text);
                setSubmitStatus('success');
                setFormData({
                    name: '',
                    email: '',
                    contentType: '',
                    url: '',
                    details: ''
                });
                // Reset touched fields
                setTouchedFields({});
            })
            .catch((err) => {
                console.error('Failed to send report email. Error details:', err);
                if (err.text) console.error('Error text:', err.text);
                setSubmitStatus('error');
            });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#1E1E1E] transition-colors duration-200">
            <Navigation history={[]} />

            <div className={`pt-16 pb-8 w-full transition-all duration-300 ease-in-out ${isOpen ? 'pl-64' : 'pl-16'}`}>
                <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full">
                    <div className="mx-auto w-full max-w-4xl">
                        <div className="bg-white dark:bg-[#2C2C2C] border dark:border-[#333333] rounded-lg shadow-lg p-6 mb-8">
                            <div className="flex items-center mb-6">
                                <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Report Illegal Content</h1>
                            </div>

                            <div className="space-y-6">
                                <div className="text-lg text-gray-700 dark:text-gray-200 mb-8">
                                    <p>
                                        We take reports of illegal or harmful content seriously. Please provide as much detail as possible to help us investigate the matter efficiently.
                                    </p>
                                </div>

                                {submitStatus === 'success' ? (
                                    <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 p-6 rounded-lg border border-green-200 dark:border-green-800/30">
                                        <h3 className="text-lg font-medium">Report submitted successfully</h3>
                                        <p className="mt-2">Thank you for bringing this to our attention. Our team will review your report and take appropriate action as soon as possible.</p>
                                        <p className="mt-2">If necessary, we may contact you for additional information using the email address you provided.</p>
                                        <button
                                            onClick={() => setSubmitStatus('idle')}
                                            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                        >
                                            Submit another report
                                        </button>
                                    </div>
                                ) : submitStatus === 'error' ? (
                                    <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-6 rounded-lg border border-red-200 dark:border-red-800/30">
                                        <h3 className="text-lg font-medium">Failed to submit report</h3>
                                        <p className="mt-2">There was an error submitting your report. Please try again or contact us directly.</p>
                                        <button
                                            onClick={() => setSubmitStatus('idle')}
                                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                        >
                                            Try again
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                            <ValidatedInput
                                                label="Your Name"
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                error={touchedFields.name ? formErrors.name : ''}
                                                required
                                                placeholder="John Doe"
                                                className="px-3 py-2 bg-white dark:bg-[#3A3A3A] text-gray-900 dark:text-white transition-colors"
                                            />

                                            <ValidatedInput
                                                label="Email Address"
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                error={touchedFields.email ? formErrors.email : ''}
                                                required
                                                placeholder="john@example.com"
                                                helpText="We'll never share your email"
                                                className="px-3 py-2 bg-white dark:bg-[#3A3A3A] text-gray-900 dark:text-white transition-colors"
                                            />
                                        </div>

                                        <div>
                                            <CustomSelect
                                                id="contentType"
                                                name="contentType"
                                                label="Type of Content"
                                                value={formData.contentType}
                                                onChange={handleSelectChange('contentType')}
                                                options={contentTypeOptions}
                                                required
                                                placeholder="Please select"
                                            />
                                            {touchedFields.contentType && formErrors.contentType && (
                                                <ErrorMessage message={formErrors.contentType} className="mt-1" />
                                            )}
                                        </div>

                                        <div>
                                            <ValidatedInput
                                                label="URL or Location of Content"
                                                type="text"
                                                id="url"
                                                name="url"
                                                value={formData.url}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                error={touchedFields.url ? formErrors.url : ''}
                                                required
                                                placeholder="https://example.com/page-with-content"
                                                className="px-3 py-2 bg-white dark:bg-[#3A3A3A] text-gray-900 dark:text-white transition-colors"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="details" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                                Details of the Report <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                id="details"
                                                name="details"
                                                rows={5}
                                                value={formData.details}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                required
                                                placeholder="Please provide specific details about why this content is illegal or harmful"
                                                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none bg-white dark:bg-[#3A3A3A] text-gray-900 dark:text-white transition-colors ${touchedFields.details && formErrors.details
                                                    ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500'
                                                    : 'border-gray-300 dark:border-[#333333] focus:ring-primary focus:border-primary'
                                                    }`}
                                            />
                                            {touchedFields.details && formErrors.details && (
                                                <ErrorMessage message={formErrors.details} className="mt-1" />
                                            )}
                                        </div>

                                        <div className="bg-gray-50 dark:bg-[#1E1E1E] p-4 rounded-lg border border-gray-200 dark:border-[#333333]">
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                By submitting this report, you acknowledge that all information provided is accurate to the best of your knowledge. False reports may result in account restrictions.
                                            </p>
                                        </div>

                                        <div>
                                            <button
                                                type="submit"
                                                disabled={submitStatus === 'submitting'}
                                                className={`inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors ${submitStatus === 'submitting' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            >
                                                {submitStatus === 'submitting' ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    'Submit Report'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}