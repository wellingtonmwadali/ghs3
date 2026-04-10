import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { DateRange } from './DateRangePicker';

// ─── CSV Export ──────────────────────────────────────────

export function exportCSV(filename: string, sections: { title: string; headers: string[]; rows: (string | number)[][] }[]) {
  let csv = '';

  for (const section of sections) {
    csv += `${section.title}\n`;
    csv += section.headers.join(',') + '\n';
    for (const row of section.rows) {
      csv += row.map(cell => {
        const str = String(cell);
        return str.includes(',') ? `"${str}"` : str;
      }).join(',') + '\n';
    }
    csv += '\n';
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

// ─── PDF Export ──────────────────────────────────────────

export function exportPDF(
  title: string,
  dateRange: DateRange,
  sections: { title: string; headers: string[]; rows: (string | number)[][] }[],
  summaryCards?: { label: string; value: string }[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`, 14, y);
  y += 4;
  doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`, 14, y);
  y += 8;

  // Summary cards row
  if (summaryCards && summaryCards.length > 0) {
    doc.setDrawColor(200);
    doc.setFillColor(248, 249, 250);
    const cardWidth = (pageWidth - 28 - (summaryCards.length - 1) * 4) / summaryCards.length;
    summaryCards.forEach((card, i) => {
      const x = 14 + i * (cardWidth + 4);
      doc.roundedRect(x, y, cardWidth, 22, 2, 2, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(card.label, x + 4, y + 8);
      doc.setFontSize(13);
      doc.setTextColor(30);
      doc.setFont('helvetica', 'bold');
      doc.text(card.value, x + 4, y + 17);
      doc.setFont('helvetica', 'normal');
    });
    y += 30;
  }

  // Sections
  for (const section of sections) {
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(30);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [section.headers],
      body: section.rows.map(row => row.map(String)),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 12;
  }

  doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}

// ─── Print ───────────────────────────────────────────────

export function printReport(elementId: string) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #1a1a1a; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        th { background: #f8fafc; font-weight: 600; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        h2 { font-size: 16px; margin: 20px 0 8px; color: #374151; }
        .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 16px; }
        .kpi-row { display: flex; gap: 12px; margin: 16px 0; }
        .kpi { flex: 1; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .kpi-label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
        .kpi-value { font-size: 20px; font-weight: 700; margin-top: 4px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>${el.innerHTML}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
}

// ─── Helpers ─────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatCurrency(val: number): string {
  return `Ksh ${val.toLocaleString()}`;
}
