import { jsPDF } from "jspdf";

const createPdfBalanceSheet = (reportData, periode) => {
  const formatCurrency = (num) => {
    if (num < 0) {
      return `(${Math.abs(num).toFixed(2)})`;
    }
    return num.toFixed(2);
  };

  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    const debit_x = 145;
    const kredit_x = 195;
    let y = 25;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`PT XXX`, pageWidth / 2, y, { align: 'center' });
    y += 7;
    doc.setFontSize(14);
    doc.text('Laporan Neraca', pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.setFontSize(10);
    const formattedDate = new Date(periode.asOfDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`Per Tanggal ${formattedDate}`, pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFillColor(224, 236, 255);
    doc.rect(margin, y, pageWidth - (margin * 2), 10, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Nama Akun', margin + 5, y + 7);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 10, pageWidth - margin, y + 10);
    doc.setFontSize(10);
    doc.text('Debit', debit_x - 20, y + 7, { align: 'center' });
    doc.text('Kredit', kredit_x - 20, y + 7, { align: 'center' });
    y += 15;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    if (reportData.aset.kas !== 0) {
      doc.text('Kas', margin + 5, y);
      doc.text(formatCurrency(reportData.aset.kas), debit_x, y, { align: 'right' });
      y += 7;
    }
    if (reportData.aset.piutang > 0) {
      doc.text('Piutang Usaha', margin + 5, y);
      doc.text(formatCurrency(reportData.aset.piutang), debit_x, y, { align: 'right' });
      y += 7;
    }
    if (reportData.aset.inventaris > 0) {
      doc.text('Inventaris', margin + 5, y);
      doc.text(formatCurrency(reportData.aset.inventaris), debit_x, y, { align: 'right' });
      y += 7;
    }
    if (reportData.aset.perlengkapan > 0) {
      doc.text('Perlengkapan', margin + 5, y);
      doc.text(formatCurrency(reportData.aset.perlengkapan), debit_x, y, { align: 'right' });
      y += 7;
    }
    if (reportData.aset.peralatan > 0) {
      doc.text('Peralatan', margin + 5, y);
      doc.text(formatCurrency(reportData.aset.peralatan), debit_x, y, { align: 'right' });
      y += 7;
    }
    if (reportData.liabilitas.utang > 0) {
      doc.text('Utang Usaha', margin + 5, y);
      doc.text(formatCurrency(reportData.liabilitas.utang), kredit_x, y, { align: 'right' });
      y += 7;
    }
    if (reportData.ekuitas.modal > 0) {
      doc.text('Modal', margin + 5, y);
      doc.text(formatCurrency(reportData.ekuitas.modal), kredit_x, y, { align: 'right' });
      y += 7;
    }
    doc.text('Laba Bulan Berjalan', margin + 5, y);
    doc.text(formatCurrency(reportData.ekuitas.labaDitahan), kredit_x, y, { align: 'right' });
    y += 10;

    doc.line(margin, y - 5, pageWidth - margin, y - 5);
    doc.setFont('helvetica', 'bold');
    doc.text('Jumlah', margin + 5, y);
    doc.text(formatCurrency(reportData.aset.total), debit_x, y, { align: 'right' });
    const totalLiabilitasEkuitas = reportData.liabilitas.total + reportData.ekuitas.total;
    doc.text(formatCurrency(totalLiabilitasEkuitas), kredit_x, y, { align: 'right' });

    doc.setLineWidth(0.2);
    doc.line(debit_x - 40, y + 2, debit_x, y + 2);
    doc.line(debit_x - 40, y + 3, debit_x, y + 3);
    doc.line(kredit_x - 40, y + 2, kredit_x, y + 2);
    doc.line(kredit_x - 40, y + 3, kredit_x, y + 3);

    return doc.output();
  } catch (error) {
    console.error('Gagal membuat data PDF:', error);
    throw error;
  }
};

export default createPdfBalanceSheet;