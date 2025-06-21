'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ParsedResume, JobListing, GeneratedDocument } from '@/types';
import DocumentEditor from './DocumentEditor';

interface DocumentGeneratorProps {
  resumeData: ParsedResume;
  jobListing: JobListing;
  onBack: () => void;
}

export default function DocumentGenerator({ resumeData, jobListing, onBack }: DocumentGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState<'both' | 'resume' | 'cover_letter'>('both');
  const [activeTab, setActiveTab] = useState<'resume' | 'cover_letter'>('resume');
  const [error, setError] = useState<string | null>(null);
  const [resumeTemplate, setResumeTemplate] = useState<string>('modern');
  const [coverLetterTemplate, setCoverLetterTemplate] = useState<string>('professional');

  const generateDocuments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const documentTypes = selectedDocumentType === 'both' 
        ? ['resume', 'cover_letter'] 
        : [selectedDocumentType];

      const response = await fetch('/api/generate-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData,
          jobListing,
          documentTypes,
          resumeTemplate,
          coverLetterTemplate
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate documents');
      }

      setDocuments(data.documents);
      toast.success(`Generated ${data.documents.length} document(s) successfully!`);
      
      // Set the first document as active tab
      if (data.documents.length > 0) {
        setActiveTab(data.documents[0].type);
      }

    } catch (error) {
      console.error('Document generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate documents';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadDocument = (doc: GeneratedDocument, format: 'html' | 'txt' = 'html') => {
    const content = format === 'html' ? doc.htmlContent : doc.content;
    const filename = `${resumeData.name.replace(/\s+/g, '_')}_${doc.type}_${jobListing.company.replace(/\s+/g, '_')}.${format}`;
    
    const blob = new Blob([content], { 
      type: format === 'html' ? 'text/html' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${doc.type} as ${format.toUpperCase()}`);
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast.success('Content copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const downloadPDF = async (doc: GeneratedDocument) => {
    try {
      toast.loading('Generating PDF...');
      
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent: doc.htmlContent,
          filename: `${resumeData.name.replace(/\s+/g, '_')}_${doc.type}_${jobListing.company.replace(/\s+/g, '_')}.pdf`
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate PDF');
      }

      // Convert base64 to blob and download
      const byteCharacters = atob(data.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.dismiss();
      console.error('PDF download error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const getActiveDocument = () => {
    return documents.find(doc => doc.type === activeTab);
  };

  const handleDocumentUpdate = (updatedDocument: GeneratedDocument) => {
    setDocuments(docs => 
      docs.map(doc => 
        doc.type === updatedDocument.type ? updatedDocument : doc
      )
    );
    toast.success('Document updated successfully!');
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              📋 Generate Documents
            </h2>
            <p className="text-gray-600 mt-1">
              Create tailored resume and cover letter for <strong>{jobListing.title}</strong> at <strong>{jobListing.company}</strong>
            </p>
          </div>
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Jobs
          </button>
        </div>

        {/* Comprehensive Job Details Card */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">📋 Job Details</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600"><strong>Title:</strong> {jobListing.title}</p>
                <p className="text-sm text-gray-600"><strong>Company:</strong> {jobListing.company}</p>
                <p className="text-sm text-gray-600"><strong>Location:</strong> {jobListing.location}</p>
                {jobListing.salaryRange && (
                  <p className="text-sm text-green-600"><strong>💰 Salary:</strong> {jobListing.salaryRange}</p>
                )}
                {jobListing.jobType && (
                  <p className="text-sm text-gray-600"><strong>Type:</strong> {jobListing.jobType}</p>
                )}
                {jobListing.experienceLevel && (
                  <p className="text-sm text-gray-600"><strong>Experience:</strong> {jobListing.experienceLevel}</p>
                )}
                {jobListing.postedDate && (
                  <p className="text-sm text-gray-600"><strong>Posted:</strong> {jobListing.postedDate}</p>
                )}
                {jobListing.applicantCount && (
                  <p className="text-sm text-gray-600"><strong>Applicants:</strong> {jobListing.applicantCount}</p>
                )}
                <p className="text-sm text-gray-600">
                  <strong>Source:</strong> 
                  <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {jobListing.source}
                  </span>
                </p>
                <a
                  href={jobListing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-block mt-2"
                >
                  🔗 View Original Job Posting →
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">👤 Candidate Profile</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600"><strong>Name:</strong> {resumeData.name}</p>
                <p className="text-sm text-gray-600"><strong>Title:</strong> {resumeData.title}</p>
                <p className="text-sm text-gray-600"><strong>Email:</strong> {resumeData.email}</p>
                {resumeData.phone && (
                  <p className="text-sm text-gray-600"><strong>Phone:</strong> {resumeData.phone}</p>
                )}
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700">Key Skills:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {resumeData.skills.slice(0, 6).map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                    {resumeData.skills.length > 6 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{resumeData.skills.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Full Job Description */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">📄 Complete Job Description</h4>
            <div className="text-sm text-gray-600 bg-white p-4 rounded border max-h-48 overflow-y-auto">
              {jobListing.description}
            </div>
          </div>
        </div>

        {/* Document Type Selection */}
        {documents.length === 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">What would you like to generate?</h3>
            <div className="flex space-x-4 mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="documentType"
                  value="both"
                  checked={selectedDocumentType === 'both'}
                  onChange={(e) => setSelectedDocumentType(e.target.value as 'both')}
                  className="text-blue-600"
                />
                <span className="text-gray-700">📋 Both Resume & Cover Letter</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="documentType"
                  value="resume"
                  checked={selectedDocumentType === 'resume'}
                  onChange={(e) => setSelectedDocumentType(e.target.value as 'resume')}
                  className="text-blue-600"
                />
                <span className="text-gray-700">📄 Resume Only</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="documentType"
                  value="cover_letter"
                  checked={selectedDocumentType === 'cover_letter'}
                  onChange={(e) => setSelectedDocumentType(e.target.value as 'cover_letter')}
                  className="text-blue-600"
                />
                <span className="text-gray-700">💌 Cover Letter Only</span>
              </label>
            </div>

            {/* Template Selection */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Resume Template Selection */}
              {(selectedDocumentType === 'both' || selectedDocumentType === 'resume') && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">📄 Resume Template</h4>
                  <select
                    value={resumeTemplate}
                    onChange={(e) => setResumeTemplate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="modern">🎨 Modern - Contemporary design with subtle colors</option>
                    <option value="classic">📝 Classic - Traditional, ATS-friendly format</option>
                    <option value="creative">🎭 Creative - Design-forward for creative fields</option>
                    <option value="technical">⚡ Technical - Skills-focused for tech roles</option>
                    <option value="executive">👔 Executive - Leadership-focused for senior roles</option>
                  </select>
                </div>
              )}

              {/* Cover Letter Template Selection */}
              {(selectedDocumentType === 'both' || selectedDocumentType === 'cover_letter') && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">💌 Cover Letter Template</h4>
                  <select
                    value={coverLetterTemplate}
                    onChange={(e) => setCoverLetterTemplate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="professional">💼 Professional - Straightforward and formal</option>
                    <option value="enthusiastic">🌟 Enthusiastic - Shows passion and excitement</option>
                    <option value="storytelling">📖 Storytelling - Narrative-driven with examples</option>
                    <option value="concise">⚡ Concise - Brief but impactful</option>
                    <option value="research_focused">🔍 Research-Focused - Shows company knowledge</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generate Button */}
        {documents.length === 0 && (
          <div className="mb-6">
            <button
              onClick={generateDocuments}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Documents...
                </span>
              ) : (
                '🚀 Generate Documents'
              )}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={generateDocuments}
              className="mt-2 text-red-600 hover:text-red-700 font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Document Tabs and Preview */}
        {documents.length > 0 && (
          <>
            {/* Document Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              {documents.map((doc) => (
                <button
                  key={doc.type}
                  onClick={() => setActiveTab(doc.type)}
                  className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === doc.type
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {doc.type === 'resume' ? '📄 Tailored Resume' : '💌 Cover Letter'}
                </button>
              ))}
            </div>

                         {/* Document Actions */}
             <div className="flex flex-wrap gap-3 mb-6">
               <button
                 onClick={() => {
                   const activeDoc = getActiveDocument();
                   if (activeDoc) downloadPDF(activeDoc);
                 }}
                 className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
               >
                 📄 Download PDF
               </button>
               <button
                 onClick={() => {
                   const activeDoc = getActiveDocument();
                   if (activeDoc) downloadDocument(activeDoc, 'html');
                 }}
                 className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors"
               >
                 📥 Download HTML
               </button>
               <button
                 onClick={() => {
                   const activeDoc = getActiveDocument();
                   if (activeDoc) downloadDocument(activeDoc, 'txt');
                 }}
                 className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition-colors"
               >
                 📝 Download Text
               </button>
               <button
                 onClick={() => {
                   const activeDoc = getActiveDocument();
                   if (activeDoc) copyToClipboard(activeDoc.content);
                 }}
                 className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
               >
                 📋 Copy to Clipboard
               </button>
               <button
                 onClick={() => {
                   setDocuments([]);
                   setError(null);
                 }}
                 className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded transition-colors"
               >
                 🔄 Generate New
               </button>
             </div>

            {/* Document Preview */}
            <div className="border border-gray-200 rounded-lg">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">
                  Preview: {activeTab === 'resume' ? 'Tailored Resume' : 'Cover Letter'}
                </h3>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto">
                {getActiveDocument() && (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: getActiveDocument()!.htmlContent 
                    }}
                  />
                )}
              </div>
            </div>

            {/* Document Editor */}
            {getActiveDocument() && (
              <DocumentEditor
                document={getActiveDocument()!}
                onDocumentUpdate={handleDocumentUpdate}
                candidateName={resumeData.name}
                jobTitle={jobListing.title}
                company={jobListing.company}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
} 