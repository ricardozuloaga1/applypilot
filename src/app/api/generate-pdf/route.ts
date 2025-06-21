import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    console.log('PDF generation API route called');

    const body = await request.json();
    const { htmlContent, filename } = body;

    if (!htmlContent) {
      return NextResponse.json({ 
        error: 'HTML content is required' 
      }, { status: 400 });
    }

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set the content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    await browser.close();

    // Return PDF as base64
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    return NextResponse.json({
      success: true,
      pdfBase64,
      filename: filename || 'document.pdf'
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF. Please try again.' },
      { status: 500 }
    );
  }
} 