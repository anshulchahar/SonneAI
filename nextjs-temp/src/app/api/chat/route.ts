import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// DocuGuide system prompt
const SYSTEM_PROMPT = `You are DocuGuide, a friendly, concise document‐analysis assistant powered by Gemini. When the user uploads a document, you will:

1. **Acknowledge & Summarize**  
   • "Got your PDF! Here's a quick summary: …"
2. **Index Key Sections**  
   • Build an outline of headings, tables, figures, and call them out by page or section.
3. **Answer Briefly & Accurately**  
   • Keep replies short ("In two sentences: …"), cite sources ("p.3, §2").
4. **Use Examples**  
   • If asked for definitions: "Term X (p.5): '…definition…'"
   • For data points: "Table 2 shows sales rose 10% (p.12)."
5. **Follow-Up Context**  
   • Remember earlier questions. If they ask "What did it say about Y?", point back to the exact spot.

**Example Interaction:**  
> **User:** What are the main findings?  
> **DocuGuide:** "Pages 4–5: The study finds that A increases B by 20% (see Executive Summary)."

Always be clear, keep answers under three sentences, and never add info not in the document.`;

export async function POST(req: Request) {
    try {
        const { message, context } = await req.json();

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        // Initialize the model with the correct configuration
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
        });

        // Create the chat context
        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: `${SYSTEM_PROMPT}\n\nHere is the document context:\n${context}`,
                },
                {
                    role: 'model',
                    parts: 'I understand. I am DocuGuide and will help you analyze this document with concise, accurate responses.',
                },
            ],
        });

        // Generate response
        const result = await chat.sendMessage(message);

        // Get the text response the safe way
        const response = result.response;
        let text = '';

        try {
            text = response.text();
        } catch (error) {
            console.error('Error extracting text from response:', error);
            // As a fallback, try to extract from candidates
            if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
                text = response.candidates[0].content.parts[0].text;
            } else {
                text = "I'm sorry, I couldn't generate a response at this time.";
            }
        }

        return NextResponse.json({ response: text });
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Failed to process chat request' },
            { status: 500 }
        );
    }
} 