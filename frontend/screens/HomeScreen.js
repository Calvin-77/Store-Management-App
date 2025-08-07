import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, Switch, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const data = [
    { id: '1', title: 'Tambah Transaksi', routeName: 'AddTransaction' },
    { id: '2', title: 'Stok Barang', routeName: 'ItemStocks' },
    { id: '3', title: 'Utang dan Piutang', routeName: 'Accounts' },
    { id: '4', title: 'Laporan', routeName: 'Reports' },
];

const roles = [
    { id: '1', title: 'Toko' },
    { id: '2', title: 'Gudang' },
]

const HomeScreen = () => {
    const [role, setRole] = useState(roles[0].id);
    const [buttonColor, setButtonColor] = useState({});
    const [pageColor, setPageColor] = useState({});
    const [gridColor, setGridColor] = useState({});

    useEffect(() => {
        if (role === roles[0].id) {
            setButtonColor(styles.roleColor_1);
            setPageColor(styles.pageColor_1);
            setGridColor(styles.gridColor_1);
        }
        else if (role === roles[1].id) {
            setButtonColor(styles.roleColor_2);
            setPageColor(styles.pageColor_2);
            setGridColor(styles.gridColor_2);
        }
    }, [role]);

    const handleRole = async (currentRole) => {
        if (currentRole == role) return;

        const newRole = role === roles[0].id ? roles[1].id : roles[0].id;
        setRole(newRole);
        await AsyncStorage.setItem('userRole', newRole);
    }

    useEffect(() => {
        const loadRole = async () => {
            try {
                const savedRole = await AsyncStorage.getItem('userRole');
                if (savedRole !== null) {
                    setRole(savedRole);
                }
            } catch (e) {
                throw e;
            }
        };
        loadRole();
    }, []);

    const GridItem = ({ item }) => {
        const navigation = useNavigation();

        const handlePress = () => {
            if (item.routeName) {
                navigation.navigate(item.routeName, { role: role });
            }
        };

        return (
            <TouchableOpacity style={[styles.gridItem, gridColor]} onPress={handlePress}>
                <Text style={styles.gridItemText}>{item.title}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.pageContainer, pageColor]}>
            <View style={styles.header}>
                <Text style={styles.title}>Dashboard</Text>
            </View>
            <View style={{ width: 'auto', alignItems: 'center', marginBottom: 20 }}>
                <View style={{ alignContent: 'center', width: 'auto', flexDirection: 'row' }}>
                    <Pressable onPress={() => { handleRole(roles[0].id) }}>
                        <View style={[styles.switchButton, role === roles[0].id ? buttonColor : null]}>
                            <Text style={styles.roleTitle}>Toko</Text>
                        </View>
                    </Pressable>
                    <Pressable onPress={() => { handleRole(roles[1].id) }}>
                        <View style={[styles.switchButton, role === roles[1].id ? buttonColor : null]}>
                            <Text style={styles.roleTitle}>Gudang</Text>
                        </View>
                    </Pressable>
                </View>
            </View>
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
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    pageContainer: {
        flex: 1,
        backgroundColor: '#f0f4f8',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a365d',
        marginBottom: 8,
    },
    roleTitle: {
        fontSize: 16,
        color: '#000000',
    },
    switchButton: {
        borderWidth: 1,
        borderColor: '#2d3748',
        padding: 8,
        width: 100,
        alignItems: 'center'
    },
    roleColor_1: {
        backgroundColor: '#10b981',
        borderColor: '#059669',
    },
    roleColor_2: {
        backgroundColor: '#6366f1',
        borderColor: '#4338ca',
    },
    pageColor_1: {
        backgroundColor: '#ecfdf5',
    },
    pageColor_2: {
        backgroundColor: '#f5f3ff',
    },
    gridColor_1: {
        backgroundColor: '#d1fae5',
        borderColor: '#34d399',
    },
    gridColor_2: {
        backgroundColor: '#ede9fe',
        borderColor: '#a5b4fc',
    },
    gridContainer: {
        padding: 12,
    },
    gridItem: {
        flex: 1,
        margin: 8,
        alignItems: 'center',
        justifyContent: 'center',
        height: 140,
        borderRadius: 16,
        borderWidth: 1,
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
        color: '#2d3748',
        textAlign: 'center',
        paddingHorizontal: 8,
    },
});