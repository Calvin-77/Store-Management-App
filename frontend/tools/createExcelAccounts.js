import * as XLSX from 'xlsx'

const createExcelAccounts = (data = [], place = '') => {
  try {
    const headers = [
      'ID',
      'Nama',
      'Tipe',
      'Deskripsi',
      'Total Tagihan',
      'Sisa Tagihan',
      'Tanggal Transaksi',
      'Jatuh Tempo',
      'Status',
      'Catatan',
      'Created At',
      'Updated At',
    ];

    const rows = (Array.isArray(data) ? data : []).map((item) => [
      item?.id ?? '',
      item?.name ?? '',
      item?.tipe ?? '',
      item?.deskripsi ?? 'N/A',
      item?.nominal_total ?? '',
      item?.sisa_tagihan ?? '',
      item?.tanggal_transaksi ?? '',
      item?.jatuh_tempo ? String(item.jatuh_tempo).split('T')[0] : '',
      item?.status ?? '',
      item?.catatan ?? '',
      item?.created_at ?? '',
      item?.updated_at ?? '',
    ]);

    const aoa = [headers, ...rows];

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);

    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 20 },
      { wch: 12 },
      { wch: 30 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 24 },
      { wch: 20 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    const sheetName = `Accounts${place ? `-${place}` : ''}`.slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
  } catch (error) {
    throw error;
  }
}

export default createExcelAccounts;