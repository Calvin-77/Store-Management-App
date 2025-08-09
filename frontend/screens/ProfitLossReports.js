import { StyleSheet, Text, View, ActivityIndicator, Alert, TouchableOpacity, FlatList } from 'react-native';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import createExcelProfitLoss from '../tools/createExcelProfitLoss';
import ReactNativeBlobUtil from 'react-native-blob-util';
import BackIcon from '../components/BackIcon';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const formatDateToYyyyMmDd = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth()).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthDateRange = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  return {
    startDate: formatDateToYyyyMmDd(startDate),
    endDate: formatDateToYyyyMmDd(endDate)
  };
};

const ProfitLossReports = ({ route }) => {
  const { role } = route.params || {};
  const currentRole = role || '1';
  const place = currentRole === '1' ? 'Toko' : 'Gudang';
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [existingReports, setExistingReports] = useState([]);
  const [savedFilePath, setSavedFilePath] = useState('');

  const [startDate, setStartDate] = useState(getMonthDateRange().startDate);
  const [endDate, setEndDate] = useState(getMonthDateRange().endDate);

  const [pageColor, setPageColor] = useState('#fef2f2');

  useEffect(() => {
    if (currentRole === '1') {
      setPageColor('#e6f9ed'); // Toko hijau
    } else if (currentRole === '2') {
      setPageColor('#f3e8ff'); // Gudang ungu
    }
  }, [currentRole]);

  const fetchExistingReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:3000/reports/reports', {
        params: { place, report_type: 'profit-loss' }
      });
      setExistingReports(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Gagal mengambil daftar laporan.';
      setError(errorMessage);
      setExistingReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    setLoading(true);
    setError(null);
    setSavedFilePath('');

    try {
      const response = await axios.get('http://localhost:3000/reports/profit-loss-report', {
        params: { startDate, endDate, place }
      });

      const reportData = response.data;

      const periode = { place, startDate, endDate };
      const excelBase64 = createExcelProfitLoss(reportData, periode);

      const documentsPath = ReactNativeBlobUtil.fs.dirs.DocumentDir;
      const fileName = `LabaRugi-Bulanan-${periode.place} (${periode.startDate} hingga ${periode.endDate}).xlsx`;
      const finalPath = `${documentsPath}/${fileName}`;

      await ReactNativeBlobUtil.fs.writeFile(finalPath, excelBase64, 'base64');
      setSavedFilePath(finalPath);

      await axios.post('http://localhost:3000/reports/reports', {
        report_type: 'profit-loss',
        place: periode.place,
        startDate: periode.startDate,
        endDate: periode.endDate,
        pdf_path: finalPath,
      });

      fetchExistingReports();

    } catch (err) {
      if (err.response?.status === 409) {
        fetchExistingReports();
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred.';
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkFetchStatus = async () => {
      let today = new Date().toISOString().split('T')[0];
      let fetchStatus = await AsyncStorage.getItem('profitLoss');

      if (fetchStatus !== today) {
        handleCreateReport();
        
        await AsyncStorage.setItem('profitLoss', today);
      }
    };
    
    fetchExistingReports();
    checkFetchStatus();
  }, []);

  const renderReportItem = ({ item }) => {

    return (
      <View style={styles.reportItem}>
        <Text style={styles.reportText}>
          Periode: {new Date(item.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - {new Date(item.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
        <Text selectable={true} style={styles.pathTextSmall}>
          {item.pdf_path}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.pageContainer, { backgroundColor: pageColor }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Reports", { role: currentRole })}>
        <BackIcon />
      </TouchableOpacity>
      <Text style={styles.title}>Laporan Laba Rugi</Text>

      <View style={styles.listContainer}>
        {loading && <ActivityIndicator size="large" color="#1e293b" />}
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!loading && !error && (
          <FlatList
            data={existingReports}
            renderItem={renderReportItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={<Text style={styles.infoText}>Belum ada laporan yang dibuat.</Text>}
          />
        )}
      </View>
    </View>
  );
};

export default ProfitLossReports;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#fef2f2',
    padding: 20,
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a365d',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#fca5a5',
    paddingBottom: 5,
  },
  creationContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listContainer: {
    flex: 1,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#1a365d',
    textAlign: 'center',
    marginBottom: 15,
  },
  errorText: {
    fontSize: 14,
    color: '#1a365d',
    textAlign: 'center',
    marginVertical: 10,
  },
  pathText: {
    marginTop: 15,
    fontSize: 12,
    color: '#166534',
    backgroundColor: '#dcfce7',
    padding: 8,
    borderRadius: 6,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  pathTextSmall: {
    fontSize: 11,
    color: '#7f1d1d',
    backgroundColor: '#fecaca',
    padding: 5,
    borderRadius: 4,
    fontFamily: 'monospace',
    marginTop: 5,
  },
  reportItem: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  reportText: {
    fontSize: 14,
    color: '#1a365d',
  },
});
