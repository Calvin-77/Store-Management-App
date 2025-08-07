import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { Table, Row } from 'react-native-table-component';
import BackIcon from '../components/BackIcon';

const ItemStocks = ({ route }) => {
  const { role } = route.params || {};
  let place = role == '1' ? 'Toko' : 'Gudang';
  const navigation = useNavigation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRowId, setEditingRowId] = useState(null);
  const [editableRowData, setEditableRowData] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/products/availableProducts', { params: { place: place } });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingRowId(item.product_id);
    setEditableRowData({ ...item });
  };

  const handleCancel = () => {
    setEditingRowId(null);
    setEditableRowData({});
  };

  const handleSave = async () => {
    if (!editingRowId) return;
    try {
      await axios.put(`http://localhost:3000/products/${editingRowId}`, editableRowData);
      const updatedData = data.map(item =>
        item.product_id === editingRowId ? editableRowData : item
      );
      setData(updatedData);
      setEditingRowId(null);
      setEditableRowData({});
      Alert.alert('Success', 'Product updated successfully!');
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Error', 'Failed to update product.');
    }
  };

  const handleInputChange = (field, value) => {
    setEditableRowData(prev => ({ ...prev, [field]: value }));
  };

  const handleBack = () => {
    navigation.navigate("Home");
  };

  const tableHead = ['ID', 'SKU', 'Nama', 'Deskripsi', 'Harga Beli', 'Harga Jual', 'Stok', 'Min. Stock', 'Action'];
  const widthArr = [50, 80, 200, 250, 135, 135, 150, 88, 150];

  if (loading) {
    return (
      <View style={[styles.pageContainer, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#63b3ed" />
      </View>
    );
  }

  return (
    <View style={styles.pageContainer}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <BackIcon />
      </TouchableOpacity>
      <Text style={styles.title}>Stok Produk</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <Table borderStyle={{ borderWidth: 1, borderColor: '#30363d' }}>
            <Row
              data={tableHead}
              style={styles.tableHead}
              textStyle={styles.tableHeadText}
              widthArr={widthArr}
            />
            {data.map((item, index) => {
              const isEditing = item.product_id === editingRowId;

              const actions = (
                <View style={styles.actionsContainer}>
                  {isEditing ? (
                    <>
                      <TouchableOpacity onPress={handleSave} style={[styles.actionButton, styles.saveButton]}>
                        <Text style={styles.actionButtonText}>Simpan</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleCancel} style={[styles.actionButton, styles.cancelButton]}>
                        <Text style={styles.actionButtonText}>Batal</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleEdit(item)}
                      style={[styles.actionButton, styles.editButton]}
                      disabled={editingRowId !== null && editingRowId !== item.product_id}
                    >
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );

              let stockCellContent = <Text style={styles.tableRowText}>N/A</Text>;

              if (item.stock_levels && item.stock_levels[place]) {
                const stockEntries = Object.entries(item.stock_levels[place]);
                if (stockEntries.length > 0) {
                  const primaryUnitStock = stockEntries[0] ? stockEntries[0][1] : null;
                  const isLowStock = Number(primaryUnitStock) < item.min_stock_level;
                  stockCellContent = (
                    <View style={[styles.stockCellContainer, isLowStock && styles.lowStock]}>
                      {stockEntries.map(([unit, stock], index) => (
                        <Text
                          key={unit}
                          style={[
                            styles.tableRowText,
                            index === 0 && styles.boldText,
                            { margin: 0 },
                            isLowStock && styles.lowStock
                          ]}
                        >
                          {`${stock} ${unit}`}
                        </Text>
                      ))}
                    </View>
                  );
                }
              }

              const rowColors = ['#f8fafc', '#bbbfc5ff'];

              const rowColor = {
                backgroundColor: rowColors[index % rowColors.length],
              };

              const rowData = [
                item.product_id,
                item.sku,
                item.name,
                item.description || 'N/A',
                isEditing ? (
                  <TextInput value={String(editableRowData.purchase_price)} onChangeText={text => handleInputChange('purchase_price', text)} style={styles.inputCell} keyboardType="numeric" />
                ) : (
                  `Rp ${Number(item.purchase_price).toFixed(2)}`
                ),
                isEditing ? (
                  <TextInput value={String(editableRowData.selling_price)} onChangeText={text => handleInputChange('selling_price', text)} style={styles.inputCell} keyboardType="numeric" />
                ) : (
                  `Rp ${Number(item.selling_price).toFixed(2)}`
                ),
                stockCellContent,
                item.min_stock_level,
                actions,
              ];

              return (
                <Row
                  key={item.product_id}
                  data={rowData}
                  style={[isEditing ? styles.editingRow : styles.tableRow, rowColor]}
                  textStyle={styles.tableRowText}
                  widthArr={widthArr}
                />
              );
            })}
          </Table>
        </View>
      </ScrollView>
    </View>
  );
};

export default ItemStocks;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    padding: 20,
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 20,
    textAlign: 'center',
  },
  tableHead: {
    height: 50,
    backgroundColor: '#166534',
  },
  tableHeadText: {
    margin: 0,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tableRow: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#bbf7d0',
  },
  editingRow: {
    backgroundColor: '#dcfce7',
  },
  tableRowText: {
    margin: 10,
    textAlign: 'center',
    color: '#000000ff',
  },
  stockCellContainer: {
    paddingVertical: 10,
  },
  boldText: {
    fontWeight: 'bold',
  },
  inputCell: {
    height: 40,
    margin: 8,
    backgroundColor: '#ffffff',
    color: '#166534',
    borderRadius: 8,
    textAlign: 'center',
    paddingHorizontal: 10,
    borderColor: '#22c55e',
    borderWidth: 1,
  },
  actionsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  editButton: {
    backgroundColor: '#059669',
  },
  saveButton: {
    backgroundColor: '#16a34a',
  },
  cancelButton: {
    backgroundColor: '#dc2626',
  },
  lowStock: {
    backgroundColor: '#ff0000c9',
    color: '#ffffff'
  },
});