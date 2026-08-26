import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency } from './format';

interface StatementTransaction {
  date: string;
  id: string;
  customer: string;
  type: string;
  gross: number;
  fee: number;
  net: number;
}

interface StatementData {
  month: string;
  merchantName: string;
  grossVolume: number;
  refunds: number;
  fees: number;
  chargebacks: number;
  net: number;
  transactions: StatementTransaction[];
}

export function generateStatementPdf(data: StatementData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header with branding
  doc.setFillColor(0, 102, 255); // brand primary #0066FF
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('AuraPOS', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Processing Statement', pageWidth - 14, 12, { align: 'right' });
  doc.text(data.month, pageWidth - 14, 18, { align: 'right' });

  // Merchant info
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(data.merchantName, 14, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Statement Period: ${data.month}`, 14, 47);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 53);

  // Summary box
  const summaryY = 62;
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(14, summaryY, pageWidth - 28, 38, 3, 3, 'FD');

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.text('GROSS VOLUME', 24, summaryY + 10);
  doc.text('REFUNDS', 64, summaryY + 10);
  doc.text('FEES', 104, summaryY + 10);
  doc.text('CHARGEBACKS', 134, summaryY + 10);
  doc.text('NET DEPOSITS', 174, summaryY + 10);

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.grossVolume), 24, summaryY + 20);
  doc.setTextColor(220, 50, 50);
  doc.text(`-${formatCurrency(data.refunds)}`, 64, summaryY + 20);
  doc.setTextColor(80, 80, 80);
  doc.text(`-${formatCurrency(data.fees)}`, 104, summaryY + 20);
  doc.setTextColor(140, 50, 180);
  doc.text(`-${formatCurrency(data.chargebacks)}`, 134, summaryY + 20);
  doc.setTextColor(0, 130, 80);
  doc.text(formatCurrency(data.net), 174, summaryY + 20);

  // Fee breakdown
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Fee Rate: 2.9% + $0.30 per transaction', 24, summaryY + 32);

  // Transactions table
  const tableY = summaryY + 46;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Detail', 14, tableY);

  const tableData = data.transactions.map((t) => [
    t.date,
    t.id.slice(0, 14) + '...',
    t.customer,
    t.type,
    formatCurrency(t.gross),
    `-${formatCurrency(t.fee)}`,
    formatCurrency(t.net),
  ]);

  // @ts-expect-error jspdf-autotable extends jsPDF prototype
  doc.autoTable({
    startY: tableY + 4,
    head: [['Date', 'Transaction ID', 'Customer', 'Type', 'Gross', 'Fee', 'Net']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [240, 240, 240], textColor: [80, 80, 80], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 200;
  doc.setDrawColor(220, 220, 220);
  doc.line(14, finalY + 10, pageWidth - 14, finalY + 10);
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text('This statement is generated for demonstration purposes only. AuraPOS — Merchant Portal Prototype.', 14, finalY + 16);

  // Download
  doc.save(`statement-${data.month.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}
