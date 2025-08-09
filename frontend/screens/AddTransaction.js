import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import DropDownPicker from 'react-native-dropdown-picker'
import { useNavigation } from '@react-navigation/native';
import PopUpView from './PopUpView';
import axios from 'axios';
import BackIcon from '../components/BackIcon';
import { useModal } from '../context/ModalContext';
import { Calendar } from 'react-native-calendars';

const postTransaction = async (transactionData) => {
    try {
        await axios.post('http://localhost:3000/reports', transactionData);
    } catch (error) {
        console.error('Error submitting report:', error);
        throw error;
    }
}

const updateProductStock = async (productId, quantity, unit, role) => {
    try {
        const response = await axios.put(`http://localhost:3000/products/update-stock-converted/${productId}`, { quantity, unit, role });
        return response.data;
    } catch (error) {
        console.error('Error updating product stock:', error);
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
}

const updateAccounts = async (id, amount) => {
    try {
        const response = await axios.put(`http://localhost:3000/accounts/${id}`, { amount });
        return response.data;
    } catch (error) {
        console.error('Error updating account:', error);
        throw error;
    }
}

const postAccount = async (accountData) => {
    try {
        const response = await axios.post('http://localhost:3000/accounts', accountData);
        return response.data;
    } catch (error) {
        console.error('Error creating account:', error);
        throw error;
    }
}

const Option_1 = ({ type, selectedProductId, setSelectedProductId, quantity, setQuantity, description, setDescription, products, value, onChangeText, editable, sellingPrice, setSellingPrice, updateProducts, selectedUnit, setSelectedUnit, availableUnits }) => {
    const [productOpen, setProductOpen] = useState(false);
    const [items, setItems] = useState([]);
    const { showModal, hideModal } = useModal();

    const handleAddNew = () => {
        const handleModalClose = () => {
            hideModal();
            updateProducts();
        };
        showModal(<PopUpView onClose={handleModalClose} />);
    };

    useEffect(() => {
        const formattedItems = products.map(item => ({
            label: item.name,
            value: item.product_id,
        }));
        setItems(formattedItems);
    }, [products]);

    const selectedProduct = products.find(p => p.product_id === selectedProductId);

    return (
        <View style={styles.formSection}>
            <Text style={styles.formTitle}>Pilih Barang</Text>
            <DropDownPicker
                open={productOpen}
                value={selectedProductId}
                items={items}
                setOpen={setProductOpen}
                setValue={setSelectedProductId}
                setItems={setItems}
                placeholder="Pilih barang"
                style={styles.inputBox}
                dropDownContainerStyle={styles.inputBox}
                searchable={true}
                zIndex={3000}
                zIndexInverse={1000}
            />

            {selectedProduct && selectedProduct.stock_levels && (
                <View style={styles.stockInfoContainer}>
                    <Text style={styles.stockInfoTitle}>Stok Saat Ini:</Text>
                    {Object.keys(selectedProduct.stock_levels).length > 0 ?
                        Object.entries(selectedProduct.stock_levels).map(([place, stocks]) => (
                            <Text key={place} style={styles.stockInfoText}>
                                {place}: {Object.entries(stocks).map(([unit, stock]) => `${stock} ${unit}`).join(' / ')}
                            </Text>
                        ))
                        : <Text style={styles.stockInfoText}>Stok tidak tersedia</Text>
                    }
                </View>
            )}

            {type === 'Stok Masuk' && (
                <TouchableOpacity onPress={handleAddNew} style={styles.addNewButton}>
                    <Text style={styles.addNewButtonText}>Tambahkan Barang Baru</Text>
                </TouchableOpacity>
            )}

            <View style={styles.quantityRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.formTitle}>Kuantitas</Text>
                    <TextInput
                        style={styles.inputBox}
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="numeric"
                        placeholder="0"
                    />
                </View>
                <View style={{ width: 130, marginLeft: 10 }}>
                    <Text style={styles.formTitle}>Unit</Text>
                    <TouchableOpacity
                        disabled={!selectedProductId || availableUnits.length === 0}
                        onPress={() => {
                            if (!selectedProductId || availableUnits.length === 0) return;
                            const values = availableUnits.map(u => (typeof u === 'string' ? u : u.value));
                            const currentIndex = values.indexOf(selectedUnit);
                            const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % values.length;
                            setSelectedUnit(values[nextIndex]);
                        }}
                        style={[styles.inputBox, (!selectedProductId || availableUnits.length === 0) && styles.disabledInput, { justifyContent: 'center' }]}
                    >
                        <Text style={{ textAlign: 'center', color: '#1e293b', fontSize: 16 }}>
                            {selectedUnit || 'Unit'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.formTitle}>Keterangan</Text>
            <TextInput
                style={styles.inputBox}
                value={description}
                onChangeText={setDescription}
                placeholder="Masukkan deskripsi..."
            />

            {type === 'Penjualan' && (
                <>
                    <Text style={styles.formTitle}>Harga Jual</Text>
                    <TextInput
                        style={styles.inputBox}
                        value={String(sellingPrice)}
                        onChangeText={setSellingPrice}
                        keyboardType="numeric"
                    />
                </>
            )}

            <InputPrice
                value={value}
                onChangeText={onChangeText}
                editable={editable}
            />
        </View>
    );
}

const Option_2 = ({ type, nameId, setNameId, name, setName, names, description, setDescription, notes, setNotes, value, onChangeText, editable, selectedDate, setSelectedDate }) => {
    const [open, setOpen] = useState(false);
    const [availableNames, setAvailableNames] = useState([]);
    useEffect(() => {
        const filterNames = () => {
            setAvailableNames(names.filter(n => n.tipe.toString() == type.slice(11).toUpperCase() && n.status !== 'LUNAS'));
        }
        if (type === 'Pembayaran Utang' || type === 'Pembayaran Piutang') {
            filterNames();
        }
    }, [type, names]);
    return (
        <View style={styles.formSection}>
            {(type === 'Pembayaran Utang' || type === 'Pembayaran Piutang') ?
                <>
                    <Text style={styles.formTitle}>Nama</Text>
                    <DropDownPicker open={open} setOpen={setOpen} value={nameId} items={availableNames.map(n => ({ label: n.name, value: n.id }))} setValue={setNameId} style={styles.inputBox} dropDownContainerStyle={styles.inputBox} placeholder="Pilih nama" searchable={true} zIndex={1000} zIndexInverse={1000} />
                    <Text style={styles.formTitle}>Keterangan</Text>
                    <TextInput style={styles.inputBox} value={description} onChangeText={setDescription} placeholder="Masukkan deskripsi..." />
                </>
                :
                <>
                    {(type === 'Modal' || type === 'Beban Gaji Staff' || type === 'Beban Bonus Staff' || type === 'Uang Makan Staff' || type === 'Perlengkapan' || type === 'Peralatan' || type === 'Biaya Lain Lain') &&
                        <>
                            <Text style={styles.formTitle}>Keterangan</Text>
                            <TextInput style={styles.inputBox} value={description} onChangeText={setDescription} placeholder="Masukkan deskripsi..." />
                        </>
                    }
                    {(type === 'Utang' || type === 'Piutang') && <>
                        <Text style={styles.formTitle}>Nama</Text>
                        <TextInput style={styles.inputBox} value={name} onChangeText={setName} placeholder="Masukkan nama..." />
                        <Text style={styles.formTitle}>Keterangan</Text>
                        <TextInput style={styles.inputBox} value={description} onChangeText={setDescription} placeholder="Masukkan deskripsi..." />
                        <Text style={styles.formTitle}>Catatan</Text>
                        <TextInput style={styles.inputBox} value={notes} onChangeText={setNotes} placeholder="Masukkan catatan..." />
                        <Text style={styles.formTitle}>Jatuh Tempo</Text>
                        <Calendar style={styles.calendar} onDayPress={(day) => {
                            if (day.dateString < new Date().toISOString().split('T')[0]) {
                                return Alert.alert("Error", "Due date cannot be before today.");
                            }
                            setSelectedDate(day.dateString);
                        }} markedDates={{ [selectedDate]: { selected: true, disableTouchEvent: true, selectedColor: '#2563eb' } }} />
                    </>}
                </>
            }
            <InputPrice value={value} onChangeText={onChangeText} editable={editable} />
        </View>
    );
}

const InputPrice = ({ value, onChangeText, editable }) => {
    return (
        <View>
            <Text style={styles.formTitle}>Nominal</Text>
            <TextInput style={[styles.inputBox, !editable && styles.disabledInput]} value={String(value)} onChangeText={onChangeText} editable={editable} keyboardType="numeric" />
        </View>
    );
}

const AddTransaction = ({ route }) => {
    const navigation = useNavigation();
    const { role } = route.params || {};
    const [type, setType] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [nominal, setNominal] = useState('0');
    const [sellingPrice, setSellingPrice] = useState('0');
    const [names, setNames] = useState([]);
    const [nameId, setNameId] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [open, setOpen] = useState(false);
    const [transactionTypes] = useState([
        { label: 'Modal', value: 'Modal' },
        { label: 'Penjualan', value: 'Penjualan' },
        { label: 'Pembelian', value: 'Stok Masuk' },
        { label: 'Utang', value: 'Utang' },
        { label: 'Piutang', value: 'Piutang' },
        { label: 'Pembayaran Utang', value: 'Pembayaran Utang' },
        { label: 'Pembayaran Piutang', value: 'Pembayaran Piutang' },
        { label: 'Gaji Karyawan', value: 'Beban Gaji Staff' },
        { label: 'Bonus Karyawan', value: 'Beban Bonus Staff' },
        { label: 'Uang Makan Karyawan', value: 'Uang Makan Staff' },
        { label: 'Perlengkapan', value: 'Perlengkapan' },
        { label: 'Peralatan', value: 'Peralatan' },
        { label: 'Biaya Lain Lain', value: 'Biaya Lain Lain' },
        { label: 'Pindah Stok Barang', value: 'Pindah Stok Barang' },
    ]);

    const [products, setProducts] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [availableUnits, setAvailableUnits] = useState([]);

    const fetchProducts = async (transactionType) => {
        let endpoint = 'http://localhost:3000/products';
        if (transactionType === 'Penjualan' || transactionType === 'Pindah Stok Barang') {
            endpoint = 'http://localhost:3000/products/availableProducts';
        }

        try {
            let roleName = role === '1' ? 'Toko' : 'Gudang';
            const response = await axios.get(endpoint, { params: { place: roleName } });
            setProducts(response.data);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
        }
    };

    useEffect(() => {
        if (type === 'Penjualan' || type === 'Stok Masuk' || type === 'Pindah Stok Barang') {
            fetchProducts(type);
        } else {
            setProducts([]);
        }
    }, [type]);

    useEffect(() => {
        if (selectedProductId) {
            const product = products.find(p => p.product_id === selectedProductId);
            if (product && product.units) {
                try {
                    const unitsArray = typeof product.units === 'string' ? JSON.parse(product.units) : product.units;
                    if (Array.isArray(unitsArray)) {
                        setAvailableUnits(unitsArray.map(u => ({ label: u, value: u })));
                        if (unitsArray.length > 0) {
                            setSelectedUnit(unitsArray[0]);
                        } else {
                            setSelectedUnit(null);
                        }
                    } else {
                        setAvailableUnits([]);
                        setSelectedUnit(null);
                    }
                } catch (e) {
                    console.error("Gagal mem-parsing unit produk:", e);
                    setAvailableUnits([]);
                    setSelectedUnit(null);
                }
            } else {
                setAvailableUnits([]);
                setSelectedUnit(null);
            }
        } else {
            setAvailableUnits([]);
            setSelectedUnit(null);
        }
    }, [selectedProductId, products]);


    useEffect(() => {
        const fetchNames = async () => {
            try {
                const response = await axios.get('http://localhost:3000/accounts', { params: { place: role === '1' ? 'Toko' : 'Gudang' } });
                setNames(response.data);
            } catch (error) {
                console.error('Error fetching names:', error);
            }
        }
        if (type === 'Pembayaran Utang' || type === 'Pembayaran Piutang') {
            fetchNames();
        } else {
            setNames([]);
        }
    }, [type]);

    useEffect(() => {
        if (type === 'Penjualan' && selectedProductId) {
            const product = products.find(p => p.product_id === selectedProductId);
            if (product) {
                setSellingPrice(String(product.selling_price));
            }
        } else {
            setSellingPrice('0');
        }
    }, [selectedProductId, type, products]);

    useEffect(() => {
        if (type === 'Penjualan' || type === 'Stok Masuk') {
            const selectedProduct = products.find(p => p.product_id === selectedProductId);
            if (selectedProduct && quantity && parseFloat(quantity) > 0) {
                const price = type === 'Penjualan' ? sellingPrice : selectedProduct.purchase_price;
                const newTotal = parseFloat(quantity) * parseFloat(price || '0');
                setNominal(String(newTotal));
            } else {
                setNominal('0');
            }
        }
    }, [selectedProductId, quantity, type, products, sellingPrice]);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const response = await axios.get('http://localhost:3000/accounts', { params: { place: role === '1' ? 'Toko' : 'Gudang' } });
                setAccounts(response.data);
            } catch (error) {
                console.error('Error fetching accounts:', error);
            }
        }
        if (type === 'Pembayaran Utang' || type === 'Pembayaran Piutang') {
            fetchAccounts();
        }
    }, [type]);

    // Tambahkan state untuk warna berdasarkan role
    const [pageColor, setPageColor] = useState('#f0f9ff');
    const [formColor, setFormColor] = useState('#ffffff');

    useEffect(() => {
        if (role === '1') {
            setPageColor('#e6f9ed'); // Toko hijau
            setFormColor('#c6f6d5');
        } else if (role === '2') {
            setPageColor('#f3e8ff'); // Gudang ungu
            setFormColor('#e9d5ff');
        }
    }, [role]);

    const handleBack = () => {
        navigation.goBack();
    }

    const handleSubmit = async () => {
        if (!type) {
            Alert.alert("Incomplete Form", "Please select the Transaction Type first.");
            return;
        }

        if (type === 'Stok Masuk' || type === 'Penjualan' || type === 'Pindah Stok Barang') {
            if (!selectedProductId) {
                Alert.alert("Incomplete Form", "Please select a Product first.");
                return;
            }
            if (!quantity || parseFloat(quantity) <= 0) {
                Alert.alert("Incomplete Form", "Please enter a valid Quantity.");
                return;
            }
            if (!selectedUnit) {
                Alert.alert("Incomplete Form", "Please select a Unit.");
                return;
            }
            if (!description.trim()) {
                Alert.alert("Incomplete Form", "Please enter a Description.");
                return;
            }
            if (type === 'Penjualan' && (!sellingPrice || parseFloat(sellingPrice) <= 0)) {
                Alert.alert("Incomplete Form", "Please enter a valid Selling Price.");
                return;
            }
        } else if (type === 'Utang' || type === 'Piutang') {
            if (!name.trim()) {
                Alert.alert("Incomplete Form", "Please enter a Name.");
                return;
            }
            if (!description.trim()) {
                Alert.alert("Incomplete Form", "Please enter a Description.");
                return;
            }
            if (!nominal || parseFloat(nominal) <= 0) {
                Alert.alert("Incomplete Form", "Please enter a valid Amount.");
                return;
            }
            if (!selectedDate) {
                Alert.alert("Incomplete Form", "Please select a Due Date.");
                return;
            }
        } else if (type === 'Pembayaran Utang' || type === 'Pembayaran Piutang') {
            if (!nameId) {
                Alert.alert("Incomplete Form", "Please select a Name.");
                return;
            }
            if (!description.trim()) {
                Alert.alert("Incomplete Form", "Please enter a Description.");
                return;
            }
            if (!nominal || parseFloat(nominal) <= 0) {
                Alert.alert("Incomplete Form", "Please enter a valid Amount.");
                return;
            }
        } else if (type === 'Modal' || type === 'Beban Gaji Staff' || type === 'Beban Bonus Staff' || type === 'Uang Makan Staff' || type === 'Perlengkapan' || type === 'Peralatan' || type === 'Biaya Lain Lain') {
            if (!description.trim()) {
                Alert.alert("Incomplete Form", "Please enter a Description.");
                return;
            }
            if (!nominal || parseFloat(nominal) <= 0) {
                Alert.alert("Incomplete Form", "Please enter a valid Amount.");
                return;
            }
        }

        try {
            const selectedProduct = products.find(product => product.product_id === selectedProductId);
            let personNameForReport = name;
            if (type === 'Pembayaran Utang' || type === 'Pembayaran Piutang') {
                const selectedPerson = names.find(person => person.id === nameId);
                if (selectedPerson) {
                    personNameForReport = selectedPerson.nama;
                }
            }

            const transactionData = {
                type: type,
                name: (type === 'Utang' || type === 'Piutang' || type === 'Pembayaran Utang' || type === 'Pembayaran Piutang') ? personNameForReport : null,
                product_name: (type === "Penjualan" || type === "Stok Masuk") ? selectedProduct?.name : null,
                description: description,
                place: role === '1' ? 'Toko' : 'Gudang',
                quantity: (type === 'Penjualan' || type === 'Stok Masuk') ? parseInt(quantity) : null,
                unit: (type === 'Penjualan' || type === 'Stok Masuk') ? selectedUnit : null,
                nominal: parseFloat(nominal),
            };

            if (type === 'Penjualan') {
                const stokKeluar = {
                    type: "Stok Keluar",
                    name: null,
                    product_name: selectedProduct?.name,
                    description: description,
                    place: role === '1' ? 'Toko' : 'Gudang',
                    quantity: parseInt(quantity),
                    unit: selectedUnit,
                    nominal: parseInt(quantity) * parseFloat(selectedProduct.purchase_price),
                }

                await updateProductStock(selectedProductId, -parseInt(quantity), selectedUnit, role);
                await postTransaction(transactionData);
                await postTransaction(stokKeluar);
            }
            else if (type === 'Stok Masuk') {
                if (!selectedProduct) return Alert.alert("Error", "Please select a product first.");
                if (!selectedUnit) return Alert.alert("Error", "Please select a unit.");
                if (!quantity || parseInt(quantity) <= 0) return Alert.alert("Error", "Invalid quantity.");
                await updateProductStock(selectedProductId, parseInt(quantity), selectedUnit, role);
                await postTransaction(transactionData);
            } else if (type === 'Utang' || type === 'Piutang') {
                const accountData = {
                    nama: name,
                    tipe: type.toUpperCase(),
                    deskripsi: description,
                    nominal_total: nominal,
                    tanggal_transaksi: new Date().toISOString().split('T')[0],
                    jatuh_tempo: selectedDate,
                    catatan: notes,
                    place: role === '1' ? 'Toko' : 'Gudang',
                };
                await postAccount(accountData);
                await postTransaction(transactionData);
            } else if (type === 'Pembayaran Utang' || type === 'Pembayaran Piutang') {
                const selectedAccount = accounts.find(account => account.id === nameId);
                if (!selectedAccount) {
                    return Alert.alert("Error", "Selected account not found. Please refresh.");
                }
                if (selectedAccount.sisa_tagihan - nominal >= 0) {
                    await updateAccounts(nameId, nominal);
                } else {
                    return Alert.alert("Error", "Payment exceeds the outstanding amount.", [{ text: 'OK' }]);
                }
                await postTransaction(transactionData);
            } else if (type === 'Modal' || type === 'Beban Gaji Staff' || type === 'Beban Bonus Staff' || type === 'Uang Makan Staff' || type === 'Perlengkapan' || type === 'Peralatan' || type === 'Biaya Lain Lain') {
                await postTransaction(transactionData);
            } else if (type === 'Pindah Stok Barang') {
                const productToMove = products.find(p => p.product_id === selectedProductId);
                const fromPlace = role === '1' ? 'Toko' : 'Gudang';
                const availableStock = productToMove.stock_levels?.[fromPlace]?.[selectedUnit] || 0;

                if (parseFloat(quantity) > availableStock) {
                    return Alert.alert("Error", `Insufficient stock. Available ${selectedUnit} in ${fromPlace}: ${availableStock}.`);
                }

                const toPlace = fromPlace === 'Toko' ? 'Gudang' : 'Toko';

                const transferData = {
                    productId: selectedProductId,
                    quantity: parseFloat(quantity),
                    unit: selectedUnit,
                    fromPlace: fromPlace,
                    toPlace: toPlace,
                };

                await axios.post('http://localhost:3000/products/transfer-stock', transferData);
            }
            Alert.alert("Success", "Report has been added successfully!");
            navigation.goBack();
        } catch (error) {
            console.error('Failed to submit report:', error);
            Alert.alert("Error", error.message || "An error occurred. Please try again.");
        }
    };

    return (
        <View style={[styles.pageContainer, { backgroundColor: pageColor }]}>
            <ScrollView>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <BackIcon />
                </TouchableOpacity>
                <View>
                    <Text style={styles.formTitle}>Jenis Transaksi</Text>
                    <DropDownPicker
                        open={open}
                        value={type}
                        items={transactionTypes}
                        setOpen={setOpen}
                        setValue={(callback) => {
                            setType(callback(type));
                            setSelectedProductId(null);
                            setQuantity('');
                            setNominal('0');
                        }}
                        style={styles.inputBox}
                        dropDownContainerStyle={styles.inputBox}
                        placeholder="Pilih Jenis Transaksi"
                        zIndex={4000}
                        zIndexInverse={1000}
                    />

                    {type != null && (
                        <>
                            {(type === 'Modal' || type === 'Utang' || type === 'Piutang' || type === 'Pembayaran Utang' || type === 'Pembayaran Piutang' || type === 'Beban Gaji Staff' || type === 'Beban Bonus Staff' || type === 'Uang Makan Staff' || type === 'Perlengkapan' || type === 'Peralatan' || type === 'Biaya Lain Lain') && (
                                <Option_2
                                    type={type}
                                    nameId={nameId}
                                    setNameId={setNameId}
                                    name={name}
                                    setName={setName}
                                    names={names}
                                    description={description}
                                    setDescription={setDescription}
                                    notes={notes}
                                    setNotes={setNotes}
                                    value={nominal}
                                    onChangeText={setNominal}
                                    editable={true}
                                    selectedDate={selectedDate}
                                    setSelectedDate={setSelectedDate}
                                />
                            )}

                            {(type === 'Stok Masuk' || type === "Penjualan" || type === "Pindah Stok Barang") && (
                                <Option_1
                                    type={type}
                                    selectedProductId={selectedProductId}
                                    setSelectedProductId={setSelectedProductId}
                                    quantity={quantity}
                                    setQuantity={setQuantity}
                                    description={description}
                                    setDescription={setDescription}
                                    products={products}
                                    value={nominal}
                                    onChangeText={setNominal}
                                    editable={false}
                                    sellingPrice={sellingPrice}
                                    setSellingPrice={setSellingPrice}
                                    updateProducts={() => fetchProducts(type)}
                                    selectedUnit={selectedUnit}
                                    setSelectedUnit={setSelectedUnit}
                                    availableUnits={availableUnits}
                                />
                            )}
                        </>
                    )}
                </View>
            </ScrollView>
            <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
                <Text style={styles.submitButtonText}>Simpan Transaksi</Text>
            </TouchableOpacity>
        </View>
    )
}

export default AddTransaction

const styles = StyleSheet.create({
    pageContainer: {
        flex: 1,
        backgroundColor: '#f0f9ff',
        padding: 20,
        justifyContent: 'space-between',
        overflow: 'visible',
    },
    backButton: {
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a365d',
        marginTop: 10,
        marginBottom: 20,
    },
    formSection: {
        marginVertical: 10,
    },
    formTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a365d',
        marginBottom: 8,
        marginTop: 12,
    },
    inputBox: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#93c5fd',
        borderRadius: 12,
        paddingHorizontal: 15,
        minHeight: 50,
        width: '100%',
        color: '#1e293b',
        fontSize: 16,
    },
    disabledInput: {
        backgroundColor: '#f1f5f9',
        color: '#64748b',
    },
    submitButton: {
        backgroundColor: '#1d4ed8',
        paddingVertical: 15,
        alignItems: 'center',
        borderRadius: 12,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    submitButtonText: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    addNewButton: {
        backgroundColor: '#dbeafe',
        paddingVertical: 15,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#93c5fd',
        marginTop: 10,
    },
    addNewButtonText: {
        color: '#1e40af',
        fontWeight: '600',
    },
    calendar: {
        borderWidth: 1,
        borderColor: '#93c5fd',
        borderRadius: 12,
    },
    quantityRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        zIndex: 0,
    },
    stockInfoContainer: {
        backgroundColor: '#dbeafe',
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#93c5fd',
    },
    stockInfoTitle: {
        fontWeight: '600',
        color: '#1e40af',
        fontSize: 14,
    },
    stockInfoText: {
        color: '#1e40af',
        fontSize: 14,
        marginTop: 2,
    }
});