import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { resume, apiKey } = await request.json();
    console.log('🔍 Resume extraction request received:', {
      hasResume: !!resume,
      resumeLength: resume?.content?.length,
      hasApiKey: !!apiKey
    });

    // Log the actual content received by the API
    if (resume?.content) {
      console.log('📄 API RECEIVED CONTENT:', {
        contentLength: resume.content.length,
        contentStart: resume.content.substring(0, 200),
        contentEnd: resume.content.substring(resume.content.length - 200)
      });
    }

    if (!resume || !resume.content) {
      return NextResponse.json({ error: 'Resume content is required.' }, { status: 400 });
    }
    // Use provided API key or fallback to environment variable
    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key not provided.' }, { status: 400 });
    }
    
    const systemPrompt = `You are a resume data extraction expert. Extract structured information from resumes and return it in a standardized JSON format.\n\nCRITICAL RULES:\n- Extract ONLY information that exists in the resume\n- Do NOT invent or assume any information\n- Preserve exact dates, company names, and job titles\n- Extract skills exactly as written\n- Maintain all factual accuracy`;
    const userPrompt = `Extract structured data from this resume and return it in the following JSON format:\n\nRESUME TEXT:\n${resume.content}\n\nREQUIRED JSON STRUCTURE:\n{\n  "personalInfo": {\n    "name": "Full Name",\n    "location": "City, State",\n    "phone": "Phone Number",\n    "email": "Email Address",\n    "citizenship": "Citizenship status if mentioned"\n  },\n  "professionalSummary": "2-3 sentence summary of experience",\n  "coreSkills": [\n    "Skill 1",\n    "Skill 2",\n    "Skill 3"\n  ],\n  "experience": [\n    {\n      "title": "Job Title",\n      "company": "Company Name",\n      "location": "City, State",\n      "startDate": "Start Date",\n      "endDate": "End Date or Present",\n      "responsibilities": [\n        "Responsibility 1",\n        "Responsibility 2"\n      ]\n    }\n  ],\n  "education": [\n    {\n      "degree": "Degree Name",\n      "institution": "School Name",\n      "location": "City, State",\n      "year": "Graduation Year or Date Range"\n    }\n  ],\n  "licenses": [\n    "License or certification"\n  ],\n  "additionalSections": {\n    "tools": ["Tool 1", "Tool 2"],\n    "languages": ["Language 1", "Language 2"],\n    "projects": [],\n    "certifications": []\n  }\n}\n\nReturn ONLY the JSON object with extracted data.`;
    
    console.log('🔍 Calling OpenAI for resume extraction...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.1
      })
    });
    
    console.log('🔍 OpenAI response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ OpenAI API error:', error);
      return NextResponse.json({ error: error.error?.message || 'Resume extraction failed.' }, { status: response.status });
    }
    
    const result = await response.json();
    console.log('🔍 OpenAI response received, content length:', result.choices[0].message.content.length);
    console.log('🔍 Raw OpenAI content (first 200 chars):', result.choices[0].message.content.substring(0, 200));
    
    let cleanContent = result.choices[0].message.content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    
    console.log('🔍 Cleaned content (first 200 chars):', cleanContent.substring(0, 200));
    
    try {
      const extractedData = JSON.parse(cleanContent);
      console.log('✅ JSON parsing successful, extracted data keys:', Object.keys(extractedData));
      return NextResponse.json({ data: extractedData });
    } catch (e) {
      console.error('❌ JSON parsing failed:', e);
      console.error('❌ Content that failed to parse:', cleanContent);
      return NextResponse.json({ error: 'Failed to parse extracted resume data JSON' }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Resume extraction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 