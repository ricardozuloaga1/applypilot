import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    
    // Security check - only allow specific prompt files
    const allowedPrompts = ['jd_extractor.txt', 'resume_matcher.txt'];
    if (!allowedPrompts.includes(filename)) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }
    
    const promptPath = join(process.cwd(), '..', 'prompts', filename);
    const promptContent = readFileSync(promptPath, 'utf-8');
    
    return new NextResponse(promptContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error loading prompt:', error);
    return NextResponse.json({ error: 'Failed to load prompt' }, { status: 500 });
  }
} 