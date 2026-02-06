'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import FileUpload from '@/components/FileUpload';
import AnalysisResults from '@/components/AnalysisResults';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ProgressBar from '@/components/ProgressBar';
import Navigation from '@/components/Navigation';
import PromptInputBar from '@/components/PromptInputBar';
import OutputLengthSlider from '@/components/OutputLengthSlider';
import DocumentLibrary, { RAGDocument } from '@/components/DocumentLibrary';
import RAGChatPanel from '@/components/RAGChatPanel';
import DocumentUploader from '@/components/DocumentUploader';
import { AnalysisResult, AnalysisHistory } from '@/types/api';
import { AnalysisData } from '@/types/analysis';
import { useSidebar } from '@/contexts/SidebarContext';

type ActiveTab = 'analyze' | 'chat';

interface DebugInfo {
  [key: string]: string | number | boolean | null | DebugInfo | Array<string | number | boolean | DebugInfo>;
}

export default function Home() {
  const { data: session } = useSession();
  const { isOpen } = useSidebar();
  const searchParams = useSearchParams();

  // --- Shared state ---
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const tab = searchParams.get('tab');
    return tab === 'chat' ? 'chat' : 'analyze';
  });
  const [history, setHistory] = useState<AnalysisHistory[]>([]);

  // --- Analyze state ---
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
  const [outputLength, setOutputLength] = useState(500);
  const [isIngesting, setIsIngesting] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);

  // --- Chat state ---
  const [ragDocuments, setRagDocuments] = useState<RAGDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // --- Effects ---
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'chat') {
      setActiveTab('chat');
    }
  }, [searchParams]);

  useEffect(() => {
    if (session?.user) {
      fetchHistory();
    }
  }, [session]);

  useEffect(() => {
    if (session?.user && activeTab === 'chat') {
      fetchRAGDocuments();
    }
  }, [session, activeTab]);

  useEffect(() => {
    if (files.length > 0) {
      setAnalyzeError(null);
    }
  }, [files]);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const fetchRAGDocuments = useCallback(async () => {
    if (!session?.user) return;
    setIsLoadingDocs(true);
    try {
      const res = await fetch('/api/rag/ingest');
      if (res.ok) {
        const data = await res.json();
        setRagDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Error fetching RAG documents:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  }, [session]);

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
      setCustomPrompt('');
      setPromptError(null);
    } else {
      setPromptError('Please enter instructions before sending');
    }
  };

  const handleUploadOnly = async () => {
    if (files.length === 0) {
      setAnalyzeError('Please upload at least one document');
      return;
    }

    setIsIngesting(true);
    setError(null);
    setAnalyzeError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const res = await fetch('/api/rag/ingest', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Upload failed');
      }

      const result = await res.json();
      // Check if any individual file had an error
      const failedFiles = result.documents?.filter((d: { error?: string }) => d.error) || [];
      if (failedFiles.length > 0) {
        const errorMsgs = failedFiles.map((f: { filename: string; error: string }) => `${f.filename}: ${f.error}`).join('\n');
        setError(`Some files failed to upload:\n${errorMsgs}`);
      }

      setFiles([]);
      setAnalyzeError(null);
      // Switch to chat tab after uploading
      setActiveTab('chat');
      fetchRAGDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsIngesting(false);
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
    setCustomPromptUsed(savedPrompt.length > 0);

    try {
      const formData = new FormData();
      const endpoint = '/api/analyze-complete';

      files.forEach((file) => formData.append('files', file));

      if (savedPrompt) {
        formData.append('customPrompt', savedPrompt);
      }

      formData.append('outputLength', outputLength.toString());

      const xhr = new XMLHttpRequest();
      xhr.open('POST', endpoint, true);

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

          if (session?.user) {
            fetchHistory();
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse.error === 'PDF cannot be processed') {
              setError('PDF cannot be processed; Reasons: File may be password protected, is a scanned image or corrupt.');
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
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1E1E1E] transition-colors duration-200">
      <Navigation history={history} onHistoryUpdated={fetchHistory} />

      <div className={`pt-16 h-[calc(100vh)] flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'pl-64' : 'pl-16'}`}>

        {/* ===== Tab Switcher ===== */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#252525]">
          <div className="flex">
            <button
              onClick={() => setActiveTab('analyze')}
              className={`relative flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors duration-200 ${activeTab === 'analyze'
                  ? 'text-primary dark:text-primary-light'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analyze
              {activeTab === 'analyze' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-primary-light rounded-t-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`relative flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors duration-200 ${activeTab === 'chat'
                  ? 'text-primary dark:text-primary-light'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Chat with Documents
              {ragDocuments.length > 0 && (
                <span className="ml-1 text-xs bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light px-1.5 py-0.5 rounded-full">
                  {ragDocuments.length}
                </span>
              )}
              {activeTab === 'chat' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-primary-light rounded-t-full" />
              )}
            </button>
          </div>
        </div>

        {/* ===== Tab Content ===== */}

        {/* --- Analyze Tab --- */}
        {activeTab === 'analyze' && (
          <div className="flex-1 overflow-y-auto pb-24">
            <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full">
              <div className="mx-auto w-full md:w-[90%] lg:w-[85%] xl:w-[90%] 2xl:w-[95%]">

                {analysisResult ? (
                  <div className="space-y-6 shadow-sm rounded-lg p-6 dark:bg-[#1E1E1E] bg-gray-50 mt-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                      <div>
                        {customPromptUsed && (
                          <p className="text-sm text-primary dark:text-primary-light mt-1">
                            Custom instructions were applied to this analysis
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setActiveTab('chat')}
                          className="px-4 py-2 text-sm font-medium text-primary border-2 border-primary rounded-md hover:bg-primary/10 transition-colors duration-200"
                        >
                          Chat with Documents
                        </button>
                        <button
                          onClick={handleReset}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark transition-colors duration-200"
                        >
                          Analyze Another Document
                        </button>
                      </div>
                    </div>
                    <AnalysisResults
                      analysis={{
                        ...analysisResult,
                        recommendations: analysisResult.recommendations || [],
                      } as unknown as AnalysisData}
                    />
                  </div>
                ) : (
                  <>
                    {/* Upload & Analyze Section */}
                    <div className="mt-8 shadow-sm rounded-lg p-6 pb-8 dark:bg-[#1E1E1E] bg-gray-50">
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
                      ) : isIngesting ? (
                        <div className="space-y-6">
                          <div className="text-center py-8">
                            <LoadingSpinner message="Uploading to document library..." />
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                              Your documents are being indexed for Q&A
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

                          <div className="mt-4 mb-4 w-full">
                            <OutputLengthSlider
                              value={outputLength}
                              onChange={handleOutputLengthChange}
                              min={100}
                              max={1000}
                              step={50}
                            />
                          </div>

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

                          <div className="mt-6">
                            <ErrorMessage message={analyzeError || ''} className="mb-3" />

                            <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
                              <button
                                ref={buttonRef}
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || isIngesting}
                                className={`px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 ${isAnalyzing || isIngesting ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                              >
                                <span className="brightness-110">Analyze Document</span>
                              </button>

                              <button
                                onClick={handleUploadOnly}
                                disabled={isAnalyzing || isIngesting || files.length === 0}
                                className={`px-6 py-3 border-2 border-primary text-base font-medium rounded-md text-primary dark:text-primary-light hover:bg-primary/10 dark:hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 ${isAnalyzing || isIngesting || files.length === 0
                                    ? 'opacity-50 cursor-not-allowed'
                                    : ''
                                  }`}
                                title="Upload to document library without analyzing — chat with it afterwards"
                              >
                                <span className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                  Upload Only
                                </span>
                              </button>
                            </div>

                            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
                              <strong>Analyze</strong> generates a full report &bull; <strong>Upload Only</strong> adds documents to your library for Q&amp;A
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Prompt bar — only visible in analyze tab when not showing results */}
            {!analysisResult && !isAnalyzing && (
              <div className="fixed bottom-0 left-0 right-0 z-20">
                <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'pl-64' : 'pl-16'}`}>
                  <PromptInputBar
                    customPrompt={customPrompt}
                    onCustomPromptChange={handleCustomPromptChange}
                    onAnalyze={handleSendPrompt}
                    canAnalyze={true}
                    isAnalyzing={false}
                    buttonText="Send"
                    placeholder="Add specific instructions for analyzing your document (optional)..."
                    helperText="Use this to add custom instructions for your analysis"
                    errorMessage={promptError || ''}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Chat Tab --- */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Document Library Sidebar */}
            <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Document Library
                  </h2>
                </div>

                <DocumentLibrary
                  documents={ragDocuments}
                  selectedDocIds={selectedDocIds}
                  onSelectionChange={setSelectedDocIds}
                  onDocumentsChanged={fetchRAGDocuments}
                  isLoading={isLoadingDocs}
                />

                {ragDocuments.length === 0 && !isLoadingDocs && (
                  <div className="mt-4 p-3 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      <strong className="text-primary dark:text-primary-light">No documents yet.</strong>{' '}
                      Upload files below or switch to the Analyze tab and use &quot;Upload Only&quot;.
                    </p>
                  </div>
                )}

                {/* Inline uploader for adding docs directly in chat */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                    Add Documents
                  </p>
                  <DocumentUploader
                    onUploadComplete={fetchRAGDocuments}
                    maxFileSizeMb={10}
                  />
                </div>
              </div>
            </div>

            {/* Chat Panel */}
            <div className="flex-1 flex flex-col bg-gray-50 dark:bg-[#1E1E1E]">
              <RAGChatPanel
                selectedDocIds={selectedDocIds}
                hasDocuments={ragDocuments.length > 0}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
