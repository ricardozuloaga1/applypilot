import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Trash2, Plus, Upload, Edit3 } from 'lucide-react';

// Resume Data Structure (matches existing extraction format)
const defaultResumeData = {
  personalInfo: {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
    citizenship: ''
  },
  professionalSummary: '',
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

// Types for resume data structure (mirroring the professional templates)
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
  source?: string;
  completedAt?: string;
}

// Form component props
interface FormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

// Personal Information Form Component
const PersonalInfoForm: React.FC<FormProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof PersonalInfo, value: string) => {
    onChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        [field]: value
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-5 w-5" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name *</label>
            <Input
              value={data.personalInfo.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="John Smith"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <Input
              type="email"
              value={data.personalInfo.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="john.smith@email.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Phone *</label>
            <Input
              type="tel"
              value={data.personalInfo.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Location *</label>
            <Input
              value={data.personalInfo.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="New York, NY"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">LinkedIn Profile</label>
            <Input
              type="url"
              value={data.personalInfo.linkedin}
              onChange={(e) => handleChange('linkedin', e.target.value)}
              placeholder="https://linkedin.com/in/johnsmith"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Website/Portfolio</label>
            <Input
              type="url"
              value={data.personalInfo.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://johnsmith.dev"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Professional Summary Form Component
const ProfessionalSummaryForm: React.FC<FormProps> = ({ data, onChange }) => {
  const charCount = data.professionalSummary.length;
  const maxChars = 500;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <label className="block text-sm font-medium mb-2">
            Professional Summary * 
            <span className="text-sm text-gray-500 ml-2">
              2-3 sentences highlighting your experience and career objectives
            </span>
          </label>
          <Textarea
            value={data.professionalSummary}
            onChange={(e) => onChange({
              ...data,
              professionalSummary: e.target.value
            })}
            placeholder="Experienced software engineer with 5+ years in full-stack development, specializing in React and Node.js. Proven track record of leading cross-functional teams and delivering scalable solutions for Fortune 500 companies. Seeking to leverage technical expertise and leadership skills in a senior engineering role."
            rows={4}
            maxLength={maxChars}
            className="resize-none"
          />
          <div className={`text-right text-sm mt-1 ${charCount > maxChars * 0.9 ? 'text-orange-500' : 'text-gray-500'}`}>
            {charCount}/{maxChars} characters
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Skills Form Component
const SkillsForm: React.FC<FormProps> = ({ data, onChange }) => {
  const [newSkill, setNewSkill] = useState('');

  const addSkill = () => {
    if (newSkill.trim() && !data.coreSkills.includes(newSkill.trim())) {
      onChange({
        ...data,
        coreSkills: [...data.coreSkills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onChange({
      ...data,
      coreSkills: data.coreSkills.filter((skill: string) => skill !== skillToRemove)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Core Skills (Optional)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Add Skills (press Enter to add each skill)
            </label>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="JavaScript, Project Management, Data Analysis..."
                className="flex-1"
              />
              <Button onClick={addSkill} type="button">Add</Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {data.coreSkills.map((skill: string, index: number) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {skill}
                <button 
                  onClick={() => removeSkill(skill)}
                  className="ml-1 hover:text-red-500"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          
          {data.coreSkills.length === 0 && (
            <p className="text-gray-500 text-sm italic">
              No skills added yet. You can add your key professional skills above, or skip this section.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Experience Form Component
const ExperienceForm: React.FC<FormProps> = ({ data, onChange }) => {
  const addExperience = () => {
    const newExperience: Experience = {
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      responsibilities: ['']
    };
    
    onChange({
      ...data,
      experience: [...data.experience, newExperience]
    });
  };

  const updateExperience = (index: number, field: keyof Experience, value: string | boolean) => {
    const updatedExperience = [...data.experience];
    if (field === 'current') {
      updatedExperience[index] = {
        ...updatedExperience[index],
        [field]: value as boolean
      };
    } else {
      updatedExperience[index] = {
        ...updatedExperience[index],
        [field]: value as string
      };
    }
    
    onChange({
      ...data,
      experience: updatedExperience
    });
  };

  const addResponsibility = (expIndex: number) => {
    const updatedExperience = [...data.experience];
    updatedExperience[expIndex].responsibilities.push('');
    
    onChange({
      ...data,
      experience: updatedExperience
    });
  };

  const updateResponsibility = (expIndex: number, respIndex: number, value: string) => {
    const updatedExperience = [...data.experience];
    updatedExperience[expIndex].responsibilities[respIndex] = value;
    
    onChange({
      ...data,
      experience: updatedExperience
    });
  };

  const removeResponsibility = (expIndex: number, respIndex: number) => {
    const updatedExperience = [...data.experience];
    updatedExperience[expIndex].responsibilities.splice(respIndex, 1);
    
    onChange({
      ...data,
      experience: updatedExperience
    });
  };

  const removeExperience = (index: number) => {
    const updatedExperience = data.experience.filter((_, i) => i !== index);
    onChange({
      ...data,
      experience: updatedExperience
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional Experience</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.experience.map((exp, expIndex) => (
          <div key={expIndex} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Position {expIndex + 1}</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeExperience(expIndex)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Job Title *</label>
                <Input
                  value={exp.title}
                  onChange={(e) => updateExperience(expIndex, 'title', e.target.value)}
                  placeholder="Senior Software Engineer"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Company *</label>
                <Input
                  value={exp.company}
                  onChange={(e) => updateExperience(expIndex, 'company', e.target.value)}
                  placeholder="Tech Corp Inc."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input
                  value={exp.location}
                  onChange={(e) => updateExperience(expIndex, 'location', e.target.value)}
                  placeholder="San Francisco, CA"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Start Date *</label>
                <Input
                  type="month"
                  value={exp.startDate}
                  onChange={(e) => updateExperience(expIndex, 'startDate', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <Input
                  type="month"
                  value={exp.current ? '' : exp.endDate}
                  onChange={(e) => updateExperience(expIndex, 'endDate', e.target.value)}
                  disabled={exp.current}
                />
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id={`current-${expIndex}`}
                    checked={exp.current}
                    onChange={(e) => {
                      updateExperience(expIndex, 'current', e.target.checked);
                      if (e.target.checked) {
                        updateExperience(expIndex, 'endDate', '');
                      }
                    }}
                    className="mr-2"
                  />
                  <label htmlFor={`current-${expIndex}`} className="text-sm">
                    I currently work here
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Key Responsibilities & Achievements
              </label>
              <div className="space-y-2">
                {exp.responsibilities.map((resp, respIndex) => (
                  <div key={respIndex} className="flex gap-2">
                    <Textarea
                      value={resp}
                      onChange={(e) => updateResponsibility(expIndex, respIndex, e.target.value)}
                      placeholder="• Led a team of 5 developers to deliver a customer portal, resulting in 30% increase in user engagement"
                      rows={2}
                      className="flex-1"
                    />
                    {exp.responsibilities.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeResponsibility(expIndex, respIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addResponsibility(expIndex)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Responsibility
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        <Button onClick={addExperience} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Work Experience
        </Button>
        
        {data.experience.length === 0 && (
          <p className="text-gray-500 text-sm italic text-center py-8">
            No work experience added yet. Add your professional experience above.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Education Form Component
const EducationForm: React.FC<FormProps> = ({ data, onChange }) => {
  const addEducation = () => {
    const newEducation: Education = {
      degree: '',
      institution: '',
      location: '',
      year: '',
      gpa: '',
      honors: ''
    };
    
    onChange({
      ...data,
      education: [...data.education, newEducation]
    });
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updatedEducation = [...data.education];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: value
    };
    
    onChange({
      ...data,
      education: updatedEducation
    });
  };

  const removeEducation = (index: number) => {
    const updatedEducation = data.education.filter((_, i) => i !== index);
    onChange({
      ...data,
      education: updatedEducation
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Education</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.education.map((edu, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Education {index + 1}</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeEducation(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Degree *</label>
                <Input
                  value={edu.degree}
                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  placeholder="Bachelor of Science in Computer Science"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Institution *</label>
                <Input
                  value={edu.institution}
                  onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                  placeholder="Stanford University"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input
                  value={edu.location}
                  onChange={(e) => updateEducation(index, 'location', e.target.value)}
                  placeholder="Stanford, CA"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Graduation Year *</label>
                <Input
                  type="number"
                  value={edu.year}
                  onChange={(e) => updateEducation(index, 'year', e.target.value)}
                  placeholder="2020"
                  min="1950"
                  max="2030"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">GPA (optional)</label>
                <Input
                  value={edu.gpa}
                  onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                  placeholder="3.8/4.0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Honors/Awards (optional)</label>
              <Input
                value={edu.honors}
                onChange={(e) => updateEducation(index, 'honors', e.target.value)}
                placeholder="Magna Cum Laude, Dean's List"
              />
            </div>
          </div>
        ))}
        
        <Button onClick={addEducation} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Education
        </Button>
        
        {data.education.length === 0 && (
          <p className="text-gray-500 text-sm italic text-center py-8">
            No education added yet. Add your educational background above.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Review and Template Selection Component
interface ReviewProps {
  resumeData: ResumeData;
  onComplete: () => void;
}

const ReviewAndTemplateSelection: React.FC<ReviewProps> = ({ resumeData, onComplete }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">{resumeData.personalInfo.name}</h4>
              <p className="text-gray-600 mb-1">{resumeData.personalInfo.email}</p>
              <p className="text-gray-600 mb-1">{resumeData.personalInfo.phone}</p>
              <p className="text-gray-600">{resumeData.personalInfo.location}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
              <p className="text-gray-600 text-sm">{resumeData.professionalSummary.substring(0, 150)}...</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Skills ({resumeData.coreSkills.length})</h4>
              <div className="flex flex-wrap gap-1">
                {resumeData.coreSkills.slice(0, 6).map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {resumeData.coreSkills.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{resumeData.coreSkills.length - 6} more
                  </Badge>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Experience</h4>
              <p className="text-gray-600 text-sm">{resumeData.experience.length} position(s)</p>
              
              <h4 className="font-medium text-gray-900 mb-2 mt-4">Education</h4>
              <p className="text-gray-600 text-sm">{resumeData.education.length} degree(s)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ready to Generate Professional Resume</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">
            Your resume information has been successfully collected. Click below to proceed 
            with template selection and AI optimization for your target jobs.
          </p>
          
          <Button 
            onClick={onComplete}
            size="lg"
            className="w-full"
          >
            Complete Resume Setup →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Manual Resume Builder Component
interface ManualResumeBuilderProps {
  onResumeComplete: (data: ResumeData) => void;
  initialData?: ResumeData | null;
}

const ManualResumeBuilder: React.FC<ManualResumeBuilderProps> = ({ onResumeComplete, initialData = null }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [resumeData, setResumeData] = useState(initialData || defaultResumeData as ResumeData);
  const [isValid, setIsValid] = useState(false);

  // Handle initialData changes (for auto-fill functionality)
  useEffect(() => {
    if (initialData) {
      setResumeData(initialData);
      // Reset to first step when auto-filling
      setCurrentStep(0);
    }
  }, [initialData]);

  const steps = [
    { title: 'Personal Info', component: PersonalInfoForm, required: true },
    { title: 'Professional Summary', component: ProfessionalSummaryForm, required: true },
    { title: 'Core Skills', component: SkillsForm, required: true },
    { title: 'Work Experience', component: ExperienceForm, required: true },
    { title: 'Education', component: EducationForm, required: true },
    { title: 'Review & Templates', component: null, required: false }
  ];

  // Validation logic
  useEffect(() => {
    const validateCurrentStep = (): boolean => {
      switch (currentStep) {
        case 0: // Personal Info
          return !!(resumeData.personalInfo.name && 
                   resumeData.personalInfo.email && 
                   resumeData.personalInfo.phone && 
                   resumeData.personalInfo.location);
        case 1: // Professional Summary
          return resumeData.professionalSummary.length > 50;
        case 2: // Core Skills
          return true; // Skills are optional
        case 3: // Work Experience
          return resumeData.experience.length >= 1 && 
                 !!resumeData.experience[0]?.title && 
                 !!resumeData.experience[0]?.company;
        case 4: // Education
          return resumeData.education.length >= 1 && 
                 !!resumeData.education[0]?.degree && 
                 !!resumeData.education[0]?.institution;
        default:
          return true;
      }
    };

    setIsValid(validateCurrentStep());
  }, [currentStep, resumeData]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Transform data to match existing system format
    const processedData: ResumeData = {
      ...resumeData,
      source: 'manual-input',
      completedAt: new Date().toISOString()
    };

    onResumeComplete(processedData);
  };

  const CurrentStepComponent = steps[currentStep]?.component;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center cursor-pointer ${
                    index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                  }`}
                  onClick={() => setCurrentStep(index)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-xs mt-1 text-center hidden sm:block">
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <div className="min-h-[600px]">
        {CurrentStepComponent ? (
          <CurrentStepComponent 
            data={resumeData} 
            onChange={setResumeData}
          />
        ) : (
          <ReviewAndTemplateSelection 
            resumeData={resumeData}
            onComplete={handleComplete}
          />
        )}
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            {currentStep > 0 ? (
              <Button variant="outline" onClick={prevStep}>
                ← Previous
              </Button>
            ) : (
              <div></div>
            )}
            
            {currentStep < steps.length - 1 ? (
              <Button 
                onClick={nextStep} 
                disabled={!isValid}
                className="ml-auto"
              >
                Next →
              </Button>
            ) : (
              <div></div>
            )}
          </div>

          {!isValid && steps[currentStep]?.required && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Please complete all required fields to continue.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManualResumeBuilder; 