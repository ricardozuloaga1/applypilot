import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { FileText, Calendar, User, CheckCircle, Upload, Plus } from 'lucide-react';
import type { Resume } from '../lib/extension-mirror';

interface ResumeSelectorProps {
  resumes: Resume[];
  activeResumeId: string | null;
  onResumeSelect: (resumeId: string) => void;
  onUploadNew?: () => void;
  onCreateNew?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export const ResumeSelector: React.FC<ResumeSelectorProps> = ({
  resumes,
  activeResumeId,
  onResumeSelect,
  onUploadNew,
  onCreateNew,
  showActions = true,
  compact = false
}) => {
  const activeResume = resumes.find(resume => resume.id === activeResumeId);

  // Helper function to get user-friendly file type
  const getFileType = (fileType: string | undefined) => {
    if (!fileType) return 'Unknown';
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('word') || fileType.includes('document')) return 'DOCX';
    if (fileType.includes('text')) return 'TXT';
    return fileType.toUpperCase();
  };

  // Helper function to truncate long names
  const truncateName = (name: string, maxLength: number = 30) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span className="text-sm font-medium text-green-800 flex-shrink-0">Active Resume:</span>
          
          <Select value={activeResumeId || ''} onValueChange={onResumeSelect}>
            <SelectTrigger className="w-[500px] h-8">
              <SelectValue placeholder="Select a resume">
                {activeResume && (
                  <span className="truncate">
                    {truncateName(activeResume.name, 50)}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {resumes.length === 0 ? (
                <SelectItem value="no-resumes" disabled>
                  No resumes available
                </SelectItem>
              ) : (
                resumes.map((resume) => (
                  <SelectItem key={resume.id} value={resume.id}>
                    <div className="flex items-center justify-between w-full min-w-0">
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium truncate" title={resume.name}>
                            {truncateName(resume.name, 45)}
                          </span>
                          {resume.id === activeResumeId && (
                            <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{new Date(resume.uploadedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{getFileType(resume.fileType)}</span>
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Current Resume Info */}
        {activeResume && (
          <div className="text-xs text-green-600 flex-shrink-0 ml-3">
            {new Date(activeResume.uploadedAt).toLocaleDateString()} • {getFileType(activeResume.fileType)}
          </div>
        )}
      </div>
    </div>
  );
}; 