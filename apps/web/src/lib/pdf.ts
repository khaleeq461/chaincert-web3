import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export interface CertificatePdfData {
  certificateId: string;
  recipientName: string;
  recipientWallet: string;
  certificateTitle: string;
  course: string;
  institutionName: string;
  issuerAddress: string;
  issueDate: string;
  expiryDate?: string;
  grade?: string;
  description?: string;
  verificationUrl: string;
  certificateHash: string;
}

export async function generateCertificatePdf(data: CertificatePdfData): Promise<{ doc: jsPDF; blob: Blob; buffer: Uint8Array }> {
  // A4 Landscape: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = 297;
  const height = 210;

  // 1. Background tint
  doc.setFillColor(252, 252, 254);
  doc.rect(0, 0, width, height, 'F');

  // 2. Outer decorative border (Institutional Navy / Slate)
  doc.setDrawColor(15, 23, 42); // #0f172a
  doc.setLineWidth(1.5);
  doc.rect(10, 10, width - 20, height - 20);

  // 3. Inner decorative border (Accent Gold / Brand)
  doc.setDrawColor(197, 160, 89); // Institutional Gold #c5a059
  doc.setLineWidth(0.6);
  doc.rect(13, 13, width - 26, height - 26);

  // 4. Header Badge / Top Platform Branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('CHAINCERT — VERIFIED ON-CHAIN CREDENTIAL', width / 2, 25, { align: 'center' });

  // 5. Issuing Institution
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // Navy 900
  doc.text(data.institutionName.toUpperCase(), width / 2, 38, { align: 'center' });

  // Divider under institution
  doc.setDrawColor(197, 160, 89);
  doc.setLineWidth(0.4);
  doc.line(width / 2 - 45, 42, width / 2 + 45, 42);

  // 6. "Certificate of Achievement"
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text('This is to certify that', width / 2, 53, { align: 'center' });

  // 7. Recipient Name
  doc.setFont('times', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(15, 23, 42);
  doc.text(data.recipientName, width / 2, 67, { align: 'center' });

  // Underline for recipient
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(width / 2 - 60, 70, width / 2 + 60, 70);

  // Recipient Wallet (Subtle)
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Wallet: ${data.recipientWallet}`, width / 2, 75, { align: 'center' });

  // 8. "has successfully completed the program"
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text('has fulfilled all requirements and demonstrated mastery in', width / 2, 85, { align: 'center' });

  // 9. Certificate Title & Program
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(data.certificateTitle, width / 2, 95, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(51, 65, 85);
  doc.text(`Program: ${data.course}`, width / 2, 103, { align: 'center' });

  if (data.grade) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(197, 160, 89);
    doc.text(`Honors / Distinction: ${data.grade}`, width / 2, 111, { align: 'center' });
  }

  // 10. Description / Competencies (if present)
  if (data.description) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    const splitDesc = doc.splitTextToSize(data.description, 180);
    doc.text(splitDesc, width / 2, data.grade ? 120 : 115, { align: 'center' });
  }

  // 11. Generate QR Code Image
  const qrDataUrl = await QRCode.toDataURL(data.verificationUrl, {
    width: 256,
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  // Position QR Code on the bottom-right
  const qrSize = 34;
  const qrX = width - 25 - qrSize;
  const qrY = height - 25 - qrSize;
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('SCAN TO VERIFY ON-CHAIN', qrX + qrSize / 2, qrY + qrSize + 4, { align: 'center' });

  // 12. Bottom Left: Signatures & Metadata Block
  const metaX = 25;
  const metaY = height - 48;

  // Issue & Expiry Dates
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('DATE OF ISSUANCE:', metaX, metaY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.issueDate, metaX + 40, metaY);

  if (data.expiryDate) {
    doc.setFont('helvetica', 'bold');
    doc.text('VALID UNTIL:', metaX, metaY + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(data.expiryDate, metaX + 40, metaY + 6);
  }

  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATE ID:', metaX, metaY + 12);
  doc.setFont('courier', 'bold');
  doc.text(data.certificateId, metaX + 40, metaY + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('ISSUER ADDRESS:', metaX, metaY + 18);
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text(data.issuerAddress, metaX + 40, metaY + 18);

  // 13. Security Hash & Verification URL banner at very bottom
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(25, height - 22, width - 25, height - 22);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Verification URL: ${data.verificationUrl}`, 25, height - 17);
  doc.text(`Cryptographic Digest: ${data.certificateHash}`, 25, height - 13);

  // Generate binary output
  const blob = doc.output('blob');
  const buffer = new Uint8Array(doc.output('arraybuffer'));

  return { doc, blob, buffer };
}

export async function downloadCertificatePdf(data: CertificatePdfData, filename?: string) {
  const { doc } = await generateCertificatePdf(data);
  const name = filename || `${data.certificateId}-Certificate.pdf`;
  doc.save(name);
}
