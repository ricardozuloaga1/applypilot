import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { job, resume, apiKey } = await request.json();
    if (!job || !resume || !resume.content) {
      return NextResponse.json({ error: 'Job and resume content are required.' }, { status: 400 });
    }
    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key not provided.' }, { status: 400 });
    }
    // Compose the system and user prompts (mirroring extension logic)
    const systemPrompt = `You are a strict ATS system that provides brutally honest job-resume matching scores. Be very discriminating and use the full 0-100 scale.\n\nCRITICAL RULE: You MUST ONLY cite information that is found in the resume text. Do not infer, interpret, or assume information beyond what is written. However, you must be thorough in analyzing the resume content before marking something as missing. If something is not mentioned in the resume, state \"Not mentioned in resume\" in the evidence field.\n\nSCORING CRITERIA:\n- 90-100: Perfect match - candidate exceeds ALL requirements\n- 80-89: Excellent match - meets ALL requirements with some extras\n- 70-79: Good match - meets MOST requirements with minor gaps\n- 60-69: Moderate match - meets SOME requirements with notable gaps\n- 50-59: Weak match - few requirements met, significant gaps\n- 0-49: Poor match - fundamental misalignment, major gaps`;
    const salaryLine = job.salary ? `Salary: ${job.salary}\n` : '';
    const userPrompt = `JOB POSTING:\nTitle: ${job.title}\nCompany: ${job.company}\nDescription: ${job.description}\nLocation: ${job.location}\n${salaryLine}\nRESUME:\n${resume.content}\n\nANALYSIS INSTRUCTIONS:\n1. Count specific technical skills mentioned in job vs resume\n2. Evaluate years of experience required vs actual\n3. Check education and certification requirements\n4. Look for industry/domain experience alignment\n5. Assess seniority level and leadership scope\n6. Verify location or work-authorization fit\n7. Identify language proficiency requirements\n8. Note soft-skill keywords or cultural values the job stresses\n\nCATEGORIES TO EVALUATE (use exactly these names in matrix[].category):\n1. Technical Skills\n2. Experience\n3. Education\n4. Certifications & Licenses\n5. Industry / Domain Experience\n6. Seniority Level / Leadership\n7. Soft Skills & Competencies\n8. Location / Work Authorization\n9. Language Proficiency\n10. Culture / Value Alignment\n\nFor every category above, create ONE matrix entry. If the job posting does not mention that category set \"requirement\": \"Not specified in job posting\" and \"matchLevel\": \"N/A\".\n\nEVIDENCE REQUIREMENTS:\n- Carefully analyze the resume text to find relevant information\n- Use direct quotes or accurate paraphrases from the resume text\n- Do NOT infer skills, experience, or qualifications not explicitly stated\n- If information is missing, write \"Not mentioned in resume\"\n- If years of experience aren't specified, write \"Experience duration not specified\"\n- Look for related information that may satisfy requirements (e.g., bar admissions, degrees, software tools)\n- Be thorough in your analysis before marking something as \"Not mentioned\"\n\nBe harsh but fair. Don't give sympathy scores. If there are major gaps, reflect this in a low score. Most candidates should score below 70 unless they're truly exceptional matches. Use the full range from 0-100.\n\nCRITICAL: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON. Do not use markdown formatting like \`\`\`json. Just return the raw JSON object.\n\nFormat response as JSON with matrix structure:\n{\n  \"overallScore\": 45,\n  \"strengths\": [\"Specific matching skills/experience found\"],\n  \"gaps\": [\"Specific missing requirements\"],\n  \"recommendations\": [\"Concrete actionable advice\"],\n  \"reasoning\": \"Detailed explanation of score calculation\",\n  \"matrix\": [\n    { \"category\": \"Technical Skills\", \"requirement\": \"Python, 5+ yrs\", \"evidence\": \"Resume mentions Python but duration not specified\", \"matchLevel\": \"partial\", \"gapAction\": \"Add total years of Python experience\" },\n    { \"category\": \"Experience\", \"requirement\": \"Senior developer role\", \"evidence\": \"Not mentioned in resume\", \"matchLevel\": \"missing\", \"gapAction\": \"Highlight any leadership or senior duties\" }\n  ]\n}`;
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
        max_tokens: 2000,
        temperature: 0.3
      })
    });
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.error?.message || 'Job match failed.' }, { status: response.status });
    }
    const result = await response.json();
    let cleanContent = result.choices[0].message.content.trim();
    // Remove markdown code block if present
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    // Fallback: extract the first JSON object in the string
    const firstCurly = cleanContent.indexOf('{');
    const lastCurly = cleanContent.lastIndexOf('}');
    if (firstCurly !== -1 && lastCurly !== -1) {
      cleanContent = cleanContent.substring(firstCurly, lastCurly + 1);
    }
    try {
      const matchData = JSON.parse(cleanContent);
      return NextResponse.json({ matrix: matchData.matrix || [], full: matchData });
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse job match JSON' }, { status: 500 });
    }
  } catch (error) {
    console.error('Job match error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 