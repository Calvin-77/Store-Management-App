import { jsPDF } from "jspdf";

const createPdfRecaps = (reportData, periode) => {
    const formatPeriodHeader = (periodKey, groupBy) => {
        switch (groupBy) {
            case 'week':
                const year = periodKey.substring(0, 4);
                const week = periodKey.substring(4);
                return `Minggu ke-${week}, Tahun ${year}`;
            case 'month':
                const [monthYear, monthNum] = periodKey.split('-');
                const monthDate = new Date(monthYear, monthNum - 1);
                const monthName = monthDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
                return `Bulan: ${monthName}`;
            case 'year':
                return `Tahun: ${periodKey}`;
            case 'day':
            default:
                return `Tanggal: ${new Date(periodKey).toLocaleDateString('id-ID', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}`;
        }
    };

    try {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.width;
        const margin = 15;

        const type_x = margin + 5;
        const description_x = margin + 45;
        const nominal_x = pageWidth - margin - 5;

        let y = 20;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`Laporan Transaksi - ${periode.place}`, pageWidth / 2, y, { align: 'center' });

        y += 8;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const startDateFormatted = new Date(periode.startDate).toLocaleDateString('id-ID');
        const endDateFormatted = new Date(periode.endDate).toLocaleDateString('id-ID');
        doc.text(`Periode: ${startDateFormatted} s/d ${endDateFormatted}`, pageWidth / 2, y, { align: 'center' });

        y += 12;
        const sortedPeriods = Object.keys(reportData).sort();

        for (const periodKey of sortedPeriods) {
            if (y > 250) {
                doc.addPage();
                y = 25;
            }

            const transactions = reportData[periodKey];
            const periodHeaderText = formatPeriodHeader(periodKey, periode.groupBy);

            doc.setFillColor(239, 246, 255);
            doc.rect(margin, y, pageWidth - (margin * 2), 9, 'F');
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(periodHeaderText, margin + 3, y + 6.5);

            y += 12;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Tipe', type_x, y);
            doc.text('Deskripsi', description_x, y);
            doc.text('Nominal', nominal_x - 3, y, { align: 'right' });

            doc.setLineWidth(0.2);
            doc.line(margin, y + 2, pageWidth - margin, y + 2);

            y += 6;

            doc.setFont('helvetica', 'normal');
            for (const trx of transactions) {
                if (y > 270) {
                    doc.addPage();
                    y = 25;
                }

                const descriptionText = trx.description || 'Tanpa Deskripsi';
                const descriptionWidth = 100;
                const descriptionLines = doc.splitTextToSize(descriptionText, descriptionWidth);

                if (y > 270) {
                    doc.addPage();
                    y = 25;
                }

                doc.text(trx.type, type_x, y);
                doc.text(trx.nominal.toFixed(2), nominal_x + 3, y, { align: 'right' });

                doc.text(descriptionLines, description_x, y);

                const lineHeight = 5;
                const totalHeight = descriptionLines.length * lineHeight;

                y += totalHeight + 2;
            }
            y += 5;
        }

        return doc.output();
    } catch (error) {
        console.error('Gagal membuat data PDF:', error);
        throw error;
    }
};

export default createPdfRecaps;