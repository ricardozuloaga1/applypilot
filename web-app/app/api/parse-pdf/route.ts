import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    // Convert file to buffer for pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamic import to avoid build issues
    const pdf = await import('pdf-parse');
    const pdfParser = pdf.default || pdf;
    
    // Parse PDF and extract text
    const pdfData = await pdfParser(buffer);
    
    // Clean up the extracted text
    const cleanText = pdfData.text
      .replace(/\s+/g, ' ')  // Replace multiple whitespaces with single space
      .replace(/\n\s*\n/g, '\n\n')  // Normalize line breaks
      .trim();

    if (!cleanText || cleanText.length < 10) {
      return NextResponse.json({ 
        error: 'No readable text found in PDF. The file might be image-based or corrupted.' 
      }, { status: 400 });
    }

    console.log(`Successfully parsed PDF: ${file.name} - ${cleanText.length} characters extracted`);

    return NextResponse.json({ 
      success: true, 
      text: cleanText,
      filename: file.name,
      size: file.size,
      pages: pdfData.numpages || 1,
      extractedLength: cleanText.length
    });
  } catch (error: any) {
    console.error('Error parsing PDF:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('Invalid PDF')) {
      return NextResponse.json({ 
        error: 'Invalid PDF file. Please ensure the file is not corrupted.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to parse PDF document. Please try uploading the document as a text file (.txt) instead.' 
    }, { status: 500 });
  }
} 