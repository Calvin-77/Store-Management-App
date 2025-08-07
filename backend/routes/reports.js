const express = require('express');
const router = express.Router();
const connection = require('./connect');

function calculateProfitForPeriod(transactionRows) {
    const result = { pendapatan: 0, hpp: 0, totalBeban: 0 };
    transactionRows.forEach(row => {
        const total = parseFloat(row.nominal);
        switch (row.type) {
            case 'Penjualan': result.pendapatan += total; break;
            case 'Stok Keluar': result.hpp += total; break;
            case 'Beban Gaji Staff':
            case 'Beban Bonus Staff':
            case 'Uang Makan Staff':
            case 'Perlengkapan':
            case 'Biaya Lain Lain':
                result.totalBeban += total;
                break;
        }
    });
    const labaBersih = result.pendapatan - result.hpp - result.totalBeban;
    return { ...result, labaBersih };
}

function calculateCashFlowForPeriod(transactionRows) {
    let totalMasuk = 0;
    let totalKeluar = 0;
    transactionRows.forEach(row => {
        const total = parseFloat(row.nominal);
        switch (row.type) {
            case 'Penjualan': case 'Pembayaran Piutang': case 'Modal': case 'Utang':
                totalMasuk += total; break;
            case 'Stok Masuk': case 'Beban Gaji Staff': case 'Beban Bonus Staff':
            case 'Uang Makan Staff': case 'Perlengkapan': case 'Biaya Lain Lain':
            case 'Peralatan': case 'Pembayaran Utang':
                totalKeluar += total; break;
        }
    });
    return totalMasuk - totalKeluar;
}

router.post('/', async (req, res) => {
    const { type, name, product_name, description, place, quantity, unit, nominal } = req.body;

    const query = "INSERT INTO transactions (type, name, product_name, description, place, quantity, unit, nominal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    const values = [type, name || null, product_name || null, description || null, place, quantity || null, unit || null, nominal];

    try {
        const [result] = await connection.promise().query(query, values);
        res.status(201).json({ message: 'Report created successfully.', reportId: result.insertId });
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});

router.post('/reports', async (req, res) => {
    const { report_type, place, startDate, endDate, asOfDate, pdf_path, closingBalances } = req.body;

    if (!pdf_path) {
        return res.status(400).json({ message: 'pdf_path diperlukan untuk finalisasi.' });
    }
    if (report_type === 'balance-sheet' && !closingBalances) {
        return res.status(400).json({ message: 'closingBalances diperlukan untuk finalisasi laporan neraca.' });
    }

    try {
        const query = `
            INSERT INTO reports (
                report_type, place, start_date, end_date, as_of_date, pdf_path, status,
                closing_cash, closing_inventory, closing_receivables, closing_payables, 
                closing_retained_earnings, closing_equipment, closing_supplies, closing_modal
            ) VALUES (?, ?, ?, ?, ?, ?, 'final', ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            report_type, place, startDate || null, endDate || null, asOfDate || null, pdf_path,
            closingBalances?.kas || 0,
            closingBalances?.inventaris || 0,
            closingBalances?.piutang || 0,
            closingBalances?.utang || 0,
            closingBalances?.labaDitahan || 0,
            closingBalances?.peralatan || 0,
            closingBalances?.perlengkapan || 0,
            closingBalances?.modal || 0
        ];
        await connection.promise().query(query, values);
        res.status(201).json({ message: `Laporan ${report_type} untuk ${place} berhasil difinalisasi.` });
    } catch (error) {
        console.error("Finalize Error:", error);
        res.status(500).json({ message: 'Gagal memfinalisasi laporan.', error: error.message });
    }
});

router.get('/reports', async (req, res) => {
    const { report_type, place } = req.query;
    try {
        const query = 'SELECT * FROM reports WHERE report_type = ? AND place = ? ORDER BY created_at DESC';
        const [rows] = await connection.promise().query(query, [report_type, place]);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ message: 'Gagal mengambil data laporan dari server.', error: error.message });
    }
});

router.get('/profit-loss-report', async (req, res) => {
    const { startDate, endDate, place } = req.query;
    const incomeTypes = [
        'Penjualan', 'Stok Keluar', 'Beban Gaji Staff', 'Beban Bonus Staff',
        'Uang Makan Staff', 'Perlengkapan', 'Biaya Lain Lain'
    ];
    const checkQuery = `SELECT * FROM reports WHERE report_type = ? AND place = ? AND start_date = ? AND end_date = ? AND status = 'final'`;
    const query = `SELECT type, SUM(nominal) AS total FROM transactions WHERE created_at BETWEEN ? AND ? AND place = ? AND type IN (?) GROUP BY type`;

    try {
        const [existingReports] = await connection.promise().query(checkQuery, ['profit-loss', place, startDate, endDate]);
        if (existingReports.length > 0) {
            return res.status(409).json({ message: "Laporan untuk periode ini sudah pernah dibuat sebelumnya.", data: existingReports[0] });
        }
        const [rows] = await connection.promise().query(query, [startDate, `${endDate} 23:59:59`, place, incomeTypes]);
        const result = {
            pendapatan: 0, hpp: 0, labaKotor: 0,
            beban: { gaji: 0, bonus: 0, uangMakan: 0, perlengkapan: 0, lainLain: 0 },
            totalBeban: 0, labaBersih: 0,
        };
        rows.forEach(row => {
            switch (row.type) {
                case 'Penjualan': result.pendapatan += parseFloat(row.total); break;
                case 'Stok Keluar': result.hpp += parseFloat(row.total); break;
                case 'Beban Gaji Staff': result.beban.gaji += parseFloat(row.total); break;
                case 'Beban Bonus Staff': result.beban.bonus += parseFloat(row.total); break;
                case 'Uang Makan Staff': result.beban.uangMakan += parseFloat(row.total); break;
                case 'Perlengkapan': result.beban.perlengkapan += parseFloat(row.total); break;
                case 'Biaya Lain Lain': result.beban.lainLain += parseFloat(row.total); break;
            }
        });
        result.labaKotor = result.pendapatan - result.hpp;
        result.totalBeban = Object.values(result.beban).reduce((sum, val) => sum + val, 0);
        result.labaBersih = result.labaKotor - result.totalBeban;
        res.json(result);
    } catch (error) {
        console.error("Error fetching profit-loss report:", error);
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});

router.get('/cash-flow-report', async (req, res) => {
    const { startDate, endDate, place } = req.query;
    const query = `SELECT type, SUM(nominal) AS total FROM transactions WHERE created_at BETWEEN ? AND ? AND place = ? GROUP BY type`;
    const checkQuery = `SELECT * FROM reports WHERE report_type = ? AND place = ? AND start_date = ? AND end_date = ? AND status = 'final'`;

    try {
        const [existingReports] = await connection.promise().query(checkQuery, ['cash-flow', place, startDate, endDate]);

        if (existingReports.length > 0) {
            return res.status(409).json({
                message: "Laporan Arus Kas untuk periode ini sudah pernah dibuat.",
                data: existingReports[0]
            });
        }


        const [rows] = await connection.promise().query(query, [startDate, `${endDate} 23:59:59`, place]);

        const cashflow = {
            operasi: { masuk: 0, keluar: 0, net: 0 },
            investasi: { masuk: 0, keluar: 0, net: 0 },
            pendanaan: { masuk: 0, keluar: 0, net: 0 },
            totalArusKasBersih: 0,
        };

        rows.forEach(row => {
            const total = parseFloat(row.total);
            switch (row.type) {
                case 'Penjualan': case 'Pembayaran Piutang':
                    cashflow.operasi.masuk += total; break;
                case 'Stok Masuk': case 'Beban Gaji Staff': case 'Beban Bonus Staff': case 'Uang Makan Staff': case 'Perlengkapan': case 'Biaya Lain Lain':
                    cashflow.operasi.keluar += total; break;
                case 'Peralatan':
                    cashflow.investasi.keluar += total; break;
                case 'Modal': case 'Utang':
                    cashflow.pendanaan.masuk += total; break;
                case 'Pembayaran Utang':
                    cashflow.pendanaan.keluar += total; break;
            }
        });

        cashflow.operasi.net = cashflow.operasi.masuk - cashflow.operasi.keluar;
        cashflow.investasi.net = cashflow.investasi.masuk - cashflow.investasi.keluar;
        cashflow.pendanaan.net = cashflow.pendanaan.masuk - cashflow.pendanaan.keluar;
        cashflow.totalArusKasBersih = cashflow.operasi.net + cashflow.investasi.net + cashflow.pendanaan.net;

        res.json(cashflow);
    } catch (error) {
        console.error("Error fetching cash flow report:", error);
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});

router.get('/balance-sheet', async (req, res) => {
    const { asOfDate, place } = req.query;
    try {
        const checkQuery = `SELECT * FROM reports WHERE report_type = 'balance-sheet' AND place = ? AND as_of_date = ? AND status = 'final'`;
        const [existingReports] = await connection.promise().query(checkQuery, [place, asOfDate]);
        if (existingReports.length > 0) {
            return res.status(409).json({ message: `Laporan Neraca per tanggal ${asOfDate} di ${place} sudah pernah dibuat.`, data: existingReports[0] });
        }

        const lastReportQuery = `
            SELECT as_of_date, closing_cash, closing_inventory, closing_receivables, 
                   closing_payables, closing_retained_earnings, closing_equipment, closing_supplies, closing_modal
            FROM reports
            WHERE report_type = 'balance-sheet' AND place = ? AND as_of_date < ? AND status = 'final'
            ORDER BY as_of_date DESC
            LIMIT 1
        `;

        const [lastReports] = await connection.promise().query(lastReportQuery, [place, asOfDate]);

        let saldoAwal = {
            kas: 0, inventaris: 0, piutang: 0, utang: 0, modal: 0,
            labaDitahan: 0, peralatan: 0, perlengkapan: 0
        };

        let startDate = '1970-01-01';

        if (lastReports.length > 0) {
            const last = lastReports[0];
            saldoAwal = {
                kas: parseFloat(last.closing_cash || 0),
                inventaris: parseFloat(last.closing_inventory || 0),
                piutang: parseFloat(last.closing_receivables || 0),
                utang: parseFloat(last.closing_payables || 0),
                modal: parseFloat(last.closing_modal || 0),
                labaDitahan: parseFloat(last.closing_retained_earnings || 0),
                peralatan: parseFloat(last.closing_equipment || 0),
                perlengkapan: parseFloat(last.closing_supplies || 0)
            };
            let lastDate = new Date(last.as_of_date);
            lastDate.setDate(lastDate.getDate() + 1);
            startDate = lastDate.toISOString().split('T')[0];
        }
        
        const periodQuery = `SELECT type, nominal FROM transactions WHERE created_at BETWEEN ? AND ? AND place = ?`;
        const [periodRows] = await connection.promise().query(periodQuery, [startDate, `${asOfDate} 23:59:59`, place]);
        
        const periodSumQuery = `SELECT type, SUM(nominal) as total FROM transactions WHERE created_at BETWEEN ? AND ? AND place = ? GROUP BY type`;
        const [periodSumRows] = await connection.promise().query(periodSumQuery, [startDate, `${asOfDate} 23:59:59`, place]);
        
        const periodSum = {};
        periodSumRows.forEach(r => periodSum[r.type] = parseFloat(r.total));

        const perubahanKas = calculateCashFlowForPeriod(periodRows);
        const profitPeriodeIni = calculateProfitForPeriod(periodRows);

        const saldoAkhirModal = saldoAwal.modal + (periodSum['Modal'] || 0);
        const saldoAkhirKas = saldoAwal.kas + perubahanKas;
        const saldoAkhirPiutang = saldoAwal.piutang + (periodSum['Piutang'] || 0) - (periodSum['Pembayaran Piutang'] || 0);
        const saldoAkhirUtang = saldoAwal.utang + (periodSum['Utang'] || 0) - (periodSum['Pembayaran Utang'] || 0);
        const saldoAkhirInventaris = saldoAwal.inventaris + (periodSum['Stok Masuk'] || 0) - (profitPeriodeIni.hpp);
        const saldoAkhirLabaDitahan = saldoAwal.labaDitahan + profitPeriodeIni.labaBersih;
        const saldoAkhirPeralatan = saldoAwal.peralatan + (periodSum['Peralatan'] || 0);
        const saldoAkhirPerlengkapan = saldoAwal.perlengkapan + (periodSum['Perlengkapan'] || 0);
        
        const totalAset = saldoAkhirKas + saldoAkhirPiutang + saldoAkhirPeralatan + saldoAkhirPerlengkapan + saldoAkhirInventaris;
        const totalLiabilitas = saldoAkhirUtang;
        const totalEkuitas = saldoAkhirModal + saldoAkhirLabaDitahan;
        
        res.json({
            asOfDate,
            aset: { kas: saldoAkhirKas, piutang: saldoAkhirPiutang, peralatan: saldoAkhirPeralatan, perlengkapan: saldoAkhirPerlengkapan, inventaris: saldoAkhirInventaris, total: totalAset },
            liabilitas: { utang: saldoAkhirUtang, total: totalLiabilitas },
            ekuitas: { modal: saldoAkhirModal, labaDitahan: saldoAkhirLabaDitahan, total: totalEkuitas },
            check: { totalAset, totalLiabilitasDanEkuitas: totalLiabilitas + totalEkuitas, selisih: totalAset - (totalLiabilitas + totalEkuitas) },
        });
    } catch (error) {
        console.error("Error fetching balance sheet:", error);
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});

router.get('/balance-sheet/period', async (req, res) => {
    const { startDate, endDate, place } = req.query;

    if (!startDate || !endDate || !place) {
        return res.status(400).json({ message: 'Parameter startDate, endDate, dan place diperlukan.' });
    }

    try {
        const checkQuery = `SELECT * FROM reports WHERE report_type = 'balance-sheet' AND place = ? AND as_of_date = ? AND status = 'final'`;
        const [existingReports] = await connection.promise().query(checkQuery, [place, endDate]);

        if (existingReports.length > 0) {
            return res.status(409).json({ message: `Laporan Neraca per tanggal ${endDate} di ${place} sudah pernah dibuat.`, data: existingReports[0] });
        }

        const lastReportQuery = `
            SELECT as_of_date, closing_cash, closing_inventory, closing_receivables, 
                   closing_payables, closing_retained_earnings, closing_equipment, closing_supplies, closing_modal
            FROM reports
            WHERE report_type = 'balance-sheet' AND place = ? AND as_of_date < ? AND status = 'final'
            ORDER BY as_of_date DESC
            LIMIT 1
        `;
        const [lastReports] = await connection.promise().query(lastReportQuery, [place, startDate]);

        let saldoAwal = {
            kas: 0, inventaris: 0, piutang: 0, utang: 0, modal: 0,
            labaDitahan: 0, peralatan: 0, perlengkapan: 0
        };
        
        let startCalculationDate = '1970-01-01';

        if (lastReports.length > 0) {
            const last = lastReports[0];
            saldoAwal = {
                kas: parseFloat(last.closing_cash || 0),
                inventaris: parseFloat(last.closing_inventory || 0),
                piutang: parseFloat(last.closing_receivables || 0),
                utang: parseFloat(last.closing_payables || 0),
                modal: parseFloat(last.closing_modal || 0),
                labaDitahan: parseFloat(last.closing_retained_earnings || 0),
                peralatan: parseFloat(last.closing_equipment || 0),
                perlengkapan: parseFloat(last.closing_supplies || 0)
            };
            let lastDate = new Date(last.as_of_date);
            lastDate.setDate(lastDate.getDate() + 1);
            startCalculationDate = lastDate.toISOString().split('T')[0];
        }
        
        const periodQuery = `SELECT type, nominal FROM transactions WHERE created_at BETWEEN ? AND ? AND place = ?`;
        const [periodRows] = await connection.promise().query(periodQuery, [startCalculationDate, `${endDate} 23:59:59`, place]);
        
        const periodSumQuery = `SELECT type, SUM(nominal) as total FROM transactions WHERE created_at BETWEEN ? AND ? AND place = ? GROUP BY type`;
        const [periodSumRows] = await connection.promise().query(periodSumQuery, [startCalculationDate, `${endDate} 23:59:59`, place]);
        
        const periodSum = {};
        periodSumRows.forEach(r => periodSum[r.type] = parseFloat(r.total));

        const perubahanKas = calculateCashFlowForPeriod(periodRows);
        const profitPeriodeIni = calculateProfitForPeriod(periodRows);

        const saldoAkhirModal = saldoAwal.modal + (periodSum['Modal'] || 0);
        const saldoAkhirKas = saldoAwal.kas + perubahanKas;
        const saldoAkhirPiutang = saldoAwal.piutang + (periodSum['Piutang'] || 0) - (periodSum['Pembayaran Piutang'] || 0);
        const saldoAkhirUtang = saldoAwal.utang + (periodSum['Utang'] || 0) - (periodSum['Pembayaran Utang'] || 0);
        const saldoAkhirInventaris = saldoAwal.inventaris + (periodSum['Stok Masuk'] || 0) - (profitPeriodeIni.hpp);
        const saldoAkhirLabaDitahan = saldoAwal.labaDitahan + profitPeriodeIni.labaBersih;
        const saldoAkhirPeralatan = saldoAwal.peralatan + (periodSum['Peralatan'] || 0);
        const saldoAkhirPerlengkapan = saldoAwal.perlengkapan + (periodSum['Perlengkapan'] || 0);
        
        const totalAset = saldoAkhirKas + saldoAkhirPiutang + saldoAkhirPeralatan + saldoAkhirPerlengkapan + saldoAkhirInventaris;
        const totalLiabilitas = saldoAkhirUtang;
        const totalEkuitas = saldoAkhirModal + saldoAkhirLabaDitahan;
        
        res.json({
            asOfDate: endDate,
            aset: { kas: saldoAkhirKas, piutang: saldoAkhirPiutang, peralatan: saldoAkhirPeralatan, perlengkapan: saldoAkhirPerlengkapan, inventaris: saldoAkhirInventaris, total: totalAset },
            liabilitas: { utang: saldoAkhirUtang, total: totalLiabilitas },
            ekuitas: { modal: saldoAkhirModal, labaDitahan: saldoAkhirLabaDitahan, total: totalEkuitas },
            check: { totalAset, totalLiabilitasDanEkuitas: totalLiabilitas + totalEkuitas, selisih: totalAset - (totalLiabilitas + totalEkuitas) },
        });

    } catch (error) {
        console.error("Error fetching balance sheet for period:", error);
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});

router.get('/recap', async (req, res) => {
    const { startDate, endDate, groupBy = 'day', place } = req.query;

    let dateFormat;
    switch (groupBy.toLowerCase()) {
        case 'week':
            dateFormat = `YEARWEEK(created_at, 1)`;
            break;
        case 'month':
            dateFormat = `DATE_FORMAT(created_at, '%Y-%m')`;
            break;
        case 'year':
            dateFormat = `YEAR(created_at)`;
            break;
        default:
            dateFormat = `DATE(created_at)`;
    }

    const checkQuery = `SELECT * FROM reports WHERE report_type = ? AND place = ? AND start_date = ? AND end_date = ? AND status = 'final'`;

    const query = `
        SELECT 
            ${dateFormat} AS period, 
            type,
            description, 
            nominal 
        FROM transactions 
        WHERE created_at BETWEEN ? AND ? AND place = ? 
        ORDER BY created_at
    `;

    try {
        const [existingReports] = await connection.promise().query(checkQuery, ['recap', place, startDate, endDate]);
        if (existingReports.length > 0) {
            return res.status(409).json({
                message: `Laporan untuk periode ${startDate} s/d ${endDate} di ${place} sudah pernah dibuat.`,
                data: existingReports[0]
            });
        }

        const [rows] = await connection.promise().query(query, [startDate, `${endDate} 23:59:59`, place]);

        const summary = rows.reduce((acc, row) => {
            const period = row.period.toString();
            if (!acc[period]) {
                acc[period] = [];
            }
            acc[period].push({
                type: row.type,
                description: row.description,
                nominal: parseFloat(row.nominal)
            });
            return acc;
        }, {});

        res.json(summary);

    } catch (error) {
        console.error("Error fetching recap report:", error);
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});

module.exports = router;