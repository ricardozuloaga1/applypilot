import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { resume, jobs, apiKey } = await request.json();
    if (!resume || !resume.content || !jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json({ error: 'Resume content and at least one job are required.' }, { status: 400 });
    }
    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key not provided.' }, { status: 400 });
    }
    const systemPrompt = `You are a resume enhancement expert. Analyze the user's resume against job requirements and suggest categorized, actionable enhancements that would make their application more competitive.\n\nCRITICAL RULES:\n- Focus on what's missing or could be strengthened\n- Organize suggestions into logical categories\n- Suggest specific skills, metrics, or experiences to highlight\n- Make suggestions realistic and achievable\n- Provide 2-3 suggestions per category\n- Return suggestions organized by category`;
    const jobDescriptions = jobs.map(job => `JOB: ${job.title || 'Unknown Title'} at ${job.company || 'Unknown Company'}\nDESCRIPTION: ${job.description || 'No description available'}\n`).join('\n---\n');
    const truncatedResume = resume.content.length > 3000 ? resume.content.substring(0, 3000) : resume.content;
    const truncatedJobs = jobDescriptions.length > 2000 ? jobDescriptions.substring(0, 2000) : jobDescriptions;
    const userPrompt = `Analyze this resume against the job requirements and suggest categorized enhancements:\n\nRESUME:\n${truncatedResume}\n\nJOB REQUIREMENTS:\n${truncatedJobs}\n\nReturn enhancement suggestions organized by category in this JSON format: { ... }`;
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
        max_tokens: 1000,
        temperature: 0.3
      })
    });
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.error?.message || 'Enhancement suggestion failed.' }, { status: response.status });
    }
    const result = await response.json();
    let cleanContent = result.choices[0].message.content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    try {
      const enhancements = JSON.parse(cleanContent);
      return NextResponse.json({ enhancements });
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse enhancement suggestions JSON' }, { status: 500 });
    }
  } catch (error) {
    console.error('Enhancement suggestion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 