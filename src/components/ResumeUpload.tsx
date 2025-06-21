'use client';

import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface ResumeUploadProps {
  onResumeProcessed: (resumeData: any) => void;
}

export default function ResumeUpload({ onResumeProcessed }: ResumeUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [resumeText, setResumeText] = useState('');



  const handleTextSubmit = async () => {
    if (!resumeText.trim()) {
      toast.error('Please paste your resume text');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: resumeText }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Server returned an invalid response. Please check server logs and try again.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse resume');
      }

      onResumeProcessed(data);
      toast.success('Resume parsed successfully!');
      setResumeText('');
    } catch (error) {
      console.error('Error parsing resume:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse resume. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          📄 Paste Your Resume
        </h2>

        {/* Text Input */}
        <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">
              Paste your resume text:
            </h3>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume text here..."
            className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isProcessing}
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleTextSubmit}
              disabled={isProcessing || !resumeText.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Parse Resume'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 