import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

interface AnalysisData {
    title?: string;
    summary?: string;
    keyPoints?: string[];
    detailedAnalysis?: string;
    recommendations?: string[];
    [key: string]: string | string[] | number | boolean | undefined | Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * Generates a timestamp-based filename
 * @param extension File extension (without the dot)
 * @returns Formatted filename with timestamp
 */
export const generateFilename = (extension: string, prefix = 'analysis-results'): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    return `${prefix}-${timestamp}.${extension}`;
};

/**
 * Exports analysis data as a PDF file
 * @param data Analysis data to export
 */
export const exportToPdf = (data: AnalysisData): void => {
    // Initialize PDF document - A4 size
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Set font and color
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 33, 33);

    // Define margins and positions
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const textWidth = pageWidth - (margin * 2);
    let yPosition = margin;

    // Add title
    if (data.title) {
        doc.setFontSize(20);
        doc.text(data.title, margin, yPosition);
        yPosition += 12;
    }

    // Add timestamp
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 15;

    // Add summary
    if (data.summary) {
        doc.setFontSize(12);
        doc.setTextColor(33, 33, 33);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', margin, yPosition);
        yPosition += 7;

        doc.setFont('helvetica', 'normal');
        const summaryLines = doc.splitTextToSize(data.summary, textWidth);
        doc.text(summaryLines, margin, yPosition);
        yPosition += (summaryLines.length * 5) + 10;
    }

    // Add key points
    if (data.keyPoints && data.keyPoints.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Key Points', margin, yPosition);
        yPosition += 7;

        doc.setFont('helvetica', 'normal');
        data.keyPoints.forEach((point) => {
            const bulletPoint = `• ${point}`;
            const pointLines = doc.splitTextToSize(bulletPoint, textWidth);

            // Check if we need a new page
            if (yPosition + (pointLines.length * 5) > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                yPosition = margin;
            }

            doc.text(pointLines, margin, yPosition);
            yPosition += (pointLines.length * 5) + 5;
        });

        yPosition += 5;
    }

    // Add detailed analysis
    if (data.detailedAnalysis) {
        // Check if we need a new page
        if (yPosition > doc.internal.pageSize.getHeight() - margin * 2) {
            doc.addPage();
            yPosition = margin;
        }

        doc.setFont('helvetica', 'bold');
        doc.text('Detailed Analysis', margin, yPosition);
        yPosition += 7;

        doc.setFont('helvetica', 'normal');
        const analysisLines = doc.splitTextToSize(data.detailedAnalysis, textWidth);

        // Split text into chunks that fit on pages
        const linesPerPage = Math.floor((doc.internal.pageSize.getHeight() - margin * 2) / 5);

        for (let i = 0; i < analysisLines.length; i += linesPerPage) {
            const chunk = analysisLines.slice(i, i + linesPerPage);

            if (i > 0) {
                doc.addPage();
                yPosition = margin;
            }

            doc.text(chunk, margin, yPosition);
            yPosition += chunk.length * 5;
        }

        yPosition += 10;
    }

    // Add recommendations
    if (data.recommendations && data.recommendations.length > 0) {
        // Check if we need a new page
        if (yPosition > doc.internal.pageSize.getHeight() - margin * 2) {
            doc.addPage();
            yPosition = margin;
        }

        doc.setFont('helvetica', 'bold');
        doc.text('Recommendations', margin, yPosition);
        yPosition += 7;

        doc.setFont('helvetica', 'normal');
        data.recommendations.forEach((recommendation, i) => {
            const numberedRec = `${i + 1}. ${recommendation}`;
            const recLines = doc.splitTextToSize(numberedRec, textWidth);

            // Check if we need a new page
            if (yPosition + (recLines.length * 5) > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                yPosition = margin;
            }

            doc.text(recLines, margin, yPosition);
            yPosition += (recLines.length * 5) + 5;
        });
    }

    // Save the PDF
    doc.save(generateFilename('pdf'));
};

/**
 * Exports analysis data as a Markdown file
 * @param data Analysis data to export
 */
export const exportToMarkdown = (data: AnalysisData): void => {
    let markdown = '';

    // Add title
    if (data.title) {
        markdown += `# ${data.title}\n\n`;
    }

    // Add timestamp
    markdown += `*Generated on: ${new Date().toLocaleString()}*\n\n`;

    // Add summary
    if (data.summary) {
        markdown += `## Summary\n\n${data.summary}\n\n`;
    }

    // Add key points
    if (data.keyPoints && data.keyPoints.length > 0) {
        markdown += `## Key Points\n\n`;
        data.keyPoints.forEach(point => {
            markdown += `- ${point}\n`;
        });
        markdown += '\n';
    }

    // Add detailed analysis
    if (data.detailedAnalysis) {
        markdown += `## Detailed Analysis\n\n${data.detailedAnalysis}\n\n`;
    }

    // Add recommendations
    if (data.recommendations && data.recommendations.length > 0) {
        markdown += `## Recommendations\n\n`;
        data.recommendations.forEach((recommendation, i) => {
            markdown += `${i + 1}. ${recommendation}\n`;
        });
        markdown += '\n';
    }

    // Create and download file
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, generateFilename('md'));
};

/**
 * Exports analysis data as a DOCX file
 * @param data Analysis data to export
 */
export const exportToDocx = async (data: AnalysisData): Promise<void> => {
    // Create new document
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                // Title
                new Paragraph({
                    text: data.title,
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                }),

                // Timestamp
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Generated on: ${new Date().toLocaleString()}`,
                            italics: true,
                            size: 20,
                        }),
                    ],
                    spacing: {
                        after: 400,
                    },
                }),

                // Summary
                ...(data.summary ? [
                    new Paragraph({
                        text: 'Summary',
                        heading: HeadingLevel.HEADING_2,
                    }),
                    new Paragraph({
                        text: data.summary,
                        spacing: {
                            after: 200,
                        },
                    }),
                ] : []),

                // Key Points
                ...(data.keyPoints && data.keyPoints.length > 0 ? [
                    new Paragraph({
                        text: 'Key Points',
                        heading: HeadingLevel.HEADING_2,
                    }),
                    ...data.keyPoints.map(point => new Paragraph({
                        text: `• ${point}`,
                        spacing: {
                            after: 120,
                        },
                    })),
                ] : []),

                // Detailed Analysis
                ...(data.detailedAnalysis ? [
                    new Paragraph({
                        text: 'Detailed Analysis',
                        heading: HeadingLevel.HEADING_2,
                    }),
                    new Paragraph({
                        text: data.detailedAnalysis,
                        spacing: {
                            after: 200,
                        },
                    }),
                ] : []),

                // Recommendations
                ...(data.recommendations && data.recommendations.length > 0 ? [
                    new Paragraph({
                        text: 'Recommendations',
                        heading: HeadingLevel.HEADING_2,
                    }),
                    ...data.recommendations.map((recommendation, i) => new Paragraph({
                        text: `${i + 1}. ${recommendation}`,
                        spacing: {
                            after: 120,
                        },
                    })),
                ] : []),
            ],
        }],
    });

    // Generate and save document
    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    saveAs(blob, generateFilename('docx'));
};

/**
 * Exports analysis data as a plain text file
 * @param data Analysis data to export
 */
export const exportToTxt = (data: AnalysisData): void => {
    let text = '';

    // Add title
    if (data.title) {
        text += `${data.title.toUpperCase()}\n\n`;
    } else {
        text += `ANALYSIS RESULTS\n\n`;
    }

    // Add timestamp
    text += `Generated on: ${new Date().toLocaleString()}\n\n`;

    // Add summary
    if (data.summary) {
        text += `SUMMARY\n${'='.repeat(7)}\n\n${data.summary}\n\n`;
    }

    // Add key points
    if (data.keyPoints && data.keyPoints.length > 0) {
        text += `KEY POINTS\n${'='.repeat(10)}\n\n`;
        data.keyPoints.forEach(point => {
            text += `* ${point}\n`;
        });
        text += '\n';
    }

    // Add detailed analysis
    if (data.detailedAnalysis) {
        text += `DETAILED ANALYSIS\n${'='.repeat(17)}\n\n${data.detailedAnalysis}\n\n`;
    }

    // Add recommendations
    if (data.recommendations && data.recommendations.length > 0) {
        text += `RECOMMENDATIONS\n${'='.repeat(15)}\n\n`;
        data.recommendations.forEach((recommendation, i) => {
            text += `${i + 1}. ${recommendation}\n`;
        });
        text += '\n';
    }

    // Create and download file
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, generateFilename('txt'));
};

/**
 * Extracts content from HTML and converts it to plain text or analysis data object
 * @param htmlContent HTML content to extract text from
 * @returns Analysis data object with extracted text
 */
export const extractContentFromHtml = (htmlContent: string): AnalysisData => {
    // For simple HTML, we can create a temporary element and get the text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Extract title (assuming it's in an h1 or similar element)
    const titleEl = tempDiv.querySelector('h1, h2, .title');
    const title = titleEl ? titleEl.textContent : '';

    // Extract summary (assuming it's in a section with id or class "summary")
    const summaryEl = tempDiv.querySelector('#summary, .summary');
    const summary = summaryEl ? summaryEl.textContent : '';

    // Extract key points (assuming they are in a list)
    const keyPointsElements = tempDiv.querySelectorAll('.key-points li, #key-points li, ul li');
    const keyPoints = Array.from(keyPointsElements).map(el => el.textContent || '');

    // Extract detailed analysis
    const detailedEl = tempDiv.querySelector('#detailed-analysis, .detailed-analysis');
    const detailedAnalysis = detailedEl ? detailedEl.textContent : '';

    // Extract recommendations
    const recElements = tempDiv.querySelectorAll('.recommendations li, #recommendations li, ol li');
    const recommendations = Array.from(recElements).map(el => el.textContent || '');

    return {
        title: title?.trim() || '',
        summary: summary?.trim() || '',
        keyPoints: keyPoints.map(p => p.trim()).filter(Boolean),
        detailedAnalysis: detailedAnalysis?.trim() || '',
        recommendations: recommendations.map(r => r.trim()).filter(Boolean),
    };
};

/**
 * Main export function that delegates to specific format export functions
 * @param format Format to export to (pdf, markdown, docx, txt)
 * @param data Analysis data to export
 */
export const exportAnalysis = async (format: string, data: AnalysisData): Promise<void> => {
    switch (format.toLowerCase()) {
        case 'pdf':
            exportToPdf(data);
            break;
        case 'markdown':
        case 'md':
            exportToMarkdown(data);
            break;
        case 'docx':
        case 'word':
            await exportToDocx(data);
            break;
        case 'txt':
        case 'text':
            exportToTxt(data);
            break;
        default:
            console.error(`Unsupported export format: ${format}`);
    }
};