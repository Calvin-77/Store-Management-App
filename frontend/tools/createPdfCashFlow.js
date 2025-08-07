import { jsPDF } from "jspdf";

const createPdfCashFlow = (reportData, periode) => {
    const formatInflow = (num) => num.toFixed(2);
    const formatOutflow = (num) => num.toFixed(2);
    const formatNet = (num) => {
        if (num < 0) {
            return `(${Math.abs(num).toFixed(2)})`;
        }
        return num.toFixed(2);
    };

    try {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        const col1_x = 140;
        const col2_x = pageWidth - margin;
        let y = 30;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`Manajemen Keuangan Network`, pageWidth / 2, y, { align: 'center' });
        y += 7;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Laporan Arus Kas', pageWidth / 2, y, { align: 'center' });
        y += 5;
        doc.setFontSize(10);
        const formattedEndDate = new Date(periode.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        doc.text(`Untuk bulan yang berakhir pada ${formattedEndDate}`, pageWidth / 2, y, { align: 'center' });
        y += 15;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Arus kas dari aktivitas operasi', margin, y);
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.text('Kas yang diterima dari pelanggan', margin + 5, y);
        doc.text(formatInflow(reportData.operasi.masuk), col1_x, y, { align: 'right' });
        y += 7;
        doc.text('Dikurangi pembayaran kas untuk beban', margin + 5, y);
        doc.text(formatOutflow(reportData.operasi.keluar), col1_x, y, { align: 'right' });
        y += 1;
        doc.line(col1_x - 30, y, col1_x, y);
        y += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Arus kas bersih dari kegiatan operasi', margin, y);
        doc.text(formatNet(reportData.operasi.net), col2_x, y, { align: 'right' });
        y += 12;

        doc.setFont('helvetica', 'bold');
        doc.text('Arus kas dari kegiatan investasi', margin, y);
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.text('Pembayaran kas untuk investasi', margin + 5, y);
        doc.text(formatNet(reportData.investasi.net), col2_x, y, { align: 'right' });
        y += 12;

        doc.setFont('helvetica', 'bold');
        doc.text('Arus kas dari kegiatan pendanaan', margin, y);
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.text('Kas yang diterima dari investasi pemilik', margin + 5, y);
        doc.text(formatInflow(reportData.pendanaan.masuk), col1_x, y, { align: 'right' });
        y += 7;
        doc.text('Dikurangi prive / pembayaran utang', margin + 5, y);
        doc.text(formatOutflow(reportData.pendanaan.keluar), col1_x, y, { align: 'right' });
        y += 1;
        doc.line(col1_x - 30, y, col1_x, y);
        y += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Arus kas bersih dari kegiatan pendanaan', margin, y);
        doc.text(formatNet(reportData.pendanaan.net), col2_x, y, { align: 'right' });
        y += 12;

        doc.setFont('helvetica', 'bold');
        doc.text('Arus kas bersih', margin, y);
        doc.text(formatNet(reportData.totalArusKasBersih), col2_x, y, { align: 'right' });
        y += 1;

        doc.setLineWidth(0.5);
        doc.line(col2_x - 40, y, col2_x, y);
        doc.line(col2_x - 40, y+1, col2_x, y+1);

        return doc.output();
    } catch (error) {
        console.error('Gagal membuat data PDF:', error);
        throw error;
    }
};

export default createPdfCashFlow;