import { jsPDF } from "jspdf";

const createPdfProfitLoss = (reportData, periode) => {
  const formatNumber = (num) => num.toFixed(2);

  const expenseNames = {
    gaji: 'Beban gaji',
    bonus: 'Beban bonus',
    uangMakan: 'Beban uang makan',
    perlengkapan: 'Beban perlengkapan',
    lainLain: 'Beban lain-lain',
  };

  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const valueX = pageWidth - 50; 
    let y = 30;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Empat Satu - ${periode.place}`, pageWidth / 2, y, { align: 'center' });
    y += 7;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Laporan Laba Rugi', pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(10);
    doc.text(`Periode: ${periode.startDate} s/d ${periode.endDate}`, pageWidth / 2, y, { align: 'center' });
    y += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    doc.text('Pendapatan Jasa', margin, y);
    doc.text(formatNumber(reportData.pendapatan), valueX, y);
    y += 7;

    if (reportData.hpp > 0) {
      doc.text('Harga Pokok Penjualan (HPP)', margin, y);
      doc.text(`(${formatNumber(reportData.hpp)})`, valueX, y);
      y += 7;
    }

    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Laba Kotor', margin, y);
    doc.text(formatNumber(reportData.labaKotor), valueX, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.text('Beban-beban Usaha:', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');

    for (const key in reportData.beban) {
      if (Object.hasOwnProperty.call(reportData.beban, key) && reportData.beban[key] > 0) {
        const expenseName = expenseNames[key] || `Beban ${key}`;
        const expenseValue = reportData.beban[key];
        doc.text(expenseName, margin + 5, y);
        doc.text(formatNumber(expenseValue), valueX, y);
        y += 7;
      }
    }

    y += 2;
    doc.line(margin + 5, y, pageWidth - margin, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Jumlah Beban Usaha', margin + 5, y);
    doc.text(`(${formatNumber(reportData.totalBeban)})`, valueX, y);
    y += 7;

    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('LABA BERSIH', margin, y);
    doc.text(formatNumber(reportData.labaBersih), valueX, y);

    return doc.output();
  } catch (error) {
    console.error('Gagal membuat data PDF:', error);
    throw error;
  }
};

export default createPdfProfitLoss;
