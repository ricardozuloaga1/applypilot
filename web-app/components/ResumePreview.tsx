import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import type { ResumeData } from './ProfessionalResumeTemplates';
import { CompanyLogo } from './CompanyLogo';

interface ResumePreviewProps {
  resumeData: ResumeData;
  templateId: string;
}

// Modern Professional HTML Preview
const ModernProfessionalPreview: React.FC<{ data: ResumeData }> = ({ data }) => (
  <div className="w-full max-w-2xl mx-auto bg-white shadow-lg" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '10px', lineHeight: '1.4' }}>
    {/* Header Section */}
    <div className="p-8 border-b-2 border-blue-600">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{data.personalInfo.name}</h1>
      <div className="flex justify-between text-xs text-gray-600">
        <span>{data.personalInfo.email}</span>
        <span>{data.personalInfo.phone}</span>
        <span>{data.personalInfo.location}</span>
      </div>
    </div>

    <div className="p-8 space-y-6">
      {/* Professional Summary */}
      <section>
        <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider border-b border-gray-200 pb-1">Professional Summary</h2>
        <p className="text-xs text-gray-700 text-justify">{data.professionalSummary}</p>
      </section>

      {/* Core Skills */}
      {data.coreSkills.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider border-b border-gray-200 pb-1">Core Skills</h2>
          <div className="flex flex-wrap gap-2">
            {data.coreSkills.map((skill, index) => (
              <span key={index} className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Professional Experience */}
      <section>
        <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider border-b border-gray-200 pb-1">Professional Experience</h2>
        {data.experience.map((job, index) => (
          <div key={index} className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xs font-bold text-gray-900">{job.title}</h3>
              <CompanyLogo companyName={job.company} size="xs" />
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-blue-600 font-bold">{job.company}{job.location && `, ${job.location}`}</span>
              <span className="text-xs text-gray-600 italic">
                {job.startDate} – {job.current ? 'Present' : job.endDate}
              </span>
            </div>
            {job.responsibilities.map((resp, respIndex) => (
              <p key={respIndex} className="text-xs text-gray-700 mb-1 pl-2">• {resp}</p>
            ))}
          </div>
        ))}
      </section>

      {/* Education */}
      <section>
        <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider border-b border-gray-200 pb-1">Education</h2>
        {data.education.map((edu, index) => (
          <div key={index} className="mb-4">
            <h3 className="text-xs font-bold text-gray-900 mb-1">{edu.degree}</h3>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-blue-600 font-bold">{edu.institution}{edu.location && `, ${edu.location}`}</span>
              <span className="text-xs text-gray-600 italic">{edu.year}</span>
            </div>
            {edu.gpa && (
              <p className="text-xs text-gray-700 pl-2">GPA: {edu.gpa}</p>
            )}
            {edu.honors && (
              <p className="text-xs text-gray-700 pl-2">{edu.honors}</p>
            )}
          </div>
        ))}
      </section>
    </div>
  </div>
);

// Creative Template HTML Preview
const CreativePreview: React.FC<{ data: ResumeData }> = ({ data }) => (
  <div className="w-full max-w-2xl mx-auto bg-gray-50 shadow-lg" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '10px', lineHeight: '1.4' }}>
    {/* Header Section */}
    <div className="bg-blue-600 text-white p-8">
      <h1 className="text-2xl font-bold mb-2">{data.personalInfo.name}</h1>
      <div className="flex justify-between text-xs text-blue-100">
        <span>{data.personalInfo.email}</span>
        <span>{data.personalInfo.phone}</span>
        <span>{data.personalInfo.location}</span>
      </div>
    </div>

    <div className="p-8 space-y-6">
      {/* Professional Summary */}
      <section>
        <h2 className="text-sm font-bold text-blue-600 mb-3 bg-blue-50 px-2 py-1 uppercase tracking-wider">Professional Summary</h2>
        <p className="text-xs text-gray-700 text-justify">{data.professionalSummary}</p>
      </section>

      {/* Core Skills */}
      {data.coreSkills.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-blue-600 mb-3 bg-blue-50 px-2 py-1 uppercase tracking-wider">Core Skills</h2>
          <div className="flex flex-wrap gap-2">
            {data.coreSkills.map((skill, index) => (
              <span key={index} className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Professional Experience */}
      <section>
        <h2 className="text-sm font-bold text-blue-600 mb-3 bg-blue-50 px-2 py-1 uppercase tracking-wider">Professional Experience</h2>
        {data.experience.map((job, index) => (
          <div key={index} className="mb-4">
            <h3 className="text-xs font-bold text-gray-900 mb-1">{job.title}</h3>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-blue-600 font-bold">{job.company}{job.location && `, ${job.location}`}</span>
              <span className="text-xs text-gray-600 italic">
                {job.startDate} – {job.current ? 'Present' : job.endDate}
              </span>
            </div>
            {job.responsibilities.map((resp, respIndex) => (
              <p key={respIndex} className="text-xs text-gray-700 mb-1 pl-2">• {resp}</p>
            ))}
          </div>
        ))}
      </section>

      {/* Education */}
      <section>
        <h2 className="text-sm font-bold text-blue-600 mb-3 bg-blue-50 px-2 py-1 uppercase tracking-wider">Education</h2>
        {data.education.map((edu, index) => (
          <div key={index} className="mb-4">
            <h3 className="text-xs font-bold text-gray-900 mb-1">{edu.degree}</h3>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-blue-600 font-bold">{edu.institution}{edu.location && `, ${edu.location}`}</span>
              <span className="text-xs text-gray-600 italic">{edu.year}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  </div>
);

// Executive Template HTML Preview
const ExecutivePreview: React.FC<{ data: ResumeData }> = ({ data }) => (
  <div className="w-full max-w-2xl mx-auto bg-white shadow-lg" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: '10px', lineHeight: '1.4' }}>
    {/* Header Section */}
    <div className="p-10 border-b-4 border-gray-900">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.personalInfo.name}</h1>
      <div className="flex justify-between text-xs text-gray-600">
        <span>{data.personalInfo.email}</span>
        <span>{data.personalInfo.phone}</span>
        <span>{data.personalInfo.location}</span>
      </div>
    </div>

    <div className="p-10 space-y-7">
      {/* Executive Summary */}
      <section>
        <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider border-b-2 border-gray-900 pb-1">Executive Summary</h2>
        <p className="text-xs text-gray-700 text-justify">{data.professionalSummary}</p>
      </section>

      {/* Core Competencies */}
      {data.coreSkills.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider border-b-2 border-gray-900 pb-1">Core Competencies</h2>
          <div className="flex flex-wrap gap-2">
            {data.coreSkills.map((skill, index) => (
              <span key={index} className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Executive Experience */}
      <section>
        <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider border-b-2 border-gray-900 pb-1">Executive Experience</h2>
        {data.experience.map((job, index) => (
          <div key={index} className="mb-4">
            <h3 className="text-xs font-bold text-gray-900 mb-1">{job.title}</h3>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-900 font-bold">{job.company}{job.location && `, ${job.location}`}</span>
              <span className="text-xs text-gray-600 italic">
                {job.startDate} – {job.current ? 'Present' : job.endDate}
              </span>
            </div>
            {job.responsibilities.map((resp, respIndex) => (
              <p key={respIndex} className="text-xs text-gray-700 mb-1 pl-2">• {resp}</p>
            ))}
          </div>
        ))}
      </section>

      {/* Education */}
      <section>
        <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider border-b-2 border-gray-900 pb-1">Education</h2>
        {data.education.map((edu, index) => (
          <div key={index} className="mb-4">
            <h3 className="text-xs font-bold text-gray-900 mb-1">{edu.degree}</h3>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-900 font-bold">{edu.institution}{edu.location && `, ${edu.location}`}</span>
              <span className="text-xs text-gray-600 italic">{edu.year}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  </div>
);

// Main Preview Component
const ResumePreview: React.FC<ResumePreviewProps> = ({ resumeData, templateId }) => {
  const getPreviewComponent = () => {
    switch (templateId) {
      case 'modern-professional':
        return <ModernProfessionalPreview data={resumeData} />;
      case 'creative':
        return <CreativePreview data={resumeData} />;
      case 'executive':
        return <ExecutivePreview data={resumeData} />;
      default:
        return <ModernProfessionalPreview data={resumeData} />;
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Resume Preview</h3>
            <Badge variant="outline">{templateId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>
          </div>
          
          <div className="border rounded-lg p-4 bg-gray-50 overflow-auto max-h-96">
            <div className="transform scale-75 origin-top-left" style={{ width: '133.33%' }}>
              {getPreviewComponent()}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 text-center">
            This preview shows how your resume will appear in the generated PDF
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumePreview; 