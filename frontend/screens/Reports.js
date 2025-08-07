import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import BackIcon from '../components/BackIcon';

const data = [
    { id: '1', title: 'Laporan Laba/Rugi', routeName: 'ProfitLossReports' },
    { id: '2', title: 'Laporan Arus Kas', routeName: 'CashFlowReports' },
    { id: '3', title: 'Laporan Neraca', routeName: 'BalanceSheets' },
    { id: '4', title: 'Rekap Harian/Mingguan/Bulanan/Tahunan', routeName: 'Recaps' },
];

const Reports = ({ route }) => {
    const { role } = route.params || {};
    const navigation = useNavigation();

    const handleBack = () => {
        navigation.navigate("Home");
    }

    const GridItem = ({ item }) => {
        const navigation = useNavigation();

        const handlePress = () => {
            if (item.routeName) {
                navigation.navigate(item.routeName, { role: role });
            }
        };

        return (
            <TouchableOpacity style={styles.gridItem} onPress={handlePress}>
                <Text style={styles.gridItemText}>{item.title}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.pageContainer}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <BackIcon />
            </TouchableOpacity>
            <Text style={styles.title}>Laporan</Text>
            <FlatList
                data={data}
                renderItem={({ item }) => (
                    <GridItem item={item} />
                )}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.gridContainer}
            />
        </View>
    )
}

export default Reports

const styles = StyleSheet.create({
    pageContainer: {
        flex: 1,
        backgroundColor: '#fef3c7',
        padding: 20,
    },
    backButton: {
        marginBottom: 16,
        alignSelf: 'flex-start',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#92400e',
        marginBottom: 20,
        textAlign: 'center',
    },
    gridContainer: {
        padding: 12,
    },
    gridItem: {
        flex: 1,
        margin: 8,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        height: 140,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#fbbf24',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    gridItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#92400e',
        textAlign: 'center',
        paddingHorizontal: 8,
    },
})