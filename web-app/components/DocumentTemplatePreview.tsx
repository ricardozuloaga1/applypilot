import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Download, Eye, ZoomIn, ZoomOut } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PDFViewer } from '@react-pdf/renderer';
import { 
  ModernProfessionalTemplate as PDFModernProfessionalTemplate,
  CreativeTemplate as PDFCreativeTemplate,
  ExecutiveTemplate as PDFExecutiveTemplate
} from './ProfessionalResumeTemplates';

interface DocumentTemplatePreviewProps {
  documentContent: string;
  documentTitle: string;
  onDownload: (templateId: string, format: 'pdf' | 'docx' | 'txt') => void;
}

// Helper function to parse document content into structured data
const parseDocumentContent = (content: string) => {
  const lines = content.split('\n').filter(line => line.trim());
  
  // Extract personal info from the first few lines
  const personalInfo = {
    name: 'Generated Resume', // Fallback name
    email: 'email@example.com',
    phone: '(555) 123-4567',
    location: 'Location',
    linkedin: '',
    website: ''
  };

  // Try to extract name from content - look for first line that looks like a name
  const nameMatch = content.match(/^#\s*(.+?)(?:\n|$)/m) || content.match(/^(.+?)(?:\n|$)/);
  if (nameMatch) {
    personalInfo.name = nameMatch[1].replace(/^#\s*/, '').trim();
  }

  // Extract email if present
  const emailMatch = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    personalInfo.email = emailMatch[1];
  }

  // Extract phone if present
  const phoneMatch = content.match(/(\+?1?\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
  if (phoneMatch) {
    personalInfo.phone = phoneMatch[1];
  }

  // Extract location from the first few lines
  const locationMatch = content.match(/([A-Za-z\s,]+(?:NY|New York|Durham|Caracas|Venezuela)[A-Za-z\s,]*)/);
  if (locationMatch) {
    personalInfo.location = locationMatch[1].trim();
  }

  // Parse sections - handle both # and ## headers
  const sections = content.split(/(?=^#{1,2}\s)/gm);
  
  // Extract Professional Summary
  let professionalSummary = 'Experienced professional with expertise in multiple domains.';
  const summarySection = sections.find(s => 
    s.includes('Professional Summary') || 
    s.includes('Summary') || 
    s.includes('PROFESSIONAL SUMMARY')
  );
  if (summarySection) {
    // Remove the header and get the content
    const summaryContent = summarySection
      .replace(/^#{1,2}\s*.+?\n/, '')
      .replace(/^#{1,2}\s*.+?\n/, '') // Remove any additional headers
      .trim();
    if (summaryContent) {
      professionalSummary = summaryContent;
    }
  }

  // Extract Core Skills
  const coreSkills = [];
  const skillsSection = sections.find(s => 
    s.includes('Core Skills') || 
    s.includes('Skills') || 
    s.includes('CORE SKILLS') ||
    s.includes('Technical Skills')
  );
  if (skillsSection) {
    // Look for bullet points or line items
    const skillMatches = skillsSection.match(/(?:[-•*]\s*|^\s*)(.+?)(?=\n|$)/gm);
    if (skillMatches) {
      skillMatches.forEach(skill => {
        const cleanSkill = skill
          .replace(/^[-•*]\s*/, '')
          .replace(/^#.*$/, '') // Remove any headers
          .trim();
        if (cleanSkill && !cleanSkill.includes('Skills') && cleanSkill.length > 2) {
          coreSkills.push(cleanSkill);
        }
      });
    } else {
      // Try to extract skills from paragraph text
      const skillsText = skillsSection
        .replace(/^#{1,2}\s*.+?\n/, '')
        .replace(/Expertise in|Proficient in|Skilled in/gi, '')
        .trim();
      if (skillsText) {
        // Split by common delimiters
        const skillItems = skillsText.split(/[,;•\n]/).map(s => s.trim()).filter(s => s.length > 2);
        coreSkills.push(...skillItems.slice(0, 8)); // Limit to reasonable number
      }
    }
  }

  // Extract Experience - Improved parsing
  const experience: Array<{
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    responsibilities: string[];
  }> = [];
  const expSection = sections.find(s => 
    s.includes('Experience') || 
    s.includes('Employment') ||
    s.includes('EXPERIENCE') ||
    s.includes('Work History')
  );
  
  if (expSection) {
    // Split experience section into individual jobs
    const jobSections = expSection.split(/(?=^\*\*)/gm).filter(section => section.trim());
    
    jobSections.forEach(jobSection => {
      if (jobSection.includes('**') && jobSection.length > 20) {
        const lines = jobSection.split('\n').filter(line => line.trim());
        
        // Extract job title and company from the first line
        const titleLine = lines[0];
        if (titleLine && titleLine.includes('**')) {
          const titleMatch = titleLine.match(/\*\*(.+?)\*\*/);
          const title = titleMatch ? titleMatch[1].trim() : 'Professional Role';
          
          // Extract company and location from the second line
          let company = 'Organization';
          let location = 'Location';
          let dates = '2020 - Present';
          
          if (lines[1]) {
            const companyLine = lines[1];
            // Look for company name and location pattern
            const companyMatch = companyLine.match(/([^,]+?)(?:,\s*([^|]+))?\s*\|\s*(.+)/);
            if (companyMatch) {
              company = companyMatch[1].trim();
              if (companyMatch[2]) location = companyMatch[2].trim();
              dates = companyMatch[3].trim();
            } else {
              // Fallback parsing
              const parts = companyLine.split('|');
              if (parts.length >= 2) {
                const companyLocation = parts[0].trim();
                const locationDateParts = companyLocation.split(',');
                if (locationDateParts.length >= 2) {
                  company = locationDateParts[0].trim();
                  location = locationDateParts.slice(1).join(',').trim();
                } else {
                  company = companyLocation;
                }
                dates = parts[1].trim();
              }
            }
          }
          
          // Extract responsibilities
          const responsibilities: string[] = [];
          for (let i = 2; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('-') || line.startsWith('•')) {
              const responsibility = line.replace(/^[-•]\s*/, '').trim();
              if (responsibility) {
                responsibilities.push(responsibility);
              }
            }
          }
          
          // Parse dates
          const dateMatch = dates.match(/(\d{4})\s*–\s*(\d{4}|Present)/);
          const startDate = dateMatch ? dateMatch[1] : '2020';
          const endDate = dateMatch ? dateMatch[2] : 'Present';
          const current = endDate === 'Present';
          
          experience.push({
            title,
            company,
            location,
            startDate,
            endDate,
            current,
            responsibilities: responsibilities.length > 0 ? responsibilities : [
              'Led strategic initiatives and operational improvements',
              'Collaborated with cross-functional teams on key projects',
              'Implemented process improvements and best practices'
            ]
          });
        }
      }
    });
  }

  // Extract Education - Improved parsing
  const education: Array<{
    degree: string;
    institution: string;
    location?: string;
    year: string;
  }> = [];
  const eduSection = sections.find(s => 
    s.includes('Education') || 
    s.includes('EDUCATION') ||
    s.includes('Academic Background')
  );
  
  if (eduSection) {
    const eduLines = eduSection.split('\n').filter(line => 
      line.trim() && 
      !line.startsWith('#') && 
      !line.toLowerCase().includes('education')
    );
    
    // Look for degree patterns
    const degreePatterns = eduLines.filter(line => 
      line.includes('**') || 
      line.includes('LL.M.') || 
      line.includes('J.D.') ||
      line.includes('Bachelor') ||
      line.includes('Master')
    );
    
    degreePatterns.forEach((degreeLine, index) => {
      const nextLine = eduLines[eduLines.indexOf(degreeLine) + 1];
      
      // Extract degree
      const degreeMatch = degreeLine.match(/\*\*(.+?)\*\*/);
      const degree = degreeMatch ? degreeMatch[1].trim() : degreeLine.trim();
      
      // Extract institution and year
      let institution = 'Institution';
      let year = '2020';
      let location = 'Location';
      
      if (nextLine) {
        const instMatch = nextLine.match(/([^,]+?)(?:,\s*([^|]+))?\s*\|\s*(.+)/);
        if (instMatch) {
          institution = instMatch[1].trim();
          if (instMatch[2]) location = instMatch[2].trim();
          year = instMatch[3].trim();
        } else {
          // Fallback parsing
          const parts = nextLine.split('|');
          if (parts.length >= 2) {
            const instLocation = parts[0].trim();
            const locationYearParts = instLocation.split(',');
            if (locationYearParts.length >= 2) {
              institution = locationYearParts[0].trim();
              location = locationYearParts.slice(1).join(',').trim();
            } else {
              institution = instLocation;
            }
            year = parts[1].trim();
          }
        }
      }
      
      education.push({
        degree,
        institution,
        location,
        year
      });
    });
  }

  return {
    personalInfo,
    professionalSummary,
    coreSkills: coreSkills.length > 0 ? coreSkills : ['Contract Management', 'Legal Operations', 'Compliance', 'Process Improvement'],
    experience,
    education,
    licenses: [],
    additionalSections: {}
  };
};

// Template Components with Real Visual Differences
const ModernProfessionalTemplate: React.FC<{ data: any }> = ({ data }) => (
  <div className="bg-white p-8 max-w-4xl mx-auto font-sans">
    {/* Header */}
    <div className="text-center border-b-2 border-blue-600 pb-6 mb-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.personalInfo.name}</h1>
      <div className="text-gray-600 space-y-1">
        <p>{data.personalInfo.email}</p>
        <p>{data.personalInfo.phone}</p>
        <p>{data.personalInfo.location}</p>
      </div>
    </div>

    {/* Professional Summary */}
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
        Professional Summary
      </h2>
      <p className="text-gray-700 leading-relaxed text-justify">
        {data.professionalSummary}
      </p>
    </div>

    {/* Core Skills */}
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
        Core Skills
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {data.coreSkills.map((skill: string, index: number) => (
          <div key={index} className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            <span className="text-gray-700 text-sm">{skill}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Experience */}
    {data.experience.length > 0 && (
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
          Professional Experience
        </h2>
        {data.experience.map((exp: any, index: number) => (
          <div key={index} className="mb-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                <p className="text-gray-600">{exp.company}{exp.location && `, ${exp.location}`}</p>
              </div>
              <span className="text-gray-500 text-sm">
                {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
              </span>
            </div>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              {exp.responsibilities.map((resp: string, respIndex: number) => (
                <li key={respIndex}>{resp}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )}

    {/* Education */}
    {data.education.length > 0 && (
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">
          Education
        </h2>
        {data.education.map((edu: any, index: number) => (
          <div key={index} className="mb-2">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                <p className="text-gray-600">{edu.institution}{edu.location && `, ${edu.location}`}</p>
              </div>
              <span className="text-gray-500 text-sm">{edu.year}</span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const CreativeProfessionalTemplate: React.FC<{ data: any }> = ({ data }) => (
  <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 max-w-4xl mx-auto font-sans">
    {/* Header with Creative Design */}
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 -m-8 mb-8 rounded-b-3xl">
      <h1 className="text-4xl font-bold mb-3">{data.personalInfo.name}</h1>
      <div className="space-y-1 text-purple-100">
        <p>{data.personalInfo.email}</p>
        <p>{data.personalInfo.phone}</p>
        <p>{data.personalInfo.location}</p>
      </div>
    </div>

    {/* Professional Summary */}
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-purple-800 mb-4 bg-purple-100 px-4 py-2 rounded-lg">
        Professional Summary
      </h2>
      <p className="text-gray-700 leading-relaxed text-justify">
        {data.professionalSummary}
      </p>
    </div>

    {/* Core Skills */}
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-purple-800 mb-4 bg-purple-100 px-4 py-2 rounded-lg">
        Core Skills
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {data.coreSkills.map((skill: string, index: number) => (
          <div key={index} className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-purple-500">
            <span className="text-gray-700 font-medium">{skill}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Experience */}
    {data.experience.length > 0 && (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-purple-800 mb-4 bg-purple-100 px-4 py-2 rounded-lg">
          Professional Experience
        </h2>
        {data.experience.map((exp: any, index: number) => (
          <div key={index} className="mb-6 bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{exp.title}</h3>
                <p className="text-purple-600 font-medium">{exp.company}{exp.location && `, ${exp.location}`}</p>
              </div>
              <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">
                {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
              </span>
            </div>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-2">
              {exp.responsibilities.map((resp: string, respIndex: number) => (
                <li key={respIndex}>{resp}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )}

    {/* Education */}
    {data.education.length > 0 && (
      <div>
        <h2 className="text-2xl font-bold text-purple-800 mb-4 bg-purple-100 px-4 py-2 rounded-lg">
          Education
        </h2>
        {data.education.map((edu: any, index: number) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                <p className="text-purple-600">{edu.institution}{edu.location && `, ${edu.location}`}</p>
              </div>
              <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">{edu.year}</span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const ExecutiveTemplate: React.FC<{ data: any }> = ({ data }) => (
  <div className="bg-white p-12 max-w-4xl mx-auto font-serif">
    {/* Executive Header */}
    <div className="text-center border-b-4 border-gray-800 pb-8 mb-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-wide">{data.personalInfo.name}</h1>
      <div className="text-gray-600 space-y-1 text-lg">
        <p>{data.personalInfo.email}</p>
        <p>{data.personalInfo.phone}</p>
        <p className="font-medium">{data.personalInfo.location}</p>
      </div>
    </div>

    {/* Professional Summary */}
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide border-b-2 border-gray-800 pb-2">
        Executive Summary
      </h2>
      <p className="text-gray-700 leading-relaxed text-justify text-lg">
        {data.professionalSummary}
      </p>
    </div>

    {/* Core Skills */}
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide border-b-2 border-gray-800 pb-2">
        Core Competencies
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {data.coreSkills.map((skill: string, index: number) => (
          <div key={index} className="text-center p-4 border border-gray-300">
            <span className="text-gray-800 font-medium text-lg">{skill}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Experience */}
    {data.experience.length > 0 && (
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide border-b-2 border-gray-800 pb-2">
          Executive Experience
        </h2>
        {data.experience.map((exp: any, index: number) => (
          <div key={index} className="mb-8 border-l-4 border-gray-800 pl-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-xl">{exp.title}</h3>
                <p className="text-gray-600 text-lg">{exp.company}{exp.location && `, ${exp.location}`}</p>
              </div>
              <span className="text-gray-500 text-lg font-medium">
                {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
              </span>
            </div>
            <ul className="list-disc list-inside text-gray-700 text-lg space-y-2">
              {exp.responsibilities.map((resp: string, respIndex: number) => (
                <li key={respIndex}>{resp}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )}

    {/* Education */}
    {data.education.length > 0 && (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide border-b-2 border-gray-800 pb-2">
          Education
        </h2>
        {data.education.map((edu: any, index: number) => (
          <div key={index} className="border-l-4 border-gray-800 pl-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-xl">{edu.degree}</h3>
                <p className="text-gray-600 text-lg">{edu.institution}{edu.location && `, ${edu.location}`}</p>
              </div>
              <span className="text-gray-500 text-lg font-medium">{edu.year}</span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Add this import if downloadOptimizedPDF is exported from dashboard/page.tsx
// import { downloadOptimizedPDF } from '../app/dashboard/page';

// If not, define the function here (copy from dashboard/page.tsx):
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// PDF-optimized CSS that gets temporarily applied
const pdfOptimizedStyles = `
  .pdf-optimized {
    font-size: 12pt !important;
    line-height: 1.4 !important;
    padding: 0.75in !important;
    margin: 0 !important;
    font-family: Arial, sans-serif !important;
    color: #000000 !important;
    background: white !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    box-sizing: border-box !important;
    width: 100% !important;
    height: auto !important;
    * {
      margin-bottom: 8pt !important;
      box-sizing: border-box !important;
    }
    h1, h2, h3 {
      margin-top: 12pt !important;
      margin-bottom: 6pt !important;
      font-weight: bold !important;
    }
    .section {
      margin-bottom: 16pt !important;
      page-break-inside: avoid !important;
    }
    ul, ol {
      margin-left: 20pt !important;
      margin-bottom: 8pt !important;
    }
    li {
      margin-bottom: 4pt !important;
    }
  }
`;

function injectPDFStyles() {
  const styleElement = document.createElement('style');
  styleElement.id = 'pdf-optimized-styles';
  styleElement.textContent = pdfOptimizedStyles;
  document.head.appendChild(styleElement);
}

function removePDFStyles() {
  const styleElement = document.getElementById('pdf-optimized-styles');
  if (styleElement) {
    styleElement.remove();
  }
}

async function exportToPDF(elementId: string, filename = 'resume.pdf') {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }
    injectPDFStyles();
    element.classList.add('pdf-optimized');
    await new Promise(resolve => setTimeout(resolve, 100));
    const elementWidth = element.scrollWidth;
    const elementHeight = element.scrollHeight;
    // Set PDF size in points (1in = 72pt)
    const pdfWidthIn = 8.5;
    const pdfHeightIn = 11;
    const pdfWidth = pdfWidthIn * 96; // px for html2canvas
    const pdfHeight = pdfHeightIn * 96; // px for html2canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      width: elementWidth,
      height: elementHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: elementWidth,
      windowHeight: elementHeight,
      x: 0,
      y: 0,
      logging: false
    });
    element.classList.remove('pdf-optimized');
    removePDFStyles();
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdfDoc = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [pdfWidthIn, pdfHeightIn]
    });
    // Calculate the number of pages
    const pageHeightPx = pdfHeight;
    const totalPages = Math.ceil(canvas.height / pageHeightPx);
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) pdfDoc.addPage();
      const yOffset = -page * pageHeightPx;
      // Fix 2: Use correct addImage signature (remove extra args)
      pdfDoc.addImage(
        imgData,
        'PNG',
        0,
        0 + (yOffset / 96), // convert px offset to inches for jsPDF
        pdfWidthIn,
        pdfHeightIn
      );
    }
    pdfDoc.save(filename);
    return { success: true, message: 'PDF exported successfully' };
  } catch (error: any) { // Fix 3: Type error as any
    console.error('PDF Export Error:', error);
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.remove('pdf-optimized');
    }
    removePDFStyles();
    return { success: false, error: error.message };
  }
}

export const DocumentTemplatePreview: React.FC<DocumentTemplatePreviewProps> = ({
  documentContent,
  documentTitle,
  onDownload
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  
  const resumeData = parseDocumentContent(documentContent);
  
  // Function to get the appropriate PDF template component
  const getPDFTemplateComponent = (templateId: string) => {
    switch (templateId) {
      case 'modern_professional':
        return PDFModernProfessionalTemplate;
      case 'creative':
        return PDFCreativeTemplate;
      case 'executive':
        return PDFExecutiveTemplate;
      default:
        return PDFModernProfessionalTemplate;
    }
  };
  
  const templates = [
    {
      id: 'modern_professional',
      name: 'Modern Professional',
      description: 'Clean, professional layout for most industries',
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      component: ModernProfessionalTemplate
    },
    {
      id: 'creative',
      name: 'Creative Professional', 
      description: 'Eye-catching design for creative roles',
      color: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
      component: CreativeProfessionalTemplate
    },
    {
      id: 'executive',
      name: 'Executive',
      description: 'Premium design for senior positions',
      color: 'bg-gray-800',
      hoverColor: 'hover:bg-gray-900',
      component: ExecutiveTemplate
    }
  ];

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const TemplatePreviewCard: React.FC<{ template: typeof templates[0] }> = ({ template }) => {
    const PDFTemplateComponent = getPDFTemplateComponent(template.id);
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
        {/* Mini Preview with Zoom Controls */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 font-medium">Preview</span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="h-6 w-6 p-0"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-xs text-gray-500 w-8 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 2}
                className="h-6 w-6 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* PDFViewer Preview Container */}
          <div className="aspect-[3/4] bg-gray-50 rounded border border-gray-200 overflow-hidden">
            <PDFViewer width="100%" height="400" style={{ border: 'none' }}>
              <PDFTemplateComponent data={resumeData} />
            </PDFViewer>
          </div>
        </div>
        
        {/* Template Info */}
        <h6 className="font-medium text-gray-900 mb-1">{template.name}</h6>
        <p className="text-xs text-gray-600 mb-3">{template.description}</p>
        
        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            size="sm"
            onClick={() => setShowPreview(showPreview === template.id ? null : template.id)}
            variant="outline"
            className="w-full text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            {showPreview === template.id ? 'Hide Preview' : 'Preview'}
          </Button>
          
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={() => onDownload(template.id, 'pdf')}
              className={`flex-1 text-xs ${template.color} ${template.hoverColor} text-white`}
            >
              PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDownload(template.id, 'docx')}
              className="flex-1 text-xs"
            >
              DOCX
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h5 className="font-medium text-blue-900 mb-3">
        Choose Template & Download
      </h5>
      <p className="text-sm text-blue-700 mb-4">
        Select a professional template to format and download your document:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map(template => (
          <TemplatePreviewCard key={template.id} template={template} />
        ))}
      </div>
      
      {/* Full Preview Modal/Section */}
      {showPreview && (
        <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h6 className="font-medium text-gray-900">
              Template Preview: {templates.find(t => t.id === showPreview)?.name}
            </h6>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.5}
                  className="h-8 w-8 p-0"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-500 w-12 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 2}
                  className="h-8 w-8 p-0"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPreview(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
          
          {/* PDFViewer Preview for Selected Template */}
          <div className="my-6 border rounded shadow overflow-hidden" style={{ height: 900 }}>
            <PDFViewer key={showPreview} width="100%" height="900">
              {(() => {
                const selectedTemplate = templates.find(t => t.id === showPreview);
                const PDFTemplateComponent = getPDFTemplateComponent(showPreview);
                return <PDFTemplateComponent data={resumeData} />;
              })()}
            </PDFViewer>
          </div>
          {/* Add the new button here */}
          <div className="mt-4 flex gap-2 justify-end">
            <Button
              onClick={async () => { await exportToPDF('resume-preview', 'resume.pdf'); }}
              className="bg-green-700 text-white hover:bg-green-800"
            >
              Export to PDF (Production)
            </Button>
          </div>
        </div>
      )}
      
      {/* Quick Download (Original Format) */}
      <div className="mt-4 pt-4 border-t border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h6 className="font-medium text-blue-900">Quick Download</h6>
            <p className="text-xs text-blue-700">Download in original generated format</p>
          </div>
          <Button
            onClick={() => onDownload('original', 'txt')}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Original
          </Button>
        </div>
        {/* PDFDownloadLink for ModernProfessionalTemplate */}
        <div className="mt-2">
          <PDFDownloadLink
            document={<PDFModernProfessionalTemplate data={resumeData} />}
            fileName={`${documentTitle || 'resume'}.pdf`}
          >
            {({ loading }) => (
              <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-2">
                {loading ? 'Preparing PDF...' : 'Download PDF (Modern Template)'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>
    </div>
  );
}; 