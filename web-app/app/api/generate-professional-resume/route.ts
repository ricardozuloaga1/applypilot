import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { ProfessionalResumeTemplates } from '../../../components/ProfessionalResumeTemplates';
import { renderToBuffer } from '@react-pdf/renderer';

export async function POST(request: NextRequest) {
  try {
    const { resumeData, templateId } = await request.json();
    
    // Validate required data
    if (!resumeData || !templateId) {
      return NextResponse.json(
        { error: 'Missing resumeData or templateId' },
        { status: 400 }
      );
    }

    // Generate resume with selected template
    const templateSystem = new ProfessionalResumeTemplates();
    const { template: TemplateComponent, data, templateInfo } = await templateSystem.generateResumeWithTemplate(
      templateId,
      resumeData
    );

    // Render PDF to buffer
    const pdfBuffer = await renderToBuffer(React.createElement(TemplateComponent, { data }));
    
    // Return PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${data.personalInfo.name.replace(/\s+/g, '_')}_Resume_${templateInfo.name.replace(/\s+/g, '_')}.pdf"`,
        'Cache-Control': 'no-cache'
      },
    });

  } catch (error) {
    console.error('Error generating professional resume:', error);
    return NextResponse.json(
      { error: 'Failed to generate resume PDF' },
      { status: 500 }
    );
  }
} 