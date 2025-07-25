import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { job, resume, amplificationMode = 'precision', apiKey, format = 'text', enhancements = [] } = await request.json();
    console.log('🔍 Document generation request received:', {
      jobTitle: job?.title,
      resumeLength: resume?.content?.length,
      amplificationMode,
      format,
      enhancementsCount: enhancements.length
    });

    if (!job || !resume || !resume.content) {
      return NextResponse.json({ error: 'Job and resume content are required.' }, { status: 400 });
    }
    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key not provided.' }, { status: 400 });
    }

    // 1. Extract structured resume data
    console.log('🔍 Calling resume extraction...');
    const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : (process.env.NEXT_PUBLIC_BASE_URL || '');
    const extractResponse = await fetch(`${baseUrl}/api/resume-extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, apiKey: openaiApiKey })
    });
    
    console.log('🔍 Resume extraction response status:', extractResponse.status);
    
    if (!extractResponse.ok) {
      const errorText = await extractResponse.text();
      console.error('❌ Resume extraction failed with status:', extractResponse.status);
      console.error('❌ Error response:', errorText.substring(0, 200));
      return NextResponse.json({ 
        error: `Resume extraction failed: ${extractResponse.status}. ${errorText.includes('<!DOCTYPE') ? 'API endpoint not found' : errorText}` 
      }, { status: 500 });
    }
    
    const extractResult = await extractResponse.json();
    console.log('🔍 Resume extraction result:', {
      success: extractResponse.ok,
      hasData: !!extractResult.data,
      error: extractResult.error
    });

    if (!extractResponse.ok || !extractResult.data) {
      console.error('❌ Resume extraction failed:', extractResult.error);
      return NextResponse.json({ error: extractResult.error || 'Resume extraction failed.' }, { status: 500 });
    }
    const extractedData = extractResult.data;

    // 2. Build strict template-based prompt (mirroring extension)
    console.log('🔍 Building prompt with extracted data...');
    const systemPrompt = getAmplificationModePrompt(amplificationMode);
    const userPrompt = buildStrictUserPrompt(job, extractedData, format, enhancements);

    // 3. Generate the document
    console.log('🔍 Calling OpenAI for document generation...');
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
        max_tokens: 1500,
        temperature: 0.7
      })
    });
    
    console.log('🔍 Document generation response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Document generation failed:', error);
      return NextResponse.json({ error: error.error?.message || 'Document generation failed.' }, { status: response.status });
    }
    const result = await response.json();
    
    console.log('✅ Document generation successful');
    
    // Determine MIME type and extension
    const { mimeType, extension } = getDocumentMimeTypeAndExtension(format);
    return NextResponse.json({ content: result.choices[0].message.content, format, mimeType, extension });
  } catch (error) {
    console.error('❌ Document generation error:', error);
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error instanceof Error ? error.stack : String(error)
    }, { status: 500 });
  }
}

function getAmplificationModePrompt(mode: string) {
  const basePrompt = `You are an expert resume writer. Create a tailored, professional resume that highlights the candidate's most relevant qualifications for the specific role.\n\nINFERENCE POLICY:\n- You may infer requirements or qualifications from the resume if they are reasonably and clearly implied by the content (e.g., a degree implies graduation, a job title implies certain responsibilities).\n- Do NOT make sweeping or speculative inferences. Only include what can be reasonably and clearly deduced from the provided information.\n- If in doubt, err on the side of caution and do not include information that is not explicit or clearly implied.`;
  switch (mode) {
    case 'precision':
      return `${basePrompt}
      
PRECISION MODE - Conservative and accurate:
- Only include information explicitly stated in the original resume or that can be reasonably and clearly inferred
- Reorganize and reword existing content for maximum relevance
- Use professional, factual language
- Focus on direct skill matches and relevant experience
- Maintain complete accuracy and verifiability`;
    case 'gap_filler':
      return `${basePrompt}
      
GAP FILLER MODE - Strategic positioning:
- Emphasize transferable skills that address job requirements
- Reorganize experience to highlight relevant aspects
- Use industry-appropriate terminology
- Show progression and growth potential
- Frame existing experience to address apparent gaps`;
    case 'beast_mode':
      return `${basePrompt}
      
BEAST MODE - Maximum impact:
- Present the candidate as exceptionally qualified
- Emphasize achievements and quantifiable results
- Use powerful, confident language
- Highlight unique value proposition
- Show leadership potential and expertise
- Make the candidate appear ideal for the role`;
    default:
      return basePrompt;
  }
}

function buildUserPrompt(job: any, resume: any, format: string, enhancements: any[] = []) {
  const enhancementInstructions = enhancements.length > 0 ?
    `

SPECIAL ENHANCEMENT INSTRUCTIONS:
${enhancements.map(e => `- [${e.category}] ${e.requirement} (Familiarity: ${e.familiarity || 'Not specified'}, Experience: ${e.experience || 'Not specified'})`).join('\n')}

These enhancements should be woven naturally into the resume content to address identified gaps. Focus on high-priority enhancements first.` : '';
  return `Create a tailored resume for this job application:\n\nJOB DETAILS:\n- Position: ${job.title}\n- Company: ${job.company}\n- Location: ${job.location}\n- Job Description: ${job.description}\n\nORIGINAL RESUME:\n${resume.content}${enhancementInstructions}\n\nREQUIREMENTS:\n- Format: ${format.toLowerCase() === 'pdf' ? 'Professional format suitable for PDF' : format.toLowerCase() === 'docx' ? 'Professional format suitable for Word document' : 'Plain text format'}\n- Tailor the resume to emphasize relevant skills and experience\n- Reorganize sections to highlight job-relevant qualifications`;
}

function buildStrictUserPrompt(job: any, extractedData: any, format: string, enhancements: any[] = []) {
  const enhancementInstructions = enhancements.length > 0 ?
    `

SPECIAL ENHANCEMENT INSTRUCTIONS:\n${enhancements.map(e => `- [${e.category}] ${e.requirement} (Familiarity: ${e.familiarity || 'Not specified'}, Experience: ${e.experience || 'Not specified'})`).join('\n')}\n\nThese enhancements should be woven naturally into the resume content to address identified gaps. Focus on high-priority enhancements first.` : '';
  // Strict template mirroring the extension
  return `Create a tailored resume using this data and job requirements:\n\nEXTRACTED RESUME DATA:\n${JSON.stringify(extractedData, null, 2)}\n\nJOB REQUIREMENTS:\nTitle: ${job.title}\nCompany: ${job.company}\nDescription: ${job.description}${enhancementInstructions}\n\nTEMPLATE FORMAT TO FOLLOW:\n# [Name]\n[Location] | [Citizenship if applicable]\nPhone: [Phone] | Email: [Email]\n\n## Professional Summary\n[2-3 sentences highlighting most relevant experience for this job]\n\n## Core Skills\n- [Most relevant skill 1]\n- [Most relevant skill 2]\n- [Most relevant skill 3]\n- [Additional relevant skills]\n\n## Professional Experience\n**[Job Title]**\n[Company Name], [Location] | [Start Date] – [End Date]\n- [Tailored responsibility emphasizing job-relevant skills]\n- [Achievement with quantifiable results if available]\n- [Additional relevant responsibility]\n\n## Education\n**[Degree Name]**\n[Institution Name], [Location] | [Year]\n\n## Licenses & Admissions\n- [License/Certification 1]\n- [License/Certification 2]\n\n## Tools & Platforms\n- [Relevant tools and technologies]\n\nSECTION CONFIGURATION:\n- Professional Summary: INCLUDE\n- Core Skills: INCLUDE\n- Professional Experience: INCLUDE\n- Education: INCLUDE\n- Licenses & Admissions: INCLUDE\n- Tools & Platforms: INCLUDE\n\nCRITICAL FORMATTING RULES:\n1. Start with exactly: # [Full Name] (with # and space)\n2. Use exactly: ## [Section Name] (with ## and space) for ALL section headers\n3. For job titles use exactly: **[Job Title]** (with ** on both sides)\n4. For company info use exactly: [Company Name], [Location] | [Start Date] – [End Date]\n5. Use exactly: - [bullet point] (with - and space) for all bullet points\n6. Use exactly: **[Degree Name]** (with ** on both sides) for education\n7. Separate each section with exactly one blank line\n8. Do NOT use any other formatting like bold company names or italic text\n\nCRITICAL INSTRUCTION: Use the actual data from EXTRACTED RESUME DATA to fill in all placeholders in the template. Do NOT leave any [brackets] or placeholders unfilled. Replace [Name] with the actual name from personalInfo.name, [Company Name] with actual company names from experience, [Job Title] with actual job titles, etc. Use ONLY the real information from the extracted data.\n\nINSTRUCTIONS:\n1. Follow the exact formatting rules above\n2. Prioritize information most relevant to the job\n3. Rewrite responsibilities to include job keywords naturally\n4. Emphasize achievements that match job requirements\n5. Order experience by relevance to target role\n6. Only include sections marked as INCLUDE above\n7. Return ONLY the formatted resume content, no explanations\n8. NEVER use placeholder text like [Company Name] or [Start Date] - use actual data from EXTRACTED RESUME DATA`;
}

function getDocumentMimeTypeAndExtension(format: string) {
  switch (format.toLowerCase()) {
    case 'pdf':
      return { mimeType: 'application/pdf', extension: 'pdf' };
    case 'docx':
      return { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extension: 'docx' };
    case 'text':
    default:
      return { mimeType: 'text/plain', extension: 'txt' };
  }
} 