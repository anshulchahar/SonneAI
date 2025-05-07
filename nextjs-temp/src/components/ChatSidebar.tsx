import { useState, useRef, useEffect } from 'react';
import { ChatBubbleLeftIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { AnalysisData } from '@/types/analysis';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatSidebarProps {
    analysis: AnalysisData;
    isOpen: boolean;
    onClose: () => void;
}

export default function ChatSidebar({ analysis, isOpen, onClose }: ChatSidebarProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContext = useRef<string>('');

    // Initialize chat context when analysis changes
    useEffect(() => {
        chatContext.current = `
      Document Title: ${analysis.title || 'Untitled'}
      Summary: ${analysis.summary || ''}
      Key Points: ${analysis.keyPoints?.join('\n') || ''}
      Detailed Analysis: ${analysis.detailedAnalysis || ''}
    `;
    }, [analysis]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    context: chatContext.current,
                }),
            });

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            // Add error message to chat
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-[var(--card)] border-l border-gray-200 dark:border-[var(--border)] shadow-lg flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-[var(--border)] flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <ChatBubbleLeftIcon className="h-5 w-5 text-[var(--primary)]" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-[var(--card-foreground)]">Chat</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[var(--accent)]"
                >
                    <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-[var(--muted-foreground)]" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user'
                                    ? 'bg-[var(--primary)] text-white'
                                    : 'bg-gray-100 dark:bg-[var(--accent)] text-gray-900 dark:text-[var(--card-foreground)]'
                                }`}
                        >
                            <p className="text-sm">{message.content}</p>
                            <span className="text-xs opacity-70 mt-1 block">
                                {message.timestamp.toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-[var(--border)]">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about the document..."
                        className="flex-1 rounded-lg border border-gray-300 dark:border-[var(--border)] bg-white dark:bg-[var(--card)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-2 rounded-lg bg-[var(--primary)] text-white disabled:opacity-50"
                    >
                        <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                </div>
            </form>
        </div>
    );
} 