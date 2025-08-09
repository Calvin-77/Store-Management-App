import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableOpacity, Switch, Pressable, Animated, Easing } from 'react-native';
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
    const [toggleWidth, setToggleWidth] = useState(0);
    const segmentWidth = toggleWidth / 2;
    const isToko = role === roles[0].id;

    const transition = useRef(new Animated.Value(0)).current;

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

        Animated.timing(transition, {
            toValue: role === roles[0].id ? 0 : 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
        }).start();
    }, [role, transition]);

    const pageBg = transition.interpolate({
        inputRange: [0, 1],
        outputRange: ['#ecfdf5', '#f5f3ff'],
    });

    const leftBtnScale = transition.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98] });
    const rightBtnScale = transition.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] });
    const thumbBg = transition.interpolate({ inputRange: [0, 1], outputRange: ['#10b981', '#6366f1'] });
    const thumbTranslateX = transition.interpolate({ inputRange: [0, 1], outputRange: [0, segmentWidth] });

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
                    transition.setValue(savedRole === roles[0].id ? 0 : 1);
                }
            } catch (e) {
                throw e;
            }
        };
        loadRole();
    }, [transition]);

    const GridItem = ({ item, index }) => {
        const navigation = useNavigation();
        const tileAnim = useRef(new Animated.Value(1)).current;

        useEffect(() => {
            tileAnim.setValue(0);
            Animated.timing(tileAnim, {
                toValue: 1,
                duration: 350,
                delay: index * 50,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start();
        }, [role]);

        const handlePress = () => {
            if (item.routeName) {
                navigation.navigate(item.routeName, { role: role });
            }
        };

        const animatedStyle = {
            opacity: tileAnim,
            transform: [
                {
                    translateY: tileAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] })
                },
                {
                    scale: tileAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] })
                },
            ],
        };

        return (
            <TouchableOpacity onPress={handlePress}>
                <Animated.View style={[styles.gridItem, gridColor, animatedStyle]}>
                    <Text style={styles.gridItemText}>{item.title}</Text>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    return (
        <Animated.View style={[styles.pageContainer, pageColor, { backgroundColor: pageBg }]}>
            <View style={styles.header}>
                <Text style={styles.title}>Dashboard</Text>
            </View>
            <View style={{ width: 'auto', alignItems: 'center', marginBottom: 20 }}>
                <View style={{ alignContent: 'center', width: 'auto', flexDirection: 'row' }}>
                    <Animated.View
                        style={styles.toggleOuter}
                        onLayout={(e) => setToggleWidth(e.nativeEvent.layout.width)}
                    >
                        <Animated.View
                            pointerEvents="none"
                            style={[
                                styles.toggleThumb,
                                {
                                    width: segmentWidth || 0,
                                    transform: [{ translateX: thumbTranslateX }],
                                    backgroundColor: thumbBg,
                                },
                            ]}
                        />
                        <Pressable style={styles.toggleSegment} onPress={() => { handleRole(roles[0].id) }}>
                            <Text style={[styles.roleTitle, { color: isToko ? '#ffffff' : '#1f2937' }]}>Toko</Text>
                        </Pressable>
                        <Pressable style={styles.toggleSegment} onPress={() => { handleRole(roles[1].id) }}>
                            <Text style={[styles.roleTitle, { color: !isToko ? '#ffffff' : '#1f2937' }]}>Gudang</Text>
                        </Pressable>
                    </Animated.View>
                </View>
            </View>
            <FlatList
                data={data}
                renderItem={({ item, index }) => (
                    <GridItem item={item} index={index} />
                )}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.gridContainer}
            />
        </Animated.View>
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
        alignItems: 'center',
    },
    gridItem: {
        flex: 1,
        margin: 8,
        alignItems: 'center',
        justifyContent: 'center',
        height: 150,
        width: 500,
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
    toggleOuter: {
        width: 220,
        height: 40,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#2d3748',
        backgroundColor: '#e5e7eb',
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    toggleThumb: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        borderRadius: 999,
    },
    toggleSegment: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});