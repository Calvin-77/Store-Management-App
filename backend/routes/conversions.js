const express = require('express');
const router = express.Router();
const connection = require('./connect');

// membuat aturan konversi untuk sebuah produk
router.post('/', async (req, res) => {
    const { productId, conversions } = req.body;

    if (!productId || !Array.isArray(conversions) || conversions.length === 0) {
        return res.status(400).json({ message: "Product ID dan data konversi (array) diperlukan." });
    }

    try {
        const promiseConnection = connection.promise();

        await promiseConnection.beginTransaction();
        await promiseConnection.query("DELETE FROM conversions WHERE product_id = ?", [productId]);

        const insertQuery = "INSERT INTO conversions (product_id, from_unit, to_unit, multiplier) VALUES ?";
        
        const values = conversions.map(conv => [
            productId,
            conv.from_unit,
            conv.to_unit,
            conv.multiplier
        ]);

        await promiseConnection.query(insertQuery, [values]);

        await promiseConnection.commit();

        res.status(201).json({ message: "Aturan konversi berhasil disimpan." });

    } catch (error) {
        await connection.promise().rollback();
        console.error("Database Error:", error);
        res.status(500).json({ message: 'Gagal menyimpan aturan konversi.', error: error.message });
    }
});

module.exports = router;
