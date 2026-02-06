'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowPathIcon, DocumentTextIcon } from '@heroicons/react/24/outline';


interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: {
        document_id: string;
        filename: string;
        chunk_index: number;
        similarity: number;
        snippet: string;
    }[];
    created_at?: string;
}

interface RAGChatPanelProps {
    selectedDocIds: string[];
    hasDocuments: boolean;
}

export default function RAGChatPanel({ selectedDocIds, hasDocuments }: RAGChatPanelProps) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const prevDocIdsRef = useRef<string[]>(selectedDocIds);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Reset conversation when document selection changes
    useEffect(() => {
        const prevIds = prevDocIdsRef.current;
        const changed =
            prevIds.length !== selectedDocIds.length ||
            prevIds.some((id, i) => id !== selectedDocIds[i]);

        if (changed && messages.length > 0) {
            // Document selection changed mid-conversation — start fresh
            setMessages([]);
            setConversationId(null);
            setExpandedSources(new Set());
        }
        prevDocIdsRef.current = selectedDocIds;
    }, [selectedDocIds]);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 120);
        textarea.style.height = `${newHeight}px`;
    }, [input]);

    const toggleSources = (messageId: string) => {
        setExpandedSources((prev) => {
            const next = new Set(prev);
            if (next.has(messageId)) {
                next.delete(messageId);
            } else {
                next.add(messageId);
            }
            return next;
        });
    };

    const handleSubmit = async () => {
        if (!input.trim() || isLoading || !session?.user) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/rag/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: userMessage.content,
                    conversation_id: conversationId,
                    document_ids: selectedDocIds.length > 0 ? selectedDocIds : undefined,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                if (res.status === 429) {
                    throw new Error(errorData.message || 'You have reached the conversation limit. Please delete an existing conversation to start a new one.');
                }
                throw new Error(errorData.error || 'Failed to get response');
            }

            const data = await res.json();

            if (!conversationId && data.conversation_id) {
                setConversationId(data.conversation_id);
            }

            const assistantMessage: ChatMessage = {
                id: data.message_id || `assistant-${Date.now()}`,
                role: 'assistant',
                content: data.answer,
                sources: data.sources,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setConversationId(null);
        setExpandedSources(new Set());
    };

    const renderMessageContent = (content: string) => {
        // Simple markdown-ish rendering
        const lines = content.split('\n');
        return lines.map((line, i) => {
            // Bold
            let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Source references like [Source 1]
            processed = processed.replace(
                /\[Source (\d+)[^\]]*\]/g,
                '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">📄 Source $1</span>'
            );
            // Bullet points
            if (processed.startsWith('- ') || processed.startsWith('* ')) {
                return (
                    <div key={i} className="flex gap-2 ml-2 my-0.5">
                        <span className="text-primary mt-1.5 flex-shrink-0">•</span>
                        <span dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />
                    </div>
                );
            }
            // Headers
            if (processed.startsWith('## ')) {
                return (
                    <h3 key={i} className="text-sm font-semibold mt-3 mb-1 text-gray-800 dark:text-gray-200">
                        {processed.slice(3)}
                    </h3>
                );
            }
            if (processed.startsWith('# ')) {
                return (
                    <h2 key={i} className="text-base font-bold mt-3 mb-1 text-gray-800 dark:text-gray-200">
                        {processed.slice(2)}
                    </h2>
                );
            }
            // Empty lines
            if (!processed.trim()) return <div key={i} className="h-2" />;
            return <p key={i} className="my-0.5" dangerouslySetInnerHTML={{ __html: processed }} />;
        });
    };

    // Empty state
    if (!hasDocuments && messages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Chat with Your Documents
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
                    Upload documents to your library, then ask questions about their content.
                    The AI will search through your documents and provide answers with source references.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Chat header */}
            <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Document Q&A
                    </span>
                    {selectedDocIds.length > 0 && (
                        <span className="text-xs bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light px-2 py-0.5 rounded-full">
                            {selectedDocIds.length} doc{selectedDocIds.length > 1 ? 's' : ''} selected
                        </span>
                    )}
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={handleNewChat}
                        className="text-xs text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-light transition-colors flex items-center gap-1"
                    >
                        <ArrowPathIcon className="w-3.5 h-3.5" />
                        New Chat
                    </button>
                )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 min-h-[300px]">
                {messages.length === 0 && hasDocuments && (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Ask a question about your documents
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center mt-2">
                            {[
                                'Summarize the key points',
                                'What are the main findings?',
                                'Compare the documents',
                            ].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => {
                                        setInput(suggestion);
                                        textareaRef.current?.focus();
                                    }}
                                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary hover:text-primary dark:hover:border-primary-light dark:hover:text-primary-light transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                ? 'bg-primary text-white rounded-br-md'
                                : 'bg-gray-100 dark:bg-[#2C2C2C] text-gray-800 dark:text-gray-200 rounded-bl-md border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            <div className="text-sm leading-relaxed">
                                {msg.role === 'user' ? (
                                    <p>{msg.content}</p>
                                ) : (
                                    renderMessageContent(msg.content)
                                )}
                            </div>

                            {/* Sources */}
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-600/50">
                                    <button
                                        onClick={() => toggleSources(msg.id)}
                                        className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors"
                                    >
                                        <DocumentTextIcon className="w-3.5 h-3.5" />
                                        {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''}
                                        <svg
                                            className={`w-3 h-3 transition-transform ${expandedSources.has(msg.id) ? 'rotate-180' : ''}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {expandedSources.has(msg.id) && (
                                        <div className="mt-2 space-y-1.5">
                                            {msg.sources.map((source, idx) => (
                                                <div
                                                    key={idx}
                                                    className="text-xs p-2 rounded-lg bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-600/50"
                                                >
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="font-medium text-primary dark:text-primary-light">
                                                            Source {idx + 1}
                                                        </span>
                                                        <span className="text-gray-400">•</span>
                                                        <span className="text-gray-600 dark:text-gray-400 truncate">
                                                            {source.filename}
                                                        </span>
                                                        <span className="text-gray-400 ml-auto">
                                                            {(source.similarity * 100).toFixed(0)}% match
                                                        </span>
                                                    </div>
                                                    {source.snippet && (
                                                        <p className="text-gray-500 dark:text-gray-400 line-clamp-2">
                                                            {source.snippet}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-[#2C2C2C] rounded-2xl rounded-bl-md px-4 py-3 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className={`relative flex items-center shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2C2C2C] rounded-full px-3 py-1.5 transition-colors ${!hasDocuments ? 'opacity-60' : ''
                    }`}>
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading || !hasDocuments || !session?.user}
                        placeholder={
                            !session?.user
                                ? 'Sign in to ask questions...'
                                : !hasDocuments
                                    ? 'Upload documents first...'
                                    : 'Ask a question about your documents...'
                        }
                        className="flex-1 px-2 py-1 text-sm resize-none overflow-hidden focus:outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400"
                        style={{ maxHeight: '100px', minHeight: '28px' }}
                        rows={1}
                        aria-label="Ask a question"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !input.trim() || !hasDocuments || !session?.user}
                        className={`p-1.5 rounded-full flex items-center justify-center text-white transition-colors min-w-7 min-h-7 ${!isLoading && input.trim() && hasDocuments && session?.user
                            ? 'bg-primary hover:bg-primary-dark'
                            : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                            }`}
                        title="Send message"
                    >
                        {isLoading ? (
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                            </svg>
                        )}
                    </button>
                </div>
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                    Press Enter to send • Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
