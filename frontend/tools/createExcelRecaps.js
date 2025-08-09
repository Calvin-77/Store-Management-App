import * as XLSX from 'xlsx';

const createExcelRecaps = (reportData, periode) => {
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
        const workbook = XLSX.utils.book_new();
        
        const data = [
            [`Laporan Transaksi - ${periode.place}`],
            [`Periode: ${new Date(periode.startDate).toLocaleDateString('id-ID')} s/d ${new Date(periode.endDate).toLocaleDateString('id-ID')}`],
            [],
        ];

        Object.keys(reportData).sort().forEach(periodKey => {
            const transactions = reportData[periodKey];
            const periodHeaderText = formatPeriodHeader(periodKey, periode.groupBy);
            
            data.push([periodHeaderText]);
            data.push(['Tipe', 'Deskripsi', 'Nominal']);
            
            transactions.forEach(trx => {
                data.push([
                    trx.type,
                    trx.description || 'Tanpa Deskripsi',
                    trx.nominal.toFixed(2)
                ]);
            });
            
            data.push([]);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(data);

        worksheet['!cols'] = [
            { width: 25 },
            { width: 40 },
            { width: 15 }
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekapitulasi');

        const excelBase64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
        return excelBase64;
    } catch (error) {
        console.error('Gagal membuat data Excel:', error);
        throw error;
    }
};

export default createExcelRecaps;