import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { JobSuggestion } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const JOB_SUGGESTION_PROMPT = `
You are an expert career advisor and recruiter. Based on the provided resume information, suggest 5 relevant job titles that would be a good fit for this candidate.

Return your response as a JSON array with the following format:
[
  {
    "title": "Job Title",
    "confidence": 95,
    "reasoning": "Brief explanation of why this role fits"
  }
]

Guidelines:
- Suggest realistic job titles that match the candidate's experience level
- Include a mix of current-level positions and slight career advancement opportunities
- Consider both the candidate's stated title and their actual skills/experience
- Confidence should be 1-100 based on how well the role matches
- Keep reasoning concise (1-2 sentences)
- Focus on roles that are commonly available in the job market

Resume Information:
`;

export async function POST(request: NextRequest) {
  try {
    console.log('Job suggestions API called');
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key is not configured. Please check your environment variables.' 
      }, { status: 500 });
    }
    
    const body = await request.json();
    const { resumeData } = body;

    if (!resumeData) {
      return NextResponse.json({ 
        error: 'Resume data is required' 
      }, { status: 400 });
    }

    // Format resume data for the prompt
    const resumeContext = `
Name: ${resumeData.name || 'Not provided'}
Current Title: ${resumeData.title || 'Not provided'}
Summary: ${resumeData.summary || 'Not provided'}
Skills: ${resumeData.skills?.join(', ') || 'Not provided'}
Experience: ${resumeData.experience?.join('\n') || 'Not provided'}
Education: ${resumeData.education?.join('\n') || 'Not provided'}
    `.trim();

    console.log('Generating job suggestions for:', resumeData.name);

    // Get job suggestions from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: `${JOB_SUGGESTION_PROMPT}\n\n${resumeContext}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const responseContent = completion.choices[0].message.content;
    
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let suggestions: JobSuggestion[];
    try {
      suggestions = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseContent);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate the suggestions
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error('Invalid suggestions format from AI');
    }

    // Ensure all suggestions have required fields
    const validatedSuggestions: JobSuggestion[] = suggestions.map(suggestion => ({
      title: suggestion.title || 'Unknown Position',
      confidence: Math.min(100, Math.max(1, suggestion.confidence || 50)),
      reasoning: suggestion.reasoning || 'Good match based on background'
    }));

    console.log('Generated', validatedSuggestions.length, 'job suggestions');
    
    return NextResponse.json({ suggestions: validatedSuggestions });

  } catch (error) {
    console.error('Job suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to generate job suggestions. Please try again.' },
      { status: 500 }
    );
  }
} 