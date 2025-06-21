'use client';

import { ParsedResume } from '@/types';

interface ResumeDisplayProps {
  resumeData: ParsedResume;
  onEdit: () => void;
  onProceed: () => void;
}

export default function ResumeDisplay({ resumeData, onEdit, onProceed }: ResumeDisplayProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            📋 Parsed Resume Data
          </h2>
          <button
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ✏️ Edit Resume
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                👤 Personal Information
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-600">Name:</span>
                  <p className="text-gray-800">{resumeData.name || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Title:</span>
                  <p className="text-gray-800">{resumeData.title || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Email:</span>
                  <p className="text-gray-800">{resumeData.email || 'Not provided'}</p>
                </div>
                {resumeData.phone && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Phone:</span>
                    <p className="text-gray-800">{resumeData.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Professional Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                📄 Professional Summary
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {resumeData.summary || 'No summary available'}
              </p>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              🔧 Skills
            </h3>
            {resumeData.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resumeData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No skills listed</p>
            )}
          </div>
        </div>

        {/* Experience */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            💼 Work Experience
          </h3>
          {resumeData.experience.length > 0 ? (
            <div className="space-y-3">
              {resumeData.experience.map((exp, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800">{exp}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No work experience listed</p>
          )}
        </div>

        {/* Education */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🎓 Education
          </h3>
          {resumeData.education.length > 0 ? (
            <div className="space-y-3">
              {resumeData.education.map((edu, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800">{edu}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No education information listed</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={onProceed}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-colors"
          >
            ✨ Get Job Suggestions
          </button>
        </div>
      </div>
    </div>
  );
} 