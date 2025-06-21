import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ParsedResume } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validate API key
if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is not configured');
}

const RESUME_PARSING_PROMPT = `
You are an expert resume parser. Extract structured information from the provided resume text and return it as a JSON object with the following format:

{
  "name": "Full name of the person",
  "title": "Current job title or desired position",
  "email": "Email address",
  "phone": "Phone number (optional)",
  "experience": ["List of work experiences with company, role, and brief description"],
  "skills": ["List of technical and professional skills"],
  "education": ["List of educational qualifications"],
  "summary": "A brief professional summary (2-3 sentences)"
}

Instructions:
- Extract accurate information from the resume
- If information is missing, use empty string or empty array
- For experience, include company name, role, and key achievements
- For skills, extract both technical and soft skills
- For education, include degree, institution, and year if available
- Create a concise professional summary based on the resume content
- Return only valid JSON, no additional text or formatting

Resume text to parse:
`;

export async function POST(request: NextRequest) {
  try {
    console.log('API route called');
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key is not configured. Please check your environment variables.' 
      }, { status: 500 });
    }
    
    const contentType = request.headers.get('content-type');
    let resumeText = '';

    if (contentType?.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      console.log('File received:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Handle different file types
      if (file.type.includes('text')) {
        resumeText = await file.text();
      } else if (file.type === 'application/pdf') {
        // For now, suggest copy-pasting PDF content
        return NextResponse.json({ 
          error: 'PDF parsing is temporarily unavailable. Please copy the text from your PDF and paste it in the text area below instead.' 
        }, { status: 400 });
      } else {
        return NextResponse.json({ 
          error: 'Unsupported file type. Please upload a PDF or text file, or paste your resume text.' 
        }, { status: 400 });
      }
      
    } else if (contentType?.includes('application/json')) {
      // Handle pasted text
      const body = await request.json();
      resumeText = body.text;
    } else {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return NextResponse.json({ error: 'No resume text provided' }, { status: 400 });
    }

    // Parse resume using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `${RESUME_PARSING_PROMPT}\n\n${resumeText}`
        }
      ],
      temperature: 0.1,
      max_tokens: 1500,
    });

    const responseContent = completion.choices[0].message.content;
    
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let parsedResume: ParsedResume;
    try {
      parsedResume = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseContent);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate the parsed data
    const validatedResume: ParsedResume = {
      name: parsedResume.name || '',
      title: parsedResume.title || '',
      email: parsedResume.email || '',
      phone: parsedResume.phone || '',
      experience: Array.isArray(parsedResume.experience) ? parsedResume.experience : [],
      skills: Array.isArray(parsedResume.skills) ? parsedResume.skills : [],
      education: Array.isArray(parsedResume.education) ? parsedResume.education : [],
      summary: parsedResume.summary || '',
    };

    return NextResponse.json(validatedResume);

  } catch (error) {
    console.error('Resume parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse resume. Please try again.' },
      { status: 500 }
    );
  }
} 