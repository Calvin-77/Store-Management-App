import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { Table, Row } from 'react-native-table-component';
import BackIcon from '../components/BackIcon';

const Accounts = ({ route }) => {
  const { role } = route.params || {};
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
      const response = await axios.get('http://localhost:3000/accounts', { params: { place: role === '1' ? 'Toko' : 'Gudang' } });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.navigate("Home");
  };

  const tableHead = ['ID', 'Nama', 'Tipe', 'Deskripsi', 'Total Tagihan', 'Sisa Tagihan', 'Tanggal Transaksi', 'Jatuh Tempo', 'Status', 'Catatan', 'Created At', 'Updated At'];
  const widthArr = [50, 100, 80, 150, 135, 135, 100, 100, 80, 110, 95, 95];

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
      <Text style={styles.title}>Accounts</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Table borderStyle={{ borderWidth: 1, borderColor: '#30363d' }}>
          <Row
            data={tableHead}
            style={styles.tableHead}
            textStyle={styles.tableHeadText}
            widthArr={widthArr}
          />

          {data.map((item, index) => {
            let statusColor;
            if (item.status === 'LUNAS') {
              statusColor = styles.statusColor_1
            } else if (item.status === 'BELUM LUNAS') {
              statusColor = styles.statusColor_2
            } else {
              statusColor = styles.statusColor_3
            }

            const rowColors = ['#f8fafc', '#bbbfc5ff'];

            const rowColor = {
              backgroundColor: rowColors[index % rowColors.length],
            };

            const rowData = [
              item.id,
              item.name,
              item.tipe,
              item.deskripsi || 'N/A',
              item.nominal_total ? `Rp ${Number(item.nominal_total).toFixed(2)}` : 'N/A',
              item.sisa_tagihan ? `Rp ${Number(item.sisa_tagihan).toFixed(2)}` : 'N/A',
              item.tanggal_transaksi || 'N/A',
              item.jatuh_tempo.split('T')[0],
              <View style={[statusColor, { flex: 1, justifyContent: 'center', borderWidth: 0.3, borderColor: '#000000' }]}><Text style={styles.tableRowText}>{item.status}</Text></View>,
              item.catatan,
              item.created_at,
              item.updated_at,
            ];


            return (
              <Row
                key={item.product_id}
                data={rowData}
                style={[styles.tableRow, rowColor]}
                textStyle={styles.tableRowText}
                widthArr={widthArr}
              />
            );
          })}
        </Table>
      </ScrollView>
    </View>
  );
};

export default Accounts;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7fafc',
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 20,
    textAlign: 'center',
  },
  tableHead: {
    height: 50,
    backgroundColor: '#2c5282',
  },
  tableHeadText: {
    margin: 0,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tableRow: {
    borderWidth: 0.3,
    borderColor: '#e2e8f0',
  },
  tableRowText: {
    margin: 10,
    textAlign: 'center',
    color: '#2d3748',
  },
  statusColor_1: {
    backgroundColor: '#48bb78'
  },
  statusColor_2: {
    backgroundColor: '#f7fafc'
  }, statusColor_3: {
    backgroundColor: '#f56565'
  }
});