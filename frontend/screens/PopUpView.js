import { StyleSheet, View, TextInput, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Formik } from 'formik';
import * as yup from 'yup';
import axios from 'axios';
import BackIcon from '../components/BackIcon';

const postProduct = async (values) => {
    try {
        const response = await axios.post('http://localhost:3000/products', values);
        return response.data;
    } catch (error) {
        console.error('Error posting product:', error);
        throw error;
    }
}

const UnitChecklist = ({ selectedUnits, onToggleUnit }) => {
    const availableUnits = ['Pcs', 'Lusin', 'Karton', 'Pack', 'Box', 'Gram', 'Kg'];
    return (
        <View>
            <View style={{ flexDirection: 'row', width: 'auto' }}>
                <Text style={styles.formTitle}>Unit Barang</Text>
                <Text style={{ color: '#475569', marginTop: 20, marginLeft: 12, fontSize: 8 }}>Pilih Base Unit terlebih dahulu</Text>
            </View>
            <View style={styles.checklistContainer}>
                {availableUnits.map((unit) => {
                    const isSelected = selectedUnits.includes(unit);
                    return (
                        <TouchableOpacity
                            key={unit}
                            style={[styles.checklistItem, isSelected && styles.checklistItem_selected]}
                            onPress={() => onToggleUnit(unit)}
                        >
                            <Text style={[styles.checklistText, isSelected && styles.checklistText_selected]}>
                                {unit}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const PopUpView = ({ onClose }) => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get('http://localhost:3000/products');
                setData(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                Alert.alert('Error', 'Gagal memuat data produk.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const inputValidation = useMemo(() => {
        return yup.object().shape({
            sku: yup.string().required('SKU tidak boleh kosong').test('SKU harus unik', 'SKU harus unik', (value) => !data.some(item => item.sku === value)),
            name: yup.string().required('Nama tidak boleh kosong'),
            description: yup.string().required('Deskripsi tidak boleh kosong'),
            purchase_price: yup.number().typeError('Harga beli harus angka').required('Harga beli tidak boleh kosong'),
            selling_price: yup.number().typeError('Harga jual harus angka').required('Harga jual tidak boleh kosong'),
            min_stock_level: yup.number().typeError('Stok minimum harus angka').required('Level stok tidak boleh kosong'),
            units: yup.array().of(yup.string()).min(1, 'Pilih minimal satu unit barang.'),
            conversions: yup.object(),
        });
    }, [data]);

    return (
        <View style={styles.overlay}>
            <View style={styles.popupContainer}>
                <View style={styles.headerContainer}>
                    <TouchableOpacity onPress={() => onClose()} style={styles.backButton}>
                        <BackIcon />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Produk Baru</Text>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {isLoading ? (
                        <ActivityIndicator size="large" color="#2563eb" />
                    ) : (
                        <Formik
                            initialValues={{
                                sku: '', name: '', description: '', purchase_price: '', selling_price: '', min_stock_level: '',
                                units: [], baseUnit: '', conversions: {}
                            }}
                            validationSchema={inputValidation}
                            onSubmit={async (values, { resetForm }) => {
                                try {
                                    const base = values.baseUnit || values.units[0];

                                    const initialStockLevels = values.units.reduce((acc, unit) => {
                                        acc[unit] = 0;
                                        return acc;
                                    }, {});

                                    const productPayload = {
                                        sku: values.sku,
                                        name: values.name,
                                        description: values.description,
                                        purchase_price: values.purchase_price,
                                        selling_price: values.selling_price,
                                        min_stock_level: values.min_stock_level,
                                        units: JSON.stringify(values.units),
                                        stock_levels: initialStockLevels,
                                    };

                                    const productResponse = await postProduct(productPayload);
                                    const newProductId = productResponse.productId;

                                    const conversionsPayload = [
                                        { from_unit: base, to_unit: base, multiplier: 1 }
                                    ];

                                    Object.keys(values.conversions).forEach(unit => {
                                        const multiplier = parseInt(values.conversions[unit], 10);
                                        if (multiplier > 0) {
                                            conversionsPayload.push({
                                                from_unit: unit,
                                                to_unit: base,
                                                multiplier: multiplier
                                            });
                                        }
                                    });

                                    if (conversionsPayload.length > 1) {
                                        await axios.post('http://localhost:3000/conversions', {
                                            productId: newProductId,
                                            conversions: conversionsPayload
                                        });
                                    }

                                    Alert.alert("Sukses", `Barang "${values.name}" berhasil ditambahkan!`);
                                    resetForm();
                                    onClose();
                                } catch (error) {
                                    Alert.alert('Error', 'Gagal menambahkan barang. Silakan coba lagi.');
                                }
                            }}
                        >
                            {({ handleChange, handleBlur, handleSubmit, errors, touched, values, setFieldValue }) => {
                                useEffect(() => {
                                    const isKgToGram = values.baseUnit === 'Gram' && values.units.includes('Kg');

                                    if (isKgToGram) {
                                        setFieldValue('conversions.Kg', '1000'); // ini adalah fungsi dari formik, untuk mengatur nilai dalam form
                                    }
                                }, [values.units, values.baseUnit, setFieldValue]);

                                const handleToggleUnit = (unit) => {
                                    const currentUnits = [...values.units];
                                    const unitIndex = currentUnits.indexOf(unit);
                                    if (unitIndex > -1) {
                                        currentUnits.splice(unitIndex, 1);
                                    } else {
                                        currentUnits.push(unit);
                                    }
                                    setFieldValue('units', currentUnits);
                                    setFieldValue('baseUnit', currentUnits.length > 0 ? currentUnits[0] : '');
                                };

                                return (
                                    <View>
                                        <Text style={styles.formTitle}>SKU</Text>
                                        <TextInput style={styles.inputBox} placeholder="Enter SKU" onChangeText={handleChange('sku')} onBlur={handleBlur('sku')} value={values.sku} />
                                        {touched.sku && errors.sku && <Text style={styles.errorText}>{errors.sku}</Text>}

                                        <Text style={styles.formTitle}>Nama Produk</Text>
                                        <TextInput style={styles.inputBox} placeholder="Masukkan nama produk" onChangeText={handleChange('name')} onBlur={handleBlur('name')} value={values.name} />
                                        {touched.name && errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                                        <UnitChecklist selectedUnits={values.units} onToggleUnit={handleToggleUnit} />
                                        {touched.units && errors.units && <Text style={styles.errorText}>{errors.units}</Text>}

                                        {values.units.length > 1 && (
                                            <View style={styles.conversionSection}>
                                                <Text style={styles.formTitle}>Atur Konversi Unit</Text>

                                                {values.baseUnit && values.units.map(unit => {
                                                    if (unit === values.baseUnit) return null;
                                                    return (
                                                        <View key={unit} style={styles.conversionInputRow}>
                                                            <Text style={styles.conversionLabel}>1 {unit} =</Text>
                                                            <TextInput
                                                                style={[styles.inputBox, styles.conversionInput]}
                                                                keyboardType="numeric"
                                                                placeholder="Jumlah"
                                                                onChangeText={handleChange(`conversions.${unit}`)}
                                                                onBlur={handleBlur(`conversions.${unit}`)}
                                                                value={values.conversions[unit] || ''}
                                                            />
                                                            <Text style={styles.conversionLabel}>{values.baseUnit}</Text>
                                                        </View>
                                                    )
                                                })}
                                            </View>
                                        )}

                                        <Text style={styles.formTitle}>Deskripsi</Text>
                                        <TextInput style={styles.inputBox} placeholder="Masukkan deskripsi produk" onChangeText={handleChange('description')} onBlur={handleBlur('description')} value={values.description} />
                                        {touched.description && errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

                                        <Text style={styles.formTitle}>Harga Beli</Text>
                                        <TextInput style={styles.inputBox} placeholder="e.g., 10000" keyboardType="numeric" onChangeText={handleChange('purchase_price')} onBlur={handleBlur('purchase_price')} value={values.purchase_price} />
                                        {touched.purchase_price && errors.purchase_price && <Text style={styles.errorText}>{errors.purchase_price}</Text>}

                                        <Text style={styles.formTitle}>Harga Jual</Text>
                                        <TextInput style={styles.inputBox} placeholder="e.g., 12000" keyboardType="numeric" onChangeText={handleChange('selling_price')} onBlur={handleBlur('selling_price')} value={values.selling_price} />
                                        {touched.selling_price && errors.selling_price && <Text style={styles.errorText}>{errors.selling_price}</Text>}

                                        <Text style={styles.formTitle}>Minimum Level Stock (Unit Dasar)</Text>
                                        <TextInput style={styles.inputBox} placeholder="e.g., 5" keyboardType="numeric" onChangeText={handleChange('min_stock_level')} onBlur={handleBlur('min_stock_level')} value={values.min_stock_level} />
                                        {touched.min_stock_level && errors.min_stock_level && <Text style={styles.errorText}>{errors.min_stock_level}</Text>}

                                        <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
                                            <Text style={styles.submitButtonText}>Simpan Produk</Text>
                                        </TouchableOpacity>
                                    </View>
                                )
                            }}
                        </Formik>
                    )}
                </ScrollView>
            </View>
        </View>
    )
}

export default PopUpView

const styles = StyleSheet.create({
    overlay: {
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        bottom: 0,
        justifyContent: 'center',
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 1000,
    },
    popupContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        elevation: 8,
        maxHeight: '85%',
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        width: '90%',
    },
    headerContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 30,
        marginBottom: 15,
    },
    headerTitle: {
        color: '#1e40af',
        fontSize: 22,
        fontWeight: 'bold',
    },
    formTitle: {
        color: '#1e40af',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 12,
    },
    errorText: {
        color: '#dc2626',
        fontSize: 13,
        marginTop: 4,
    },
    inputBox: {
        backgroundColor: '#ffffff',
        borderColor: '#93c5fd',
        borderRadius: 12,
        borderWidth: 1,
        color: '#1e293b',
        fontSize: 16,
        height: 50,
        paddingHorizontal: 15,
        width: '100%',
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    submitButton: {
        alignItems: 'center',
        backgroundColor: '#1d4ed8',
        borderRadius: 12,
        marginBottom: 10,
        marginTop: 25,
        paddingVertical: 15,
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
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    checklistContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    checklistItem: {
        backgroundColor: '#dbeafe',
        borderColor: '#93c5fd',
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    checklistItem_selected: {
        backgroundColor: '#1d4ed8',
        borderColor: '#1e40af',
    },
    checklistText: {
        color: '#1e40af',
        fontWeight: '500',
    },
    checklistText_selected: {
        color: '#ffffff',
    },
    conversionSection: {
        borderColor: '#bfdbfe',
        borderTopWidth: 1,
        marginTop: 15,
        paddingTop: 15,
        zIndex: 1000,
    },
    conversionInputRow: {
        alignItems: 'center',
        flexDirection: 'row',
        marginTop: 10,
    },
    conversionInput: {
        flex: 1,
        height: 45,
        textAlign: 'center',
    },
    conversionLabel: {
        color: '#1e40af',
        fontSize: 16,
        marginHorizontal: 8,
    },
});