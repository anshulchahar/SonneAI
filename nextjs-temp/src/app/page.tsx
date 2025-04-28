'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import FileUpload from '@/components/FileUpload';
import AnalysisResults from '@/components/AnalysisResults';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ProgressBar from '@/components/ProgressBar';
import Navigation from '@/components/Navigation';
import PromptInputBar from '@/components/PromptInputBar';
import { AnalysisResult, AnalysisHistory } from '@/types/api';
import { AnalysisData } from '@/types/analysis';
import { useSidebar } from '@/contexts/SidebarContext';
import OutputLengthSlider from '@/components/OutputLengthSlider';

// Define a type for the debug info
interface DebugInfo {
  [key: string]: string | number | boolean | null | DebugInfo | Array<string | number | boolean | DebugInfo>;
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [savedPrompt, setSavedPrompt] = useState<string>('');
  const [customPromptUsed, setCustomPromptUsed] = useState<boolean>(false);
  const [outputLength, setOutputLength] = useState(500); // Default output length
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const { data: session } = useSession();
  const { isOpen } = useSidebar();

  // References for measuring button dimensions
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonDimensions, setButtonDimensions] = useState({ width: 0, left: 0 });

  // Effect to measure the button dimensions
  useEffect(() => {
    const updateButtonMeasurements = () => {
      if (buttonRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const parentRect = buttonRef.current.parentElement?.getBoundingClientRect() || { left: 0 };

        // Calculate relative position within parent
        const relativeLeft = buttonRect.left - parentRect.left;

        setButtonDimensions({
          width: buttonRect.width,
          left: relativeLeft
        });
      }
    };

    // Set initial measurements
    updateButtonMeasurements();

    // Update measurements on window resize
    window.addEventListener('resize', updateButtonMeasurements);
    return () => window.removeEventListener('resize', updateButtonMeasurements);
  }, [files.length]); // Re-measure when files array changes, as it might affect button text

  useEffect(() => {
    // Fetch user's history when logged in
    if (session?.user) {
      fetchHistory();
    }
  }, [session]);

  // Clear errors when files change
  useEffect(() => {
    if (files.length > 0) {
      setAnalyzeError(null);
    }
  }, [files]);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleFilesAdded = (newFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    setError(null);
    setAnalyzeError(null);
    setDebugInfo(null);
  };

  const handleFileRemoved = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setError(null);
    setAnalyzeError(null);
    setDebugInfo(null);
  };

  const handleCustomPromptChange = (prompt: string) => {
    setCustomPrompt(prompt);
    setPromptError(null);
  };

  const handleOutputLengthChange = (length: number) => {
    setOutputLength(length);
  };

  const handleSendPrompt = () => {
    if (customPrompt.trim()) {
      setSavedPrompt(customPrompt.trim());
      setCustomPrompt(''); // Clear the input after sending
      setPromptError(null);
    } else {
      setPromptError('Please enter instructions before sending');
    }
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      setAnalyzeError('Please upload at least one document before analyzing');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setError(null);
    setAnalyzeError(null);
    setPromptError(null);
    setDebugInfo(null);

    // Track whether a custom prompt was used
    setCustomPromptUsed(savedPrompt.length > 0);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('pdfFiles', file);
      });

      // Add the saved custom prompt to the formData if provided
      if (savedPrompt) {
        formData.append('customPrompt', savedPrompt);
      }

      // Add output length parameter to the request
      formData.append('outputLength', outputLength.toString());

      // Add a progress event listener
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/analyze-complete', true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      };

      xhr.onload = function () {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          setAnalysisResult(result);
          // If user is logged in, refresh history to include the new analysis
          if (session?.user) {
            fetchHistory();
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse.error === 'PDF cannot be processed') {
              // Show toast message for PDF processing error
              setError('PDF cannot be processed; Reasons: File may be password protected, is a scanned image or corrupt.');
              // Clear files to allow new upload
              setFiles([]);
            } else {
              setError(errorResponse.error || 'An error occurred during analysis');
              setDebugInfo(errorResponse.details || null);
            }
          } catch {
            setError('Failed to analyze document');
          }
        }
        setIsAnalyzing(false);
      };

      xhr.onerror = function () {
        setError('Failed to connect to the server');
        setIsAnalyzing(false);
      };

      // Send the form data
      xhr.send(formData);
    } catch {
      setError('An error occurred');
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setFiles([]);
    setCustomPrompt('');
    setSavedPrompt('');
    setProgress(0);
    setError(null);
    setAnalyzeError(null);
    setPromptError(null);
    setDebugInfo(null);
    setCustomPromptUsed(false);
    // Don't reset output length to preserve user preference
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1E1E1E] transition-colors duration-200">
      <Navigation
        history={history}
        onHistoryUpdated={fetchHistory}
      />

      <div className={`pt-16 pb-24 w-full transition-all duration-300 ease-in-out ${isOpen ? 'pl-64' : 'pl-16'}`}>
        <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full">
          <div className="mx-auto w-full md:w-[90%] lg:w-[85%] xl:w-[90%] 2xl:w-[95%]">
            {!analysisResult ? (
              <div className="shadow-sm rounded-lg p-6 pb-8 mt-8 dark:bg-[#1E1E1E] bg-gray-50">
                {isAnalyzing ? (
                  <div className="space-y-6">
                    <ProgressBar progress={progress} />
                    <div className="text-center">
                      <LoadingSpinner message="Analyzing your document..." />
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        This may take a minute depending on the document size
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <FileUpload
                      files={files}
                      onFilesAdded={handleFilesAdded}
                      onFileRemoved={handleFileRemoved}
                      disabled={isAnalyzing}
                    />

                    {error && (
                      <div className="mt-4">
                        <ErrorMessage message={error} />

                        {debugInfo && (
                          <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 text-xs font-mono text-gray-700 dark:text-gray-200 rounded overflow-auto max-h-40">
                            <details>
                              <summary className="cursor-pointer text-gray-800 dark:text-gray-100">Debug Info</summary>
                              <div className="text-gray-700 dark:text-gray-200">
                                {typeof debugInfo === 'object' ? JSON.stringify(debugInfo, null, 2) : String(debugInfo)}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Custom Prompt Indicator */}
                    {savedPrompt && (
                      <div className="mt-4 p-3 rounded-md bg-primary/10 border border-primary/20 dark:bg-primary/5">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8zm-1.25 0c0 3.726-3.024 6.75-6.75 6.75s-6.75-3.024-6.75-6.75S7.274 3.25 11 3.25s6.75 3.024 6.75 6.75zM10.47 7.72a.75.75 0 00-1.44 0l-1 3.5a.75.75 0 001.44.41L9.9 10h2.2l.43 1.63a.75.75 0 101.44-.41l-1-3.5zM10.57 8.33L11 9.5h-2l.43-1.17.57-1.5.57 1.5z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3 flex-1">
                            <h3 className="text-sm font-medium text-primary">Custom Instructions Added</h3>
                            <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                              <p className="line-clamp-2">{savedPrompt}</p>
                            </div>
                            <button
                              onClick={() => {
                                setCustomPrompt(savedPrompt);
                                setSavedPrompt('');
                              }}
                              className="mt-1 text-xs text-primary hover:text-primary-dark"
                            >
                              Edit instructions
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Output Length Slider positioned above Analyze Document button */}
                    <div className="mt-6 mb-4 flex justify-center relative">
                      <div
                        className="w-full"
                        style={{
                          width: buttonDimensions.width > 0 ? `${buttonDimensions.width}px` : 'auto',
                          transition: 'width 0.2s ease'
                        }}
                      >
                        <OutputLengthSlider
                          value={outputLength}
                          onChange={handleOutputLengthChange}
                          min={100}
                          max={1000}
                          step={50}
                        />
                      </div>
                    </div>

                    <div className="mt-2">
                      <ErrorMessage message={analyzeError || ''} className="mb-3" />

                      <div className="flex justify-center">
                        <button
                          ref={buttonRef}
                          onClick={handleAnalyze}
                          disabled={isAnalyzing}
                          className={`px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                          <span className="brightness-110">Analyze Document</span>
                          {!session && <span className="brightness-110"> (Sign in to save results)</span>}
                        </button>
                      </div>
                    </div>

                    {!session && (
                      <div className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
                        Sign in to save your analysis results for future reference
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-6 shadow-sm rounded-lg p-6 dark:bg-[#1E1E1E] bg-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                  <div>
                    {customPromptUsed && (
                      <p className="text-sm text-primary dark:text-primary-light mt-1">
                        Custom instructions were applied to this analysis
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark transition-colors duration-200"
                  >
                    Analyze Another Document
                  </button>
                </div>
                <AnalysisResults analysis={{
                  ...analysisResult,
                  recommendations: analysisResult.recommendations || []
                } as unknown as AnalysisData} />
              </div>
            )}
          </div>
        </div>
      </div>

      {!analysisResult && !isAnalyzing && (
        <PromptInputBar
          customPrompt={customPrompt}
          onCustomPromptChange={handleCustomPromptChange}
          onAnalyze={handleSendPrompt}
          canAnalyze={true} // Always allow sending a prompt
          isAnalyzing={false}
          buttonText="Send"
          placeholder="Add specific instructions for analyzing your document (optional)..."
          helperText="Use this to add custom instructions for your analysis"
          errorMessage={promptError || ''}
        />
      )}
    </div>
  );
}
