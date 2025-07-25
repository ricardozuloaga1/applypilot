import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Upload, Edit3, FileText, CheckCircle } from 'lucide-react';
import ManualResumeBuilder from './ManualResumeBuilder';
import type { ResumeData } from './ProfessionalResumeTemplates';
import { AutoApplyAI } from '../lib/extension-mirror';

interface ResumeBuilderIntegrationProps {
  onComplete?: (data: ResumeData, templateId: string) => void;
  onResumeUploaded?: (resume: any) => void;
}

const ResumeBuilderIntegration: React.FC<ResumeBuilderIntegrationProps> = ({ 
  onComplete,
  onResumeUploaded 
}) => {
  // Core state
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [activeMethod, setActiveMethod] = useState<'upload' | 'manual' | 'both'>('both');
  const [expandedCard, setExpandedCard] = useState<'upload' | 'manual' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resume data from manual input
  const [manualResumeData, setManualResumeData] = useState<ResumeData | null>(null);
  const [uploadedResumeData, setUploadedResumeData] = useState<ResumeData | null>(null);

  // Handle manual resume completion
  const handleManualResumeComplete = useCallback((data: ResumeData) => {
    setManualResumeData(data);
    setResumeData(data);
    setActiveMethod('manual');
    
    // Immediately complete when manual resume is done
    if (onComplete) {
      onComplete(data, ''); // No template selected at this stage
    }
  }, [onComplete]);

  // Handle file upload and extraction
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📄 Starting file upload process:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    setUploadedFile(file);
    setIsExtracting(true);
    
    try {
      // Use AutoApplyAI instance to extract text from file
      const autoApply = new AutoApplyAI();
      const content = await autoApply.extractTextFromFile(file);
      
      if (!content || content.length < 10) {
        throw new Error(`No readable text found in file. Extracted content length: ${content?.length || 0} characters.`);
      }
      
      // Create a basic extracted data structure from the content
      // Since we have the raw text content, we can create a simple structure
      // The AutoApplyAI system will use the raw content for job matching
      const extractedData = {
        personalInfo: {
          name: file.name.replace(/\.[^/.]+$/, ''), // Use filename as fallback name
          email: '',
          phone: '',
          location: '',
          citizenship: ''
        },
        professionalSummary: content.substring(0, 200) + '...', // First 200 chars as summary
        coreSkills: [],
        experience: [],
        education: [],
        licenses: [],
        additionalSections: {
          tools: [],
          languages: [],
          projects: [],
          certifications: []
        }
      };
      
      // Store the resume in AutoApplyAI system
      try {
        await autoApply.init();
        const storedResume = await autoApply.storeExtractedResume(file, content);
        console.log('✅ Resume stored in AutoApplyAI system:', storedResume.name);
        
        // Notify parent component that a resume was uploaded
        if (onResumeUploaded) {
          onResumeUploaded(storedResume);
        }
      } catch (error) {
        console.error('❌ Failed to store resume in AutoApplyAI:', error);
      }
      
      setUploadedResumeData(extractedData);
      setResumeData(extractedData);
      setActiveMethod('upload');
      
      // Immediately complete when upload is done
      if (onComplete) {
        onComplete(extractedData, ''); // No template selected at this stage
      }
      
    } catch (error: any) {
      console.error('❌ Error uploading file:', error);
      alert(`Error processing the uploaded file: ${error?.message || 'Unknown error'}. Please try again or use manual input.`);
    } finally {
      setIsExtracting(false);
    }
  }, [onComplete, onResumeUploaded]);

  // Auto-fill manual form with uploaded resume data
  const handleAutoFillManualForm = useCallback(() => {
    if (uploadedResumeData) {
      setManualResumeData(uploadedResumeData);
      setActiveMethod('both');
    }
  }, [uploadedResumeData]);

  // Clear upload data
  const handleClearUpload = useCallback(() => {
    setUploadedFile(null);
    setUploadedResumeData(null);
    if (activeMethod === 'upload') {
      setResumeData(manualResumeData);
      setActiveMethod(manualResumeData ? 'manual' : 'both');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [activeMethod, manualResumeData]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Choose your preferred method to add your resume</h2>
        <p className="text-gray-600">This will be used for job scoring and smart document generation</p>
      </div>

      {/* Side-by-Side Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upload Resume Card */}
        <Card 
          className={`relative transition-all duration-200 cursor-pointer border-2 ${
            expandedCard === 'upload' 
              ? 'border-blue-500 bg-blue-50 shadow-lg' 
              : activeMethod === 'upload' 
                ? 'border-blue-300 bg-blue-25' 
                : 'border-blue-200 hover:border-blue-300 hover:bg-blue-25'
          }`}
          onClick={() => setExpandedCard(expandedCard === 'upload' ? null : 'upload')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-xl text-blue-900">Upload Existing Resume</CardTitle>
            {!expandedCard || expandedCard !== 'upload' ? (
              <p className="text-blue-700 text-sm">
                Upload your current resume to use for job analysis
              </p>
            ) : null}
          </CardHeader>
          
          {expandedCard === 'upload' && (
            <CardContent 
              className="space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {!uploadedFile ? (
                <>
                  {/* Upload Area */}
                  <div 
                    className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer bg-white"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                    <p className="text-blue-700 mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-blue-600">PDF, DOCX, or TXT files up to 10MB</p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                  >
                    {isExtracting ? (
                      <>
                        <svg className="h-4 w-4 mr-2 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Choose File
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  {/* Uploaded File Display */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">{uploadedFile.name}</p>
                          <p className="text-sm text-green-600">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Successfully processed
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearUpload}
                        className="text-green-700 hover:text-green-800"
                      >
                        Change
                      </Button>
                    </div>
                  </div>

                  {/* Resume Summary */}
                  {uploadedResumeData && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Extracted Information:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium">{uploadedResumeData.personalInfo.name || 'Not found'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Content:</span>
                          <span className="font-medium">Successfully extracted</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          )}
        </Card>

        {/* Manual Input Card */}
        <Card 
          className={`relative transition-all duration-200 cursor-pointer border-2 ${
            expandedCard === 'manual' 
              ? 'border-green-500 bg-green-50 shadow-lg' 
              : activeMethod === 'manual' 
                ? 'border-green-300 bg-green-25' 
                : activeMethod === 'both'
                  ? 'border-green-300 bg-green-25'
                  : 'border-green-200 hover:border-green-300 hover:bg-green-25'
          }`}
          onClick={() => setExpandedCard(expandedCard === 'manual' ? null : 'manual')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Edit3 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-xl text-green-900">Manual Input</CardTitle>
            {!expandedCard || expandedCard !== 'manual' ? (
              <p className="text-green-700 text-sm">
                Enter your information manually using our guided form
              </p>
            ) : null}
          </CardHeader>
          
          {expandedCard === 'manual' && (
            <CardContent onClick={(e) => e.stopPropagation()}>
              <ManualResumeBuilder 
                onResumeComplete={handleManualResumeComplete}
                initialData={manualResumeData}
              />
            </CardContent>
          )}
        </Card>
      </div>

      {/* Success message when resume is added */}
      {resumeData && (
        <div className="text-center mt-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-2" />
            <p className="text-green-800 font-medium">Resume successfully added!</p>
            <p className="text-green-600 text-sm">You can now use this resume for job scoring and document generation.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilderIntegration; 