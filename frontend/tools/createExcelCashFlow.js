import * as XLSX from 'xlsx';

const createExcelCashFlow = (reportData, periode) => {
    const formatInflow = (num) => num.toFixed(2);
    const formatOutflow = (num) => num.toFixed(2);
    const formatNet = (num) => {
        if (num < 0) {
            return `(${Math.abs(num).toFixed(2)})`;
        }
        return num.toFixed(2);
    };

    try {
        const workbook = XLSX.utils.book_new();
        
        const data = [
            ['Manajemen Keuangan Network'],
            ['Laporan Arus Kas'],
            [`Untuk bulan yang berakhir pada ${new Date(periode.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`],
            [],
            ['Arus kas dari aktivitas operasi'],
            ['Kas yang diterima dari pelanggan', formatInflow(reportData.operasi.masuk)],
            ['Dikurangi pembayaran kas untuk beban', formatOutflow(reportData.operasi.keluar)],
            [],
            ['Arus kas bersih dari kegiatan operasi', formatNet(reportData.operasi.net)],
            [],
            ['Arus kas dari kegiatan investasi'],
            ['Pembayaran kas untuk investasi', formatNet(reportData.investasi.net)],
            [],
            ['Arus kas dari kegiatan pendanaan'],
            ['Kas yang diterima dari investasi pemilik', formatInflow(reportData.pendanaan.masuk)],
            ['Dikurangi prive / pembayaran utang', formatOutflow(reportData.pendanaan.keluar)],
            [],
            ['Arus kas bersih dari kegiatan pendanaan', formatNet(reportData.pendanaan.net)],
            [],
            ['Arus kas bersih', formatNet(reportData.totalArusKasBersih)],
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(data);

        worksheet['!cols'] = [
            { width: 40 },
            { width: 20 }
        ];

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Arus Kas');

        const excelBase64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

        return excelBase64;
    } catch (error) {
        console.error('Gagal membuat data Excel:', error);
        throw error;
    }
};

export default createExcelCashFlow;