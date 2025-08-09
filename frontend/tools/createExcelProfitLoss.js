import * as XLSX from 'xlsx';

const createExcelProfitLoss = (reportData, periode) => {
  const formatNumber = (num) => num.toFixed(2);

  const expenseNames = {
    gaji: 'Beban gaji',
    bonus: 'Beban bonus',
    uangMakan: 'Beban uang makan',
    perlengkapan: 'Beban perlengkapan',
    lainLain: 'Beban lain-lain',
  };

  try {
    const workbook = XLSX.utils.book_new();
    
    const data = [
      [`Empat Satu - ${periode.place}`],
      ['Laporan Laba Rugi'],
      [`Periode: ${periode.startDate} s/d ${periode.endDate}`],
      [],
      ['Pendapatan Jasa', formatNumber(reportData.pendapatan)],
    ];

    if (reportData.hpp > 0) {
      data.push(['Harga Pokok Penjualan (HPP)', `(${formatNumber(reportData.hpp)})`]);
    }

    data.push([]);
    data.push(['Laba Kotor', formatNumber(reportData.labaKotor)]);
    data.push([]);
    data.push(['Beban-beban Usaha:']);

    Object.entries(reportData.beban).forEach(([key, value]) => {
      if (value > 0) {
        const expenseName = expenseNames[key] || `Beban ${key}`;
        data.push([expenseName, formatNumber(value)]);
      }
    });

    data.push([]);
    data.push(['Jumlah Beban Usaha', `(${formatNumber(reportData.totalBeban)})`]);
    data.push([]);
    data.push(['LABA BERSIH', formatNumber(reportData.labaBersih)]);

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    worksheet['!cols'] = [
      { width: 40 },
      { width: 20 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laba Rugi');

    const excelBase64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    return excelBase64;
  } catch (error) {
    console.error('Gagal membuat data Excel:', error);
    throw error;
  }
};

export default createExcelProfitLoss;
