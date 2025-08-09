import * as XLSX from 'xlsx';

const createExcelItemStocks = (reportData, place) => {
    try {
        const workbook = XLSX.utils.book_new();
        const today = new Date().toISOString().split('T')[0];

        const data = [
            ['PT XXX'],
            ['Stok Barang'],
            [`Per Tanggal ${today}`],
            ['ID', 'SKU', 'Nama', 'Deskripsi', 'Harga Beli', 'Harga Jual', 'Stok', 'Minimum Stok']
        ];

        const rows = reportData.map(item => {
            let stockString = 'N/A';
            if (item.stock_levels && item.stock_levels[place]) {
                const stockEntries = Object.entries(item.stock_levels[place]);
                if (stockEntries.length > 0) {
                    stockString = stockEntries.map(([unit, stock]) => `${stock} ${unit}`).join(', ');
                }
            }

            return [
                item.product_id,
                item.sku,
                item.name,
                item.description || '',
                item.purchase_price,
                item.selling_price,
                stockString,
                item.min_stock_level,
            ];
        });

        const fullData = [...data, ...rows];

        const worksheet = XLSX.utils.aoa_to_sheet(fullData);

        worksheet['!cols'] = [
            { wch: 5 },
            { wch: 15 },
            { wch: 40 },
            { wch: 50 },
            { wch: 18 },
            { wch: 18 },
            { wch: 20 },
            { wch: 15 },
        ];
    
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Stok');

        const excelBase64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });

        return excelBase64;
    } catch (error) {
        console.error('Gagal membuat data Excel Stok Barang:', error);
        throw error;
    }
};

export default createExcelItemStocks;