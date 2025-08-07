var express = require('express');
var router = express.Router();
var connection = require('./connect');

// Menambah produk baru
router.post('/', (req, res) => {
    const data = req.body;

    const query = 'INSERT INTO products (sku, name, description, purchase_price, selling_price, min_stock_level, units) VALUES (?, ?, ?, ?, ?, ?, ?)';

    const values = [
        data.sku,
        data.name,
        data.description,
        data.purchase_price,
        data.selling_price,
        data.min_stock_level,
        data.units,
    ];

    connection.query(query, values, (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "Gagal menyimpan produk.", error: err.message });
        }
        res.status(201).json({ message: 'Produk berhasil dibuat.', productId: result.insertId });
    });
});

// Fetch semua produk
router.get('/', (req, res) => {
    const query = 'SELECT * FROM products';
    connection.query(query, (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "Terjadi kesalahan pada server." });
        }
        res.status(200).json(result);
    });
});

router.get('/availableProducts', (req, res) => {
    const { place } = req.query;

    const query = `
        SELECT 
            p.*,
            ps.place,
            ps.stock_levels
        FROM 
            products p
        LEFT JOIN 
            products_stocks ps ON p.product_id = ps.product_id
        WHERE
            ps.place = ?
    `;
    connection.query(query, [place], (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "Terjadi kesalahan pada server." });
        }

        const productsMap = new Map();
        results.forEach(row => {
            const { product_id, place, stock_levels, ...productData } = row;
            if (!productsMap.has(product_id)) {
                productsMap.set(product_id, {
                    ...productData,
                    product_id: product_id,
                    stock_levels: {}
                });
            }
            if (place && stock_levels) {
                try {
                    productsMap.get(product_id).stock_levels[place] = JSON.parse(stock_levels);
                } catch (e) {
                    console.error(`Invalid JSON for product ${product_id} in place ${place}`);
                }
            }
        });

        const finalProducts = Array.from(productsMap.values());
        res.status(200).json(finalProducts);
    });
});

// Fetch produk berdasarkan id
router.get('/:id', (req, res) => {
    const id = req.params.id;
    const query = 'SELECT * FROM products WHERE product_id = ?';
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "Terjadi kesalahan pada server." });
        }
        res.status(200).json(result);
    });
});

// Update stock produk dengan konversi unit
router.put('/update-stock-converted/:id', async (req, res) => {
    const { id } = req.params;
    const { quantity, unit, role } = req.body;
    const transactionAmount = parseInt(quantity, 10);
    const place = role === '1' ? 'Toko' : 'Gudang';

    if (isNaN(transactionAmount) || !unit) {
        return res.status(400).json({ message: "Kuantitas dan unit diperlukan." });
    }

    try {
        const promiseConnection = connection.promise();

        const checkQuery = "SELECT COUNT(*) AS count FROM products WHERE product_id = ?";
        const [checkRows] = await promiseConnection.query(checkQuery, [id]);

        if (checkRows[0].count === 0) {
            return res.status(404).json({ message: "Produk tidak ditemukan." });
        }

        const productQuery = "SELECT stock_levels FROM products_stocks WHERE product_id = ? AND place = ?";
        const conversionQuery = "SELECT from_unit, to_unit, multiplier FROM conversions WHERE product_id = ?";

        let [productRows] = await promiseConnection.query(productQuery, [id, place]);
        const [conversionRows] = await promiseConnection.query(conversionQuery, [id]);

        let currentStockLevels = {};
        if (productRows.length > 0 && productRows[0].stock_levels) {
            try {
                currentStockLevels = JSON.parse(productRows[0].stock_levels);
            } catch (e) {
                console.error(`Invalid JSON in stock_levels for product_id ${id}:`, productRows[0].stock_levels);
                currentStockLevels = {};
            }
        } else if (productRows.length === 0) {
            await promiseConnection.query("INSERT INTO products_stocks (product_id, place, stock_levels) VALUES (?, ?, ?)", [id, place, '{}']);
        }

        if (conversionRows.length === 0) {
            return res.status(400).json({ message: "Aturan konversi untuk produk ini tidak ditemukan." });
        }

        const baseUnitRule = conversionRows.find(c => c.from_unit === c.to_unit);
        if (!baseUnitRule) {
            return res.status(400).json({ message: "Unit dasar tidak ditemukan untuk produk ini." });
        }

        const baseUnit = baseUnitRule.to_unit;
        const conversionRule = conversionRows.find(c => c.from_unit === unit);
        if (!conversionRule) {
            return res.status(400).json({ message: `Unit '${unit}' tidak valid untuk produk ini.` });
        }

        const amountInBaseUnit = transactionAmount * conversionRule.multiplier;
        const currentBaseStock = currentStockLevels[baseUnit] || 0;

        if (transactionAmount < 0 && currentBaseStock < Math.abs(amountInBaseUnit)) {
            return res.status(400).json({ message: `Stok tidak cukup. Stok ${baseUnit} tersisa: ${currentBaseStock}` });
        }

        const newBaseStock = currentBaseStock + amountInBaseUnit;
        const newStockLevels = {};

        conversionRows.forEach(rule => {
            newStockLevels[rule.from_unit] = Math.floor(newBaseStock / rule.multiplier);
        });

        const updateQuery = "UPDATE products_stocks SET stock_levels = ? WHERE product_id = ? AND place = ?";
        await promiseConnection.query(updateQuery, [JSON.stringify(newStockLevels), id, place]);

        res.status(200).json({ message: "Stok berhasil diperbarui.", newStockLevels });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: error.message });
    }
});

// Update produk berdasarkan id
router.put('/:id', (req, res) => {
    const data = req.body;
    const id = req.params.id;
    const query = 'UPDATE products SET purchase_price = ?, selling_price = ? WHERE product_id = ?';

    connection.query(query, [data.purchase_price, data.selling_price, id], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: "Terjadi kesalahan pada server." });
        }
        res.status(200).json({ affectedRows: result.affectedRows });
    });
});

// Memindahkan tempat menyimpan produk
router.post('/transfer-stock', async (req, res) => {
    const { productId, quantity, unit, fromPlace, toPlace } = req.body;
    const numQuantity = parseFloat(quantity);

    if (!productId || !numQuantity || !unit || !fromPlace || !toPlace || numQuantity <= 0) {
        return res.status(400).json({ message: "Data tidak lengkap atau tidak valid." });
    }

    const promiseConnection = connection.promise();

    try {
        const updateStockWithConversion = async (pId, qty, u, plc) => {
            const [conversionRows] = await promiseConnection.query("SELECT from_unit, to_unit, multiplier FROM conversions WHERE product_id = ?", [pId]);
            if (conversionRows.length === 0) throw new Error("Aturan konversi untuk produk ini tidak ditemukan.");

            const baseUnitRule = conversionRows.find(c => c.from_unit === c.to_unit);
            if (!baseUnitRule) throw new Error("Unit dasar (e.g., Pcs -> Pcs) tidak ditemukan.");

            const baseUnit = baseUnitRule.to_unit;
            const conversionRule = conversionRows.find(c => c.from_unit === u);
            if (!conversionRule) throw new Error(`Unit '${u}' tidak valid untuk produk ini.`);

            const [stockRows] = await promiseConnection.query("SELECT stock_levels FROM products_stocks WHERE product_id = ? AND place = ?", [pId, plc]);
            
            let currentStockLevels = {};
            if (stockRows.length > 0 && stockRows[0].stock_levels) {
                currentStockLevels = JSON.parse(stockRows[0].stock_levels);
            } else if (stockRows.length === 0) {
                await promiseConnection.query("INSERT INTO products_stocks (product_id, place, stock_levels) VALUES (?, ?, ?)", [pId, plc, '{}']);
            }
            
            const amountInBaseUnit = qty * conversionRule.multiplier;
            const currentBaseStock = currentStockLevels[baseUnit] || 0;

            if (qty < 0 && currentBaseStock < Math.abs(amountInBaseUnit)) {
                const availableInUnit = currentBaseStock / conversionRule.multiplier;
                throw new Error(`Stok tidak cukup di ${plc}. Sisa: ${Math.floor(availableInUnit)} ${u}`);
            }

            const newBaseStock = currentBaseStock + amountInBaseUnit;

            const newStockLevels = {};
            conversionRows.forEach(rule => {
                newStockLevels[rule.from_unit] = Math.floor(newBaseStock / rule.multiplier);
            });

            await promiseConnection.query("UPDATE products_stocks SET stock_levels = ? WHERE product_id = ? AND place = ?", [JSON.stringify(newStockLevels), pId, plc]);
        };

        await updateStockWithConversion(productId, -numQuantity, unit, fromPlace);

        await updateStockWithConversion(productId, numQuantity, unit, toPlace);
        
        const [pRows] = await promiseConnection.query('SELECT name FROM products WHERE product_id = ?', [productId]);
        const productName = pRows[0]?.name || 'N/A';
        const tQuery = 'INSERT INTO transactions (type, product_name, description, place, quantity, unit, nominal) VALUES ?';
        const tLogs = [
            ['Stok Keluar', productName, `Transfer ke ${toPlace}`, fromPlace, numQuantity, unit, 0],
            ['Stok Masuk', productName, `Transfer dari ${fromPlace}`, toPlace, numQuantity, unit, 0]
        ];
        await promiseConnection.query(tQuery, [tLogs]);

        res.status(200).json({ message: `Transfer stok berhasil dicatat.` });

    } catch (error) {
        console.error("Error during stock transfer:", error);
        res.status(500).json({ message: error.message || "Terjadi kesalahan pada server." });
    }
});

module.exports = router;
