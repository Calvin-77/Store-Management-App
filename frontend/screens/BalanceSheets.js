import { StyleSheet, Text, View, ActivityIndicator, Alert, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import createPdfBalanceSheets from '../tools/createPdfBalanceSheets';
import ReactNativeBlobUtil from 'react-native-blob-util';
import BackIcon from '../components/BackIcon';
import { useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';

const formatDateToYyyyMmDd = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthDateRange = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  return {
    startDate: formatDateToYyyyMmDd(startDate),
    endDate: formatDateToYyyyMmDd(endDate)
  };
};

const BalanceSheets = ({ route }) => {
  const { role } = route.params || {};
  const currentRole = role || '1';
  const place = currentRole === '1' ? 'Toko' : 'Gudang';
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existingReports, setExistingReports] = useState([]);

  const [asOfDate, setAsOfDate] = useState(formatDateToYyyyMmDd(new Date()));

  const fetchExistingReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:3000/reports/reports', {
        params: { report_type: 'balance-sheet', place: place }
      });
      setExistingReports(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengambil daftar laporan.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMonthlyReport = async () => {
    setLoading(true);
    setError(null);
    const { startDate, endDate } = getMonthDateRange();

    try {
      const response = await axios.get('http://localhost:3000/reports/balance-sheet/period', {
        params: { startDate, endDate, place }
      });
      const reportData = response.data;
      const pdfRawString = createPdfBalanceSheets(reportData, { place, asOfDate: endDate });

      const documentsPath = ReactNativeBlobUtil.fs.dirs.DownloadDir;
      const fileName = `Neraca-Bulanan-${place}-${endDate}.pdf`;
      const finalPath = `${documentsPath}/${fileName}`;

      await ReactNativeBlobUtil.fs.writeFile(finalPath, pdfRawString, 'utf8');

      const closingBalances = {
        kas: reportData.aset.kas, inventaris: reportData.aset.inventaris,
        piutang: reportData.aset.piutang, utang: reportData.liabilitas.utang,
        labaDitahan: reportData.ekuitas.labaDitahan, peralatan: reportData.aset.peralatan,
        perlengkapan: reportData.aset.perlengkapan, modal: reportData.ekuitas.modal
      };

      await axios.post('http://localhost:3000/reports/reports', {
        report_type: 'balance-sheet', place,
        startDate, endDate, asOfDate: endDate,
        pdf_path: finalPath, closingBalances,
      });

      fetchExistingReports();
    } catch (err) {
      if (err.response?.status !== 409) {
        setError(err.response?.data?.message || 'Gagal membuat laporan bulanan otomatis.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsOfDateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:3000/reports/balance-sheet', {
        params: { asOfDate, place }
      });
      const reportData = response.data;
      const pdfRawString = createPdfBalanceSheets(reportData, { place, asOfDate });

      const documentsPath = ReactNativeBlobUtil.fs.dirs.DownloadDir;
      const fileName = `Neraca-${place}-${asOfDate}.pdf`;
      const finalPath = `${documentsPath}/${fileName}`;

      await ReactNativeBlobUtil.fs.writeFile(finalPath, pdfRawString, 'utf8');

      const closingBalances = {
        kas: reportData.aset.kas, inventaris: reportData.aset.inventaris,
        piutang: reportData.aset.piutang, utang: reportData.liabilitas.utang,
        labaDitahan: reportData.ekuitas.labaDitahan, peralatan: reportData.aset.peralatan,
        perlengkapan: reportData.aset.perlengkapan, modal: reportData.ekuitas.modal
      };

      await axios.post('http://localhost:3000/reports/reports', {
        report_type: 'balance-sheet', place,
        asOfDate, pdf_path: finalPath, closingBalances,
      });

      fetchExistingReports();
    } catch (err) {
      Alert.alert("Error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExistingReports();
    handleCreateMonthlyReport();
  }, []);

  const renderReportItem = ({ item }) => (
    <View style={styles.reportItem}>
      {item.start_date == null ?
        <Text style={styles.reportText}>
          Per Tanggal: {new Date(item.as_of_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
        :
        <Text style={styles.reportText}>
          Periode: {new Date(item.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - {new Date(item.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      }
      <Text selectable={true} style={styles.pathTextSmall}>{item.pdf_path}</Text>
    </View>
  );

  return (
    <View style={styles.pageContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Reports", { role: currentRole })}>
        <BackIcon />
      </TouchableOpacity>
      <Text style={styles.title}>Laporan Neraca</Text>

      <ScrollView>
        <View style={styles.creationContainer}>
          <Text style={styles.subtitle}>Buat Laporan Per Tanggal Pilihan</Text>
          <Calendar
            style={styles.calendar}
            onDayPress={(day) => setAsOfDate(day.dateString)}
            markedDates={{ [asOfDate]: { selected: true, disableTouchEvent: true, selectedColor: '#2563eb' } }}
            theme={{
              todayTextColor: '#2563eb',
              arrowColor: '#1e40af',
            }}
          />
          <TouchableOpacity style={styles.createButton} onPress={handleCreateAsOfDateReport} disabled={loading}>
            <Text style={styles.createButtonText}>
              {loading ? 'Memproses...' : `Buat Laporan per ${asOfDate}`}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.subtitle}>Laporan Tersimpan</Text>
          {loading && <ActivityIndicator size="large" color="#1e40af" />}
          {error && <Text style={styles.errorText}>{error}</Text>}
          {!loading && (
            <FlatList
              data={existingReports}
              renderItem={renderReportItem}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={<Text style={styles.infoText}>Belum ada laporan yang dibuat.</Text>}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default BalanceSheets;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    padding: 20
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 10
  },
  creationContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  listContainer: {
    flex: 1,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  calendar: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    marginBottom: 15
  },
  createButton: {
    backgroundColor: '#1d4ed8',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
    marginVertical: 15
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    marginVertical: 10
  },
  pathTextSmall: {
    fontSize: 11,
    color: '#1e40af',
    backgroundColor: '#dbeafe',
    padding: 5,
    borderRadius: 4,
    fontFamily: 'monospace',
    marginTop: 5,
  },
  reportItem: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  reportText: {
    fontSize: 14,
    color: '#1e40af'
  },
});