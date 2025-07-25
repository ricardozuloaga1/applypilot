import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import ResumePreview from './ResumePreview';

// Types for resume data structure
interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  citizenship?: string;
}

interface Experience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  responsibilities: string[];
}

interface Education {
  degree: string;
  institution: string;
  location?: string;
  year: string;
  gpa?: string;
  honors?: string;
}

interface ResumeData {
  personalInfo: PersonalInfo;
  professionalSummary: string;
  coreSkills: string[];
  experience: Experience[];
  education: Education[];
  licenses?: string[];
  additionalSections?: {
    tools?: string[];
    languages?: string[];
    projects?: string[];
    certifications?: string[];
  };
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: string;
  component: React.ComponentType<{ data: ResumeData }>;
}

// Update styles to use Helvetica
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    color: '#64748b',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  experienceItem: {
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  companyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  company: {
    fontSize: 10,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  dates: {
    fontSize: 9,
    color: '#64748b',
    fontStyle: 'italic',
  },
  responsibility: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 3,
    paddingLeft: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillItem: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    fontSize: 8,
    color: '#475569',
    marginBottom: 4,
  },
  summary: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.5,
    textAlign: 'justify',
  }
});

const headerStyles = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 15,
  backgroundColor: '#1f2937',
  color: '#ffffff',
};

const nameStyles = {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#ffffff',
};

const contactInfoStyles = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '100%',
  color: '#e2e8f0',
};

// Modern Professional Template
const ModernProfessionalTemplate: React.FC<{ data: ResumeData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.name}>{data.personalInfo.name}</Text>
        <View style={styles.contactInfo}>
          <Text>{data.personalInfo.email}</Text>
          <Text>{data.personalInfo.phone}</Text>
          <Text>{data.personalInfo.location}</Text>
        </View>
      </View>

      {/* Professional Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Summary</Text>
        <Text style={styles.summary}>{data.professionalSummary}</Text>
      </View>

      {/* Core Skills */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Core Skills</Text>
        <View style={styles.skillsContainer}>
          {data.coreSkills.map((skill, index) => (
            <Text key={index} style={styles.skillItem}>{skill}</Text>
          ))}
        </View>
      </View>

      {/* Professional Experience */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Experience</Text>
        {data.experience.map((job, index) => (
          <View key={index} style={styles.experienceItem}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <View style={styles.companyInfo}>
              <Text style={styles.company}>{job.company}{job.location && `, ${job.location}`}</Text>
              <Text style={styles.dates}>
                {job.startDate} – {job.current ? 'Present' : job.endDate}
              </Text>
            </View>
            {job.responsibilities.map((resp, respIndex) => (
              <Text key={respIndex} style={styles.responsibility}>• {resp}</Text>
            ))}
          </View>
        ))}
      </View>

      {/* Education */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Education</Text>
        {data.education.map((edu, index) => (
          <View key={index} style={styles.experienceItem}>
            <Text style={styles.jobTitle}>{edu.degree}</Text>
            <View style={styles.companyInfo}>
              <Text style={styles.company}>{edu.institution}{edu.location && `, ${edu.location}`}</Text>
              <Text style={styles.dates}>{edu.year}</Text>
            </View>
            {edu.gpa && (
              <Text style={styles.responsibility}>GPA: {edu.gpa}</Text>
            )}
            {edu.honors && (
              <Text style={styles.responsibility}>{edu.honors}</Text>
            )}
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

// Creative Template with Color Accents
const CreativeTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
  const creativeStyles = StyleSheet.create({
    ...styles,
    page: {
      ...styles.page,
      backgroundColor: '#fafafa',
    },
    header: {
      ...headerStyles,
      backgroundColor: '#2563eb',
    },
    name: {
      ...nameStyles,
    },
    contactInfo: {
      ...contactInfoStyles,
    },
    section: {
      ...styles.section,
      marginBottom: 20, // Adjusted for consistent spacing
    },
    sectionTitle: {
      ...styles.sectionTitle,
      color: '#2563eb',
      backgroundColor: '#eff6ff',
      padding: 6,
      marginBottom: 12,
    }
  });

  return (
    <Document>
      <Page size="A4" style={creativeStyles.page}>
        <View style={creativeStyles.header}>
          <Text style={creativeStyles.name}>{data.personalInfo.name}</Text>
          <View style={creativeStyles.contactInfo}>
            <Text>{data.personalInfo.email}</Text>
            <Text>{data.personalInfo.phone}</Text>
            <Text>{data.personalInfo.location}</Text>
          </View>
        </View>

        {/* Professional Summary */}
        <View style={creativeStyles.section}>
          <Text style={creativeStyles.sectionTitle}>Professional Summary</Text>
          <Text style={creativeStyles.summary}>{data.professionalSummary}</Text>
        </View>

        {/* Core Skills */}
        <View style={creativeStyles.section}>
          <Text style={creativeStyles.sectionTitle}>Core Skills</Text>
          <View style={creativeStyles.skillsContainer}>
            {data.coreSkills.map((skill, index) => (
              <Text key={index} style={creativeStyles.skillItem}>{skill}</Text>
            ))}
          </View>
        </View>

        {/* Professional Experience */}
        <View style={creativeStyles.section}>
          <Text style={creativeStyles.sectionTitle}>Professional Experience</Text>
          {data.experience.map((job, index) => (
            <View key={index} style={creativeStyles.experienceItem}>
              <Text style={creativeStyles.jobTitle}>{job.title}</Text>
              <View style={creativeStyles.companyInfo}>
                <Text style={creativeStyles.company}>{job.company}{job.location && `, ${job.location}`}</Text>
                <Text style={creativeStyles.dates}>
                  {job.startDate} – {job.current ? 'Present' : job.endDate}
                </Text>
              </View>
              {job.responsibilities.map((resp, respIndex) => (
                <Text key={respIndex} style={creativeStyles.responsibility}>• {resp}</Text>
              ))}
            </View>
          ))}
        </View>

        {/* Education */}
        <View style={creativeStyles.section}>
          <Text style={creativeStyles.sectionTitle}>Education</Text>
          {data.education.map((edu, index) => (
            <View key={index} style={creativeStyles.experienceItem}>
              <Text style={creativeStyles.jobTitle}>{edu.degree}</Text>
              <View style={creativeStyles.companyInfo}>
                <Text style={creativeStyles.company}>{edu.institution}{edu.location && `, ${edu.location}`}</Text>
                <Text style={creativeStyles.dates}>{edu.year}</Text>
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

// Executive Template for Senior Positions
const ExecutiveTemplate: React.FC<{ data: ResumeData }> = ({ data }) => {
  const executiveStyles = StyleSheet.create({
    ...styles,
    page: {
      ...styles.page,
      padding: 50,
    },
    header: {
      ...headerStyles,
    },
    name: {
      ...nameStyles,
    },
    contactInfo: {
      ...contactInfoStyles,
    },
    section: {
      ...styles.section,
      marginBottom: 20, // Adjusted for consistent spacing
    },
    sectionTitle: {
      ...styles.sectionTitle,
      fontSize: 12,
      color: '#1f2937',
      borderBottomWidth: 2,
      borderBottomColor: '#1f2937',
    }
  });

  return (
    <Document>
      <Page size="A4" style={executiveStyles.page}>
        <View style={executiveStyles.header}>
          <Text style={executiveStyles.name}>{data.personalInfo.name}</Text>
          <View style={executiveStyles.contactInfo}>
            <Text>{data.personalInfo.email}</Text>
            <Text>{data.personalInfo.phone}</Text>
            <Text>{data.personalInfo.location}</Text>
          </View>
        </View>

        {/* Professional Summary */}
        <View style={executiveStyles.section}>
          <Text style={executiveStyles.sectionTitle}>Executive Summary</Text>
          <Text style={executiveStyles.summary}>{data.professionalSummary}</Text>
        </View>

        {/* Core Competencies */}
        <View style={executiveStyles.section}>
          <Text style={executiveStyles.sectionTitle}>Core Competencies</Text>
          <View style={executiveStyles.skillsContainer}>
            {data.coreSkills.map((skill, index) => (
              <Text key={index} style={executiveStyles.skillItem}>{skill}</Text>
            ))}
          </View>
        </View>

        {/* Professional Experience */}
        <View style={executiveStyles.section}>
          <Text style={executiveStyles.sectionTitle}>Executive Experience</Text>
          {data.experience.map((job, index) => (
            <View key={index} style={executiveStyles.experienceItem}>
              <Text style={executiveStyles.jobTitle}>{job.title}</Text>
              <View style={executiveStyles.companyInfo}>
                <Text style={executiveStyles.company}>{job.company}{job.location && `, ${job.location}`}</Text>
                <Text style={executiveStyles.dates}>
                  {job.startDate} – {job.current ? 'Present' : job.endDate}
                </Text>
              </View>
              {job.responsibilities.map((resp, respIndex) => (
                <Text key={respIndex} style={executiveStyles.responsibility}>• {resp}</Text>
              ))}
            </View>
          ))}
        </View>

        {/* Education */}
        <View style={executiveStyles.section}>
          <Text style={executiveStyles.sectionTitle}>Education</Text>
          {data.education.map((edu, index) => (
            <View key={index} style={executiveStyles.experienceItem}>
              <Text style={executiveStyles.jobTitle}>{edu.degree}</Text>
              <View style={executiveStyles.companyInfo}>
                <Text style={executiveStyles.company}>{edu.institution}{edu.location && `, ${edu.location}`}</Text>
                <Text style={executiveStyles.dates}>{edu.year}</Text>
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

// Template Management System
class ProfessionalResumeTemplates {
  templates: Record<string, Template>;

  constructor() {
    this.templates = {
      'modern-professional': {
        id: 'modern-professional',
        name: 'Modern Professional',
        description: 'Clean, modern design perfect for tech and business roles',
        component: ModernProfessionalTemplate,
        category: 'professional',
        preview: '/templates/previews/modern-professional.png'
      },
      'creative': {
        id: 'creative',
        name: 'Creative Professional',
        description: 'Eye-catching design for creative and marketing roles',
        component: CreativeTemplate,
        category: 'creative',
        preview: '/templates/previews/creative.png'
      },
      'executive': {
        id: 'executive',
        name: 'Executive',
        description: 'Sophisticated design for senior leadership positions',
        component: ExecutiveTemplate,
        category: 'executive',
        preview: '/templates/previews/executive.png'
      }
    };
  }

  getTemplate(templateId: string): Template | undefined {
    return this.templates[templateId];
  }

  getTemplatesByCategory(category: string): Template[] {
    return Object.values(this.templates).filter(t => t.category === category);
  }

  getAllTemplates(): Template[] {
    return Object.values(this.templates);
  }

  // Generate resume with selected template
  async generateResumeWithTemplate(templateId: string, resumeData: ResumeData): Promise<{
    template: React.ComponentType<{ data: ResumeData }>;
    data: ResumeData;
    templateInfo: Template;
  }> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Apply any data transformations or optimizations here
    const processedData = this.processResumeData(resumeData);
    
    return {
      template: template.component,
      data: processedData,
      templateInfo: template
    };
  }

  private processResumeData(resumeData: ResumeData): ResumeData {
    return {
      ...resumeData,
      // Ensure consistent date formatting
      experience: resumeData.experience.map(exp => ({
        ...exp,
        startDate: this.formatDate(exp.startDate),
        endDate: exp.current ? 'Present' : this.formatDate(exp.endDate)
      })),
      // Limit skills for template constraints
      coreSkills: resumeData.coreSkills.slice(0, 12)
    };
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr + '-01'); // Add day for parsing
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}

// Mini template preview components for template selector cards
const ModernProfessionalMiniPreview: React.FC = () => (
  <div className="w-full h-full bg-white border border-gray-200 rounded text-[6px] overflow-hidden">
    <div className="h-4 bg-blue-600 p-1">
      <div className="h-1 bg-white/80 rounded mb-0.5"></div>
      <div className="flex gap-0.5">
        <div className="h-0.5 w-6 bg-white/60 rounded"></div>
        <div className="h-0.5 w-4 bg-white/60 rounded"></div>
        <div className="h-0.5 w-5 bg-white/60 rounded"></div>
      </div>
    </div>
    <div className="p-1 space-y-1">
      <div className="space-y-0.5">
        <div className="h-0.5 w-full bg-gray-300 rounded"></div>
        <div className="h-0.5 w-4/5 bg-gray-300 rounded"></div>
        <div className="h-0.5 w-3/4 bg-gray-300 rounded"></div>
      </div>
      <div className="flex gap-0.5">
        <div className="h-1 w-2 bg-gray-100 rounded"></div>
        <div className="h-1 w-2 bg-gray-100 rounded"></div>
        <div className="h-1 w-2 bg-gray-100 rounded"></div>
      </div>
      <div className="space-y-0.5">
        <div className="h-0.5 w-full bg-gray-300 rounded"></div>
        <div className="h-0.5 w-5/6 bg-gray-300 rounded"></div>
      </div>
    </div>
  </div>
);

const CreativeMiniPreview: React.FC = () => (
  <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 border border-gray-200 rounded text-[6px] overflow-hidden">
    <div className="h-5 bg-gradient-to-r from-purple-500 to-pink-500 p-1">
      <div className="h-1 bg-white/90 rounded mb-0.5 w-3/4"></div>
      <div className="flex gap-0.5">
        <div className="h-0.5 w-4 bg-white/70 rounded"></div>
        <div className="h-0.5 w-3 bg-white/70 rounded"></div>
      </div>
    </div>
    <div className="p-1 space-y-1">
      <div className="space-y-0.5">
        <div className="h-0.5 w-full bg-purple-200 rounded"></div>
        <div className="h-0.5 w-4/5 bg-purple-200 rounded"></div>
      </div>
      <div className="flex gap-0.5">
        <div className="h-1 w-2 bg-purple-100 rounded"></div>
        <div className="h-1 w-2 bg-pink-100 rounded"></div>
      </div>
      <div className="space-y-0.5">
        <div className="h-0.5 w-full bg-purple-200 rounded"></div>
        <div className="h-0.5 w-3/4 bg-purple-200 rounded"></div>
      </div>
    </div>
  </div>
);

const ExecutiveMiniPreview: React.FC = () => (
  <div className="w-full h-full bg-white border-2 border-gray-800 rounded text-[6px] overflow-hidden">
    <div className="h-3 bg-gray-800 p-1">
      <div className="h-0.5 bg-white rounded mb-0.5 w-2/3"></div>
      <div className="h-0.5 bg-white/80 rounded w-1/2"></div>
    </div>
    <div className="p-1 space-y-1">
      <div className="border-l-2 border-gray-800 pl-1 space-y-0.5">
        <div className="h-0.5 w-full bg-gray-400 rounded"></div>
        <div className="h-0.5 w-5/6 bg-gray-400 rounded"></div>
      </div>
      <div className="space-y-0.5">
        <div className="h-0.5 w-full bg-gray-300 rounded"></div>
        <div className="h-0.5 w-4/5 bg-gray-300 rounded"></div>
      </div>
    </div>
  </div>
);

// Template Selector Component
interface TemplateSelectorProps {
  onSelectTemplate: (templateId: string) => void;
  selectedTemplate?: string;
  resumeData: ResumeData;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ 
  onSelectTemplate, 
  selectedTemplate,
  resumeData 
}) => {
  const templates = new ProfessionalResumeTemplates();
  
  // Map template IDs to their mini preview components
  const getMiniPreview = (templateId: string) => {
    switch (templateId) {
      case 'modern_professional':
        return <ModernProfessionalMiniPreview />;
      case 'creative':
        return <CreativeMiniPreview />;
      case 'executive':
        return <ExecutiveMiniPreview />;
      default:
        return <ModernProfessionalMiniPreview />;
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Choose Professional Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.getAllTemplates().map(template => (
              <div 
                key={template.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => onSelectTemplate(template.id)}
              >
                <div className="aspect-[3/4] bg-gray-50 rounded mb-4 p-2 border border-gray-200">
                  {getMiniPreview(template.id)}
                </div>
                <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <Badge variant="outline" className="text-xs">
                  {template.category}
                </Badge>
              </div>
            ))}
          </div>

          {selectedTemplate && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                <strong>{templates.getTemplate(selectedTemplate)?.name}</strong> template selected. 
                See the preview below to view how your resume will look.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTemplate && (
        <ResumePreview 
          resumeData={resumeData} 
          templateId={selectedTemplate}
        />
      )}
    </div>
  );
};

export { 
  ProfessionalResumeTemplates, 
  TemplateSelector,
  ModernProfessionalTemplate,
  CreativeTemplate,
  ExecutiveTemplate 
};

export type { ResumeData, Template, PersonalInfo, Experience, Education }; 