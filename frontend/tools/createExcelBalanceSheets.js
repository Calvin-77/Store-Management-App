import * as XLSX from 'xlsx';

const createExcelBalanceSheets = (reportData, periode) => {
  const formatCurrency = (num) => {
    if (num < 0) {
      return `(${Math.abs(num).toFixed(2)})`;
    }
    return num.toFixed(2);
  };

  try {
    const workbook = XLSX.utils.book_new();
    
    let data;
    if (periode.asOfDate !== null) {
      data = [
        ['PT XXX'],
        ['Laporan Neraca'],
        [`Per Tanggal ${new Date(periode.asOfDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`],
        [],
        ['Nama Akun', 'Debit', 'Kredit'],
      ];
    } else {
      data = [
        ['PT XXX'],
        ['Laporan Neraca'],
        [`Tanggal ${new Date(periode.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} hingga ${new Date(periode.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`],
        [],
        ['Nama Akun', 'Debit', 'Kredit'],
      ];
    }

    if (reportData.aset.kas !== 0) {
      data.push(['Kas', formatCurrency(reportData.aset.kas), '']);
    }
    if (reportData.aset.piutang > 0) {
      data.push(['Piutang Usaha', formatCurrency(reportData.aset.piutang), '']);
    }
    if (reportData.aset.inventaris > 0) {
      data.push(['Inventaris', formatCurrency(reportData.aset.inventaris), '']);
    }
    if (reportData.aset.peralatan > 0) {
      data.push(['Peralatan', formatCurrency(reportData.aset.peralatan), '']);
    }

    if (reportData.liabilitas.utang > 0) {
      data.push(['Utang Usaha', '', formatCurrency(reportData.liabilitas.utang)]);
    }
    if (reportData.ekuitas.modal > 0) {
      data.push(['Modal', '', formatCurrency(reportData.ekuitas.modal)]);
    }
    data.push(['Laba Bulan Berjalan', '', formatCurrency(reportData.ekuitas.labaDitahan)]);

    data.push([]);
    data.push(['Jumlah', formatCurrency(reportData.aset.total), formatCurrency(reportData.liabilitas.total + reportData.ekuitas.total)]);

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    worksheet['!cols'] = [
      { width: 25 },
      { width: 15 },
      { width: 15 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Neraca');

    const excelBase64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    return excelBase64;
  } catch (error) {
    console.error('Gagal membuat data Excel:', error);
    throw error;
  }
};

export default createExcelBalanceSheets;