import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GeneratedDocument } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EditDocumentRequest {
  document: GeneratedDocument;
  chatHistory: Array<{role: 'user' | 'assistant', content: string}>;
  editRequest: string;
  candidateName: string;
  jobTitle: string;
  company: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Document editing API route called');
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key is not configured. Please check your environment variables.' 
      }, { status: 500 });
    }

    const body: EditDocumentRequest = await request.json();
    const { document, chatHistory, editRequest, candidateName, jobTitle, company } = body;

    if (!document || !editRequest) {
      return NextResponse.json({ 
        error: 'Document and edit request are required' 
      }, { status: 400 });
    }

    // Build the conversation context
    const systemPrompt = `You are an expert document editor helping ${candidateName} refine their ${document.type === 'resume' ? 'resume' : 'cover letter'} for a ${jobTitle} position at ${company}.

Your role is to:
1. Listen to the user's specific requests for changes
2. Make thoughtful edits to improve the document
3. Maintain the professional quality and formatting
4. Keep the content truthful and based on the original information
5. Provide a brief, friendly explanation of changes made

Current document type: ${document.type}
Document content: ${document.content}

CRITICAL INSTRUCTIONS:
- Make specific, targeted improvements based on user requests
- Preserve the HTML formatting and structure
- Return the COMPLETE updated document in "updatedDocument"
- Keep "explanation" brief (2-3 sentences max) - DO NOT include the full document content
- The explanation should summarize what changed, not show the new content
- If the request is unclear, ask for clarification in the explanation

Respond with JSON in this format:
{
  "updatedDocument": { 
    "type": "${document.type}", 
    "content": "COMPLETE updated plain text version", 
    "htmlContent": "COMPLETE updated HTML version with all formatting" 
  },
  "explanation": "Brief summary of what I changed (NO document content here)"
}`;

    // Build conversation messages
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...chatHistory,
      { role: 'user' as const, content: editRequest }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0].message.content;
    
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse JSON response
    let parsedResponse;
    try {
      // Clean the response if it's wrapped in markdown
      const cleanedResponse = responseContent.replace(/```json\n?|\n?```/g, '').trim();
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      // Fallback: treat as explanation only
      return NextResponse.json({
        updatedDocument: null,
        explanation: responseContent
      });
    }

    // Validate the response structure
    if (parsedResponse.updatedDocument) {
      // Ensure the updated document has the correct structure
      parsedResponse.updatedDocument = {
        type: document.type,
        content: parsedResponse.updatedDocument.content || document.content,
        htmlContent: parsedResponse.updatedDocument.htmlContent || parsedResponse.updatedDocument.content || document.htmlContent
      };
    }

    return NextResponse.json({
      updatedDocument: parsedResponse.updatedDocument,
      explanation: parsedResponse.explanation || 'I made the requested changes to your document.'
    });

  } catch (error) {
    console.error('Document editing error:', error);
    return NextResponse.json(
      { error: 'Failed to process document edit request. Please try again.' },
      { status: 500 }
    );
  }
} 