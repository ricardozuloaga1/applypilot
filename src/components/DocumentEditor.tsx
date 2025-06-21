'use client';

import { useState } from 'react';
import { GeneratedDocument } from '@/types';

interface DocumentEditorProps {
  document: GeneratedDocument;
  onDocumentUpdate: (updatedDocument: GeneratedDocument) => void;
  candidateName: string;
  jobTitle: string;
  company: string;
}

export default function DocumentEditor({ 
  document, 
  onDocumentUpdate, 
  candidateName, 
  jobTitle, 
  company 
}: DocumentEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = { role: 'user' as const, content: currentMessage };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/edit-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document: document,
          chatHistory: updatedMessages,
          editRequest: currentMessage,
          candidateName,
          jobTitle,
          company
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process edit request');
      }

      const data = await response.json();
      
      // Update the document first (this updates the preview)
      if (data.updatedDocument) {
        onDocumentUpdate(data.updatedDocument);
      }
      
      // Then add the explanation to chat (brief summary only)
      const assistantMessage = { 
        role: 'assistant' as const, 
        content: data.explanation || 'I made the requested changes to your document. You can see the updates in the preview above!' 
      };
      setChatMessages([...updatedMessages, assistantMessage]);

    } catch (error) {
      console.error('Error editing document:', error);
      const errorMessage = { 
        role: 'assistant' as const, 
        content: 'Sorry, I encountered an error while processing your request. Please try again.' 
      };
      setChatMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    if (chatMessages.length === 0) {
      setChatMessages([{
        role: 'assistant',
        content: `Hi ${candidateName}! I'm here to help you refine your ${document.type === 'resume' ? 'resume' : 'cover letter'} for the ${jobTitle} position at ${company}. 

💡 **How it works:** Tell me what you'd like to change, and I'll update the document preview above. I'll keep our chat focused on brief summaries of the changes made.

What would you like to change? For example:
• "Make the summary more impactful"
• "Add more technical skills"  
• "Emphasize leadership experience"
• "Make it sound more enthusiastic"
• "Fix any formatting issues"
• "Add specific achievements"`
      }]);
    }
  };

  if (!isEditing) {
    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-800">
              ✨ Want to refine this {document.type === 'resume' ? 'resume' : 'cover letter'}?
            </h4>
            <p className="text-sm text-blue-600 mt-1">
              Chat with AI to make personalized edits and improvements
            </p>
          </div>
          <button
            onClick={startEditing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Start Editing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h4 className="font-medium text-gray-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.657-.398L5.464 21.5a1.001 1.001 0 01-1.414-1.414l1.898-4.879A8.955 8.955 0 014 12C4 7.582 7.582 4 12 4s8 3.582 8 8z" />
          </svg>
          Document Editor - {document.type === 'resume' ? 'Resume' : 'Cover Letter'}
        </h4>
        <button
          onClick={() => setIsEditing(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {chatMessages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-sm">AI is thinking...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me what you'd like to change..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !currentMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
} 