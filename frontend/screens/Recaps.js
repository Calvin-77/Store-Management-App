import { StyleSheet, Text, View, ActivityIndicator, Alert, TouchableOpacity, FlatList } from 'react-native';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import createPdfRecaps from '../tools/createPdfRecaps';
import ReactNativeBlobUtil from 'react-native-blob-util';
import BackIcon from '../components/BackIcon';
import { useNavigation } from '@react-navigation/native';

const getDateRangeForPeriod = (period) => {
  const today = new Date();
  let startDate, endDate;

  switch (period) {
    case 'day':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = yesterday;
      endDate = yesterday;
      break;
    case 'week':
      const lastDayOfWeek = new Date(today);
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(firstDayOfWeek.getDate() - firstDayOfWeek.getDay() + (firstDayOfWeek.getDay() == 0 ? -6 : 1) - 7);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
      startDate = firstDayOfWeek;
      endDate = lastDayOfWeek;
      break;
    case 'year':
      startDate = new Date(today.getFullYear() - 1, 0, 1);
      endDate = new Date(today.getFullYear() - 1, 11, 31);
      break;
    case 'month':
    default:
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
  }

  return {
    startDate: formatDateToYyyyMmDd(startDate),
    endDate: formatDateToYyyyMmDd(endDate),
  };
};

const formatDateToYyyyMmDd = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Recaps = ({ route }) => {
  const { role } = route.params || {};
  const currentRole = role || '1';
  const place = currentRole === '1' ? 'Toko' : 'Gudang';
  const navigation = useNavigation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [existingReports, setExistingReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);

  const [groupBy, setGroupBy] = useState('month');
  const [startDate, setStartDate] = useState(getDateRangeForPeriod('month').startDate);
  const [endDate, setEndDate] = useState(getDateRangeForPeriod('month').endDate);

  useEffect(() => {
    const newRange = getDateRangeForPeriod(groupBy);
    setStartDate(newRange.startDate);
    setEndDate(newRange.endDate);

    const filtered = existingReports.filter(report => {
      const start = new Date(report.start_date);
      const end = new Date(report.end_date);

      switch (groupBy) {
        case 'day':
          return report.start_date === report.end_date;
        case 'week':
          const diffTime = Math.abs(end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays === 6;
        case 'month':
          const isSameMonth = start.getMonth() === end.getMonth();
          const isSameYear = start.getFullYear() === end.getFullYear();
          const lastDayOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
          return start.getDate() === 1 && end.getDate() === lastDayOfMonth && isSameMonth && isSameYear;
        case 'year':
          return start.getMonth() === 0 && start.getDate() === 1 && end.getMonth() === 11 && end.getDate() === 31;
      }
    });

    setFilteredReports(filtered);

  }, [groupBy, existingReports]);

  const fetchExistingReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:3000/reports/reports', {
        params: { place, report_type: 'recap' }
      });
      setExistingReports(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengambil daftar laporan.');
      setExistingReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (startDateParam, endDateParam, groupByParam) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:3000/reports/recap', {
        params: {
          startDate: startDateParam,
          endDate: endDateParam,
          place,
          groupBy: groupByParam,
        }
      });

      const reportData = response.data;

      const periode = {
        place,
        startDate: startDateParam,
        endDate: endDateParam,
        groupBy: groupByParam
      };
      const pdfRawString = createPdfRecaps(reportData, periode);

      const documentsPath = ReactNativeBlobUtil.fs.dirs.DownloadDir;
      let fileName;
      switch (periode.groupBy) {
        case 'day':
          fileName = `Rekap-Harian-${periode.place}-${periode.endDate}.pdf`;
          break;
        case 'week':
          fileName = `Rekap-Mingguan-${periode.place}-${periode.startDate}-${periode.endDate}.pdf`;
          break;
        case 'month':
          fileName = `Rekap-Bulanan-${periode.place}-${periode.startDate}-${periode.endDate}.pdf`;
          break;
        case 'year':
          fileName = `Rekap-Tahunan-${periode.place}-${periode.startDate}-${periode.endDate}.pdf`;
          break;
      }
      const finalPath = `${documentsPath}/${fileName}`;

      await ReactNativeBlobUtil.fs.writeFile(finalPath, pdfRawString, 'utf8');

      await axios.post('http://localhost:3000/reports/reports', {
        report_type: 'recap',
        place: periode.place,
        startDate: periode.startDate,
        endDate: periode.endDate,
        pdf_path: finalPath,
      });

      if (periode.groupBy == 'week') fetchExistingReports();

    } catch (err) {
      if (err.response?.status === 409) {
        fetchExistingReports();
      } else {
        Alert.alert('Error', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const createInitialReports = async () => {
      const dailyRange = getDateRangeForPeriod('day');
      await handleCreateReport(dailyRange.startDate, dailyRange.endDate, 'day');

      const weeklyRange = getDateRangeForPeriod('week');
      await handleCreateReport(weeklyRange.startDate, weeklyRange.endDate, 'week');

      const monthlyRange = getDateRangeForPeriod('month');
      await handleCreateReport(monthlyRange.startDate, monthlyRange.endDate, 'month');

      const yearlyRange = getDateRangeForPeriod('year');
      await handleCreateReport(yearlyRange.startDate, yearlyRange.endDate, 'year');

      await fetchExistingReports();
    };

    createInitialReports();
  }, []);

  const renderReportItem = ({ item }) => (
    <View style={styles.reportItem}>
      {item.start_date == item.end_date ?
        <Text style={styles.reportText}>
          Periode: {new Date(item.end_date).toLocaleDateString('id-ID')}
        </Text>
        :
        <Text style={styles.reportText}>
          Periode: {new Date(item.start_date).toLocaleDateString('id-ID')} - {new Date(item.end_date).toLocaleDateString('id-ID')}
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
      <Text style={styles.title}>Laporan Rekapitulasi</Text>

      <Text style={styles.infoText}>
        Periode Laporan: {new Date(startDate).toLocaleDateString('id-ID')} - {new Date(endDate).toLocaleDateString('id-ID')}
      </Text>

      <View style={styles.creationContainer}>
        <View style={styles.buttonGroup}>
          {[
            { label: 'Harian', value: 'day' },
            { label: 'Mingguan', value: 'week' },
            { label: 'Bulanan', value: 'month' },
            { label: 'Tahunan', value: 'year' },
          ].map(period => (
            <TouchableOpacity
              key={period.value}
              style={[styles.groupButton, groupBy === period.value && styles.groupButtonActive]}
              onPress={() => setGroupBy(period.value)}>
              <Text style={[styles.groupButtonText, groupBy === period.value && styles.groupButtonTextActive]}>{period.label.charAt(0).toUpperCase() + period.label.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.listContainer}>
        {loading && <ActivityIndicator size="large" color="#1e293b" />}
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!loading && (
          <FlatList
            data={filteredReports}
            renderItem={renderReportItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={<Text style={styles.infoText}>Belum ada laporan yang dibuat.</Text>}
          />
        )}
      </View>
    </View>
  );
};

export default Recaps;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#ede9e3',
    padding: 20,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7c3aed',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b21a8',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#6b21a8',
    textAlign: 'center',
    marginBottom: 15,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    marginVertical: 10,
  },
  reportText: {
    fontSize: 14,
    color: '#7c3aed',
  },
  pathTextSmall: {
    fontSize: 11,
    color: '#6b21a8',
    backgroundColor: '#f3e8ff',
    padding: 5,
    borderRadius: 4,
    fontFamily: 'monospace',
    marginTop: 5,
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  createButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  groupButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#c4b5fd',
  },
  groupButtonActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  groupButtonText: {
    color: '#6b21a8',
    fontWeight: '500',
  },
  groupButtonTextActive: {
    color: 'white',
  },
  reportItem: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#faf5ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
});