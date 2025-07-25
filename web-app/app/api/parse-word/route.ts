import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File must be a Word document (.doc or .docx)' }, { status: 400 });
    }

    // Convert file to buffer for mammoth
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from Word document
    const result = await mammoth.extractRawText({ buffer });
    
    // Clean up the extracted text
    const cleanText = result.value
      .replace(/\s+/g, ' ')  // Replace multiple whitespaces with single space
      .replace(/\n\s*\n/g, '\n\n')  // Normalize line breaks
      .trim();

    if (!cleanText || cleanText.length < 10) {
      return NextResponse.json({ 
        error: 'No readable text found in Word document. The file might be empty or corrupted.' 
      }, { status: 400 });
    }

    // Log any warnings from mammoth
    if (result.messages && result.messages.length > 0) {
      console.log('Word parsing warnings:', result.messages);
    }

    console.log(`Successfully parsed Word document: ${file.name} - ${cleanText.length} characters extracted`);

    return NextResponse.json({ 
      success: true, 
      text: cleanText,
      filename: file.name,
      size: file.size,
      extractedLength: cleanText.length,
      warnings: result.messages || []
    });
  } catch (error: any) {
    console.error('Error parsing Word document:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('ENOENT') || error.message?.includes('not found')) {
      return NextResponse.json({ 
        error: 'Word document format not supported or file corrupted.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to parse Word document. Please try uploading the document as a text file (.txt) instead.' 
    }, { status: 500 });
  }
} 