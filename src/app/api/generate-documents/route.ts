import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ParsedResume, JobListing, GeneratedDocument } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validate API key
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not configured');
}

const RESUME_TEMPLATES = {
  classic: `
You are an expert resume writer. Create a classic, traditional resume format for the specific job posting. This template should be clean, professional, and ATS-friendly.

Style Guidelines:
- Traditional chronological format with clear section headings
- Professional black and white color scheme
- Standard fonts (Arial, Helvetica, or Times New Roman)
- Clean lines and minimal design elements
- Focus on readability and professionalism

{BASE_REQUIREMENTS}
`,
  modern: `
You are an expert resume writer. Create a modern, contemporary resume format for the specific job posting. This template should be visually appealing while remaining professional.

Style Guidelines:
- Modern layout with subtle color accents (navy blue, dark gray)
- Contemporary fonts and spacing
- Clean sections with subtle dividers
- Professional but fresh appearance
- Balance of style and readability

{BASE_REQUIREMENTS}
`,
  creative: `
You are an expert resume writer. Create a creative, design-forward resume format for the specific job posting. This template should stand out while maintaining professionalism.

Style Guidelines:
- Creative layout with strategic use of color and typography
- Unique section organization and visual hierarchy
- Eye-catching but professional design elements
- Suitable for creative fields while remaining readable
- Distinctive but not overwhelming

{BASE_REQUIREMENTS}
`,
  technical: `
You are an expert resume writer. Create a technical, skills-focused resume format for the specific job posting. This template should emphasize technical competencies and project achievements.

Style Guidelines:
- Technical focus with prominent skills section
- Project-based experience presentation
- Clean, logical structure for technical roles
- Emphasis on quantifiable achievements and technologies
- Optimized for technical recruiters and ATS systems

{BASE_REQUIREMENTS}
`,
  executive: `
You are an expert resume writer. Create an executive-level resume format for the specific job posting. This template should convey leadership experience and strategic achievements.

Style Guidelines:
- Executive summary with leadership focus
- Achievement-driven format with metrics and impact
- Professional, sophisticated appearance
- Emphasis on strategic accomplishments and team leadership
- Suitable for senior-level positions

{BASE_REQUIREMENTS}
`
};

const BASE_REQUIREMENTS = `
Requirements:
- Tailor the professional summary to highlight relevant experience for this specific role
- Emphasize skills and experiences that align with the job requirements
- Reorder or highlight relevant experience sections
- Keep all information truthful and accurate
- Maintain professional formatting
- Output clean HTML that can be converted to PDF
- IMPORTANT: Job description may be truncated due to API limitations. Use the job title and company name to infer typical role requirements
- Focus on transferable skills and highlight relevant experience even with limited job details
- Draw from knowledge of similar positions to create a well-tailored resume

Job Details:
Job Title: {JOB_TITLE}
Company: {COMPANY}
Job Description: {JOB_DESCRIPTION}

Original Resume Data:
Name: {NAME}
Current Title: {TITLE}
Email: {EMAIL}
Phone: {PHONE}
Experience: {EXPERIENCE}
Skills: {SKILLS}
Education: {EDUCATION}
Original Summary: {SUMMARY}

Return a well-formatted HTML resume that is tailored for this specific job. Use proper HTML structure with inline CSS for styling. Make it professional and ATS-friendly.
`;

const COVER_LETTER_TEMPLATES = {
  professional: `
You are an expert cover letter writer. Create a professional, straightforward cover letter that effectively communicates qualifications and interest.

Style Guidelines:
- Traditional business letter format
- Professional tone throughout
- Clear, direct communication
- Standard paragraph structure
- Focus on qualifications and fit

{COVER_LETTER_BASE}
`,
  enthusiastic: `
You are an expert cover letter writer. Create an enthusiastic, engaging cover letter that shows genuine excitement for the role and company.

Style Guidelines:
- Energetic and positive tone
- Show passion for the role and industry
- Include compelling stories and examples
- Demonstrate company research and interest
- Balance enthusiasm with professionalism

{COVER_LETTER_BASE}
`,
  storytelling: `
You are an expert cover letter writer. Create a narrative-driven cover letter that tells the candidate's professional story through compelling examples.

Style Guidelines:
- Use specific anecdotes and achievements
- Create a narrative flow connecting experiences
- Focus on impact and results
- Demonstrate problem-solving abilities
- Make it memorable and engaging

{COVER_LETTER_BASE}
`,
  concise: `
You are an expert cover letter writer. Create a concise, impactful cover letter that gets straight to the point while covering all key information.

Style Guidelines:
- Brief but comprehensive (200-250 words)
- Bullet points for key achievements
- Direct and to-the-point writing
- Easy to scan and read quickly
- Maximum impact with minimum words

{COVER_LETTER_BASE}
`,
  research_focused: `
You are an expert cover letter writer. Create a research-driven cover letter that demonstrates deep understanding of the company and role.

Style Guidelines:
- Show detailed company and industry knowledge
- Connect specific experiences to company needs
- Reference company values, mission, or recent news
- Demonstrate strategic thinking
- Show how candidate aligns with company culture

{COVER_LETTER_BASE}
`
};

const COVER_LETTER_BASE = `
Requirements:
- Write a compelling cover letter that's 250-400 words (unless specified otherwise)
- Highlight relevant experience and skills that match the job requirements
- Show enthusiasm for the role and company
- Include specific examples from the candidate's background
- Maintain appropriate tone for the template style
- Output clean HTML that can be converted to PDF
- IMPORTANT: Job description may be limited due to API constraints. Use the job title "{JOB_TITLE}" and company "{COMPANY}" to infer role expectations
- Emphasize transferable skills and relevant achievements that align with typical requirements for this position type
- Focus on demonstrating value and fit even with abbreviated job details

Job Details:
Job Title: {JOB_TITLE}
Company: {COMPANY}
Location: {LOCATION}
Job Description: {JOB_DESCRIPTION}

Candidate Information:
Name: {NAME}
Current Title: {TITLE}
Email: {EMAIL}
Phone: {PHONE}
Experience: {EXPERIENCE}
Skills: {SKILLS}
Education: {EDUCATION}
Professional Summary: {SUMMARY}

Return a well-formatted HTML cover letter that is tailored for this specific job. Use proper HTML structure with inline CSS for professional styling.
`;

export async function POST(request: NextRequest) {
  try {
    console.log('Document generation API route called');
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key is not configured. Please check your environment variables.' 
      }, { status: 500 });
    }

    const body = await request.json();
    const { resumeData, jobListing, documentTypes, resumeTemplate = 'modern', coverLetterTemplate = 'professional' } = body;

    if (!resumeData || !jobListing) {
      return NextResponse.json({ 
        error: 'Resume data and job listing are required' 
      }, { status: 400 });
    }

    const documents: GeneratedDocument[] = [];

    // Generate tailored resume if requested
    if (!documentTypes || documentTypes.includes('resume')) {
      const selectedTemplate = RESUME_TEMPLATES[resumeTemplate as keyof typeof RESUME_TEMPLATES] || RESUME_TEMPLATES.modern;
      const resumePrompt = selectedTemplate
        .replace('{BASE_REQUIREMENTS}', BASE_REQUIREMENTS)
        .replace('{JOB_TITLE}', jobListing.title)
        .replace('{COMPANY}', jobListing.company)
        .replace('{JOB_DESCRIPTION}', jobListing.description)
        .replace('{NAME}', resumeData.name)
        .replace('{TITLE}', resumeData.title)
        .replace('{EMAIL}', resumeData.email)
        .replace('{PHONE}', resumeData.phone || 'N/A')
        .replace('{EXPERIENCE}', resumeData.experience.join('\n'))
        .replace('{SKILLS}', resumeData.skills.join(', '))
        .replace('{EDUCATION}', resumeData.education.join('\n'))
        .replace('{SUMMARY}', resumeData.summary);

      const resumeCompletion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: resumePrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const resumeContent = resumeCompletion.choices[0].message.content;
      if (resumeContent) {
        documents.push({
          type: 'resume',
          content: resumeContent,
          htmlContent: resumeContent,
        });
      }
    }

    // Generate cover letter if requested
    if (!documentTypes || documentTypes.includes('cover_letter')) {
      const selectedCoverTemplate = COVER_LETTER_TEMPLATES[coverLetterTemplate as keyof typeof COVER_LETTER_TEMPLATES] || COVER_LETTER_TEMPLATES.professional;
      const coverLetterPrompt = selectedCoverTemplate
        .replace('{COVER_LETTER_BASE}', COVER_LETTER_BASE)
        .replace('{JOB_TITLE}', jobListing.title)
        .replace('{COMPANY}', jobListing.company)
        .replace('{LOCATION}', jobListing.location)
        .replace('{JOB_DESCRIPTION}', jobListing.description)
        .replace('{NAME}', resumeData.name)
        .replace('{TITLE}', resumeData.title)
        .replace('{EMAIL}', resumeData.email)
        .replace('{PHONE}', resumeData.phone || 'N/A')
        .replace('{EXPERIENCE}', resumeData.experience.join('\n'))
        .replace('{SKILLS}', resumeData.skills.join(', '))
        .replace('{EDUCATION}', resumeData.education.join('\n'))
        .replace('{SUMMARY}', resumeData.summary);

      const coverLetterCompletion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: coverLetterPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const coverLetterContent = coverLetterCompletion.choices[0].message.content;
      if (coverLetterContent) {
        documents.push({
          type: 'cover_letter',
          content: coverLetterContent,
          htmlContent: coverLetterContent,
        });
      }
    }

    return NextResponse.json({
      success: true,
      documents,
      jobTitle: jobListing.title,
      company: jobListing.company,
      candidateName: resumeData.name
    });

  } catch (error) {
    console.error('Document generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate documents. Please try again.' },
      { status: 500 }
    );
  }
} 