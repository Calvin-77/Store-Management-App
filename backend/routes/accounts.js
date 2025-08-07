const { format } = require('date-fns');
const express = require('express');
const router = express.Router();

const connection = require('./connect');

router.get('/', (req, res) => {
    const { place } = req.query;
    const query = 'SELECT * FROM accounts WHERE place = ?';

    const formatData = (data) => {
        return data.map(item => ({
            ...item,
            tanggal_transaksi: item.tanggal_transaksi ? format(new Date(item.tanggal_transaksi), 'dd/MM/yyyy') : null,
            created_at: item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy HH:mm:ss') : null,
            updated_at: item.updated_at ? format(new Date(item.updated_at), 'dd/MM/yyyy HH:mm:ss') : null
        }));
    };

    connection.query(query, [place], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "Terjadi kesalahan pada server." });
        }

        const formattedResult = formatData(result);
        res.status(200).json(formattedResult);
    })
});

router.post('/', (req, res) => {
    const {
        nama,
        tipe,
        deskripsi,
        nominal_total,
        place,
        tanggal_transaksi,
        jatuh_tempo,
        catatan,
    } = req.body;

    const sisa_tagihan = nominal_total;
    const status = 'BELUM LUNAS';

    const query = `
        INSERT INTO accounts 
        (name, tipe, deskripsi, nominal_total, sisa_tagihan, place, tanggal_transaksi, jatuh_tempo, status, catatan) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        nama,
        tipe,
        deskripsi || null,
        nominal_total,
        sisa_tagihan,
        place,
        tanggal_transaksi,
        jatuh_tempo,
        status,
        catatan || null,
    ];

    connection.query(query, values, (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "Gagal menambahkan data.", error: err.message });
        }
        
        res.status(201).json({
            message: "Data berhasil ditambahkan.",
            id: result.insertId
        });
    });
});

router.put('/:id', (req, res) => {
    const data = req.body;
    const id = req.params.id
    const query = 'UPDATE accounts SET sisa_tagihan = sisa_tagihan - ? WHERE id = ?';

    connection.query(query, [data.amount, id], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "Terjadi kesalahan pada server." });
        }
        res.status(200).json(result.affectedRows);
    });
});

module.exports = router;