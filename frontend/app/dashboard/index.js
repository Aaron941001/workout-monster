import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, RefreshControl, Dimensions, FlatList, Image } from 'react-native';
import { useFocusEffect } from 'expo-router';
import api from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from "react-native-gifted-charts";

import i18n from '../../utils/i18n';

const TrendCard = ({ data }) => {
    // Transform data for chart
    const chartData = (data.history || []).map(item => ({
        value: item.weight,
        label: new Date(item.date).getDate().toString(),
        dataPointText: item.weight.toString(),
        hideDataPoint: false,
    })).reverse();

    // Check trend for Snorlax
    const isSuccess = data.diff_pct < 0;

    return (
        <View style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{i18n.t('weight_trend')}</Text>
                    <Text style={styles.message}>{data.message || i18n.t('keep_pushing')}</Text>
                </View>
                <Image
                    source={isSuccess
                        ? require('../../assets/images/snorlax_success.png')
                        : require('../../assets/images/snorlax_lifting.png')}
                    style={{ width: 80, height: 80, marginTop: -20, marginRight: -10 }}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.trendRow}>
                <View>
                    <Text style={styles.statLabel}>{i18n.t('current')}</Text>
                    <Text style={styles.statValue}>{data.current_avg || '-'} kg</Text>
                </View>
                <View>
                    <Text style={styles.statLabel}>{i18n.t('previous')}</Text>
                    <Text style={styles.statValue}>{data.previous_avg || '-'} kg</Text>
                </View>
                <View>
                    <Text style={styles.statLabel}>{i18n.t('change')}</Text>
                    <Text style={[styles.statValue, { color: data.diff_pct < 0 ? '#a3e635' : '#f87171' }]}>
                        {data.diff_pct}%
                    </Text>
                </View>
            </View>

            {chartData.length > 1 ? (
                <View style={{ marginVertical: 10, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.2)', padding: 10 }}>
                    <LineChart
                        data={chartData}
                        color={'#a3e635'}
                        thickness={4}
                        curved
                        isAnimated
                        areaChart
                        startFillColor={'rgba(163, 230, 53, 0.3)'}
                        endFillColor={'rgba(163, 230, 53, 0.01)'}
                        startOpacity={0.9}
                        endOpacity={0.2}
                        noOfSections={4}
                        yAxisTextStyle={{ color: '#64748b', fontSize: 10 }}
                        xAxisLabelTextStyle={{ color: '#64748b', fontSize: 10 }}
                        hideRules
                        hideYAxisText={false}
                        rulesColor="rgba(255,255,255,0.1)"
                        height={160}
                        width={Dimensions.get('window').width - 80} // Adjusted width
                        spacing={40}
                        initialSpacing={20}
                        pointerConfig={{
                            pointerStripUptoDataPoint: true,
                            pointerStripColor: 'white',
                            pointerStripWidth: 2,
                            strokeDashArray: [2, 5],
                            pointerColor: '#a3e635',
                            radius: 4,
                            pointerLabelWidth: 100,
                            pointerLabelHeight: 120,
                            activatePointersOnLongPress: true,
                            autoAdjustPointerLabelPosition: false,
                            pointerLabelComponent: items => {
                                return (
                                    <View
                                        style={{
                                            height: 100,
                                            width: 100,
                                            backgroundColor: '#1e293b',
                                            borderRadius: 4,
                                            justifyContent: 'center',
                                            paddingLeft: 16,
                                        }}>
                                        <Text style={{ color: 'white', fontSize: 12 }}>{items[0].date}</Text>
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>{items[0].value} kg</Text>
                                    </View>
                                );
                            },
                        }}
                    />
                </View>
            ) : (
                <Text style={{ color: '#64748b', textAlign: 'center', marginVertical: 20 }}>
                    {i18n.t('no_history')}
                </Text>
            )}
        </View>
    )
}

const HistoryItem = ({ item, onDelete }) => (
    <View style={styles.historyItem}>
        <View>
            <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text>
            <Text style={styles.historyTime}>{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.historyLabel}>{i18n.t('weight_kg')}</Text>
                <Text style={styles.historyValue}>{item.weight_kg} kg</Text>
            </View>
            {item.waist_cm > 0 && (
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.historyLabel}>{i18n.t('waist_cm')}</Text>
                    <Text style={styles.historyValue}>{item.waist_cm} cm</Text>
                </View>
            )}
            <TouchableOpacity onPress={() => onDelete(item.id)} style={{ padding: 4 }}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
        </View>
    </View>
);

export default function Dashboard() {
    const [trends, setTrends] = useState({});
    const [history, setHistory] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [weight, setWeight] = useState('');
    const [waist, setWaist] = useState('');

    const fetchData = async () => {
        try {
            const [trendsRes, historyRes] = await Promise.all([
                api.get('/user/trends'),
                api.get('/user/history?limit=10')
            ]);
            setTrends(trendsRes.data);
            setHistory(historyRes.data);
        } catch (e) {
            console.log("Error fetching data", e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    }, []);

    const logStats = async () => {
        if (!weight) return;
        try {
            await api.post('/user/stats', {
                weight_kg: parseFloat(weight),
                waist_cm: parseFloat(waist) || 0,
                tdee_current: 2500 // Backend handles fallback/calc
            });
            setWeight('');
            setWaist('');
            fetchData();
            // alert('Logged!'); // Removed alert for smoother UX
        } catch (e) {
            alert(i18n.t('log_error'));
        }
    }

    const deleteLog = async (id) => {
        try {
            await api.delete(`/user/history/${id}`);
            fetchData();
        } catch (e) {
            alert(i18n.t('delete_error'));
        }
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a3e635" />
            }
        >
            <View style={styles.header}>
                <Text style={styles.greeting}>{i18n.t('hello')}, Lifter</Text>
                <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
            </View>

            <TrendCard data={trends} />

            <View style={styles.card}>
                <Text style={styles.cardTitle}>{i18n.t('quick_log')}</Text>
                <View style={styles.inputRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.label}>{i18n.t('weight_kg')}</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={weight}
                            onChangeText={setWeight}
                            placeholder="0.0"
                            placeholderTextColor="#475569"
                        />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.label}>{i18n.t('waist_cm')}</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={waist}
                            onChangeText={setWaist}
                            placeholder="0.0"
                            placeholderTextColor="#475569"
                        />
                    </View>
                </View>
                <TouchableOpacity style={styles.button} onPress={logStats}>
                    <Text style={styles.buttonText}>{i18n.t('log_entry')}</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.card, { paddingBottom: 0 }]}>
                <Text style={styles.cardTitle}>{i18n.t('recent_history')}</Text>
                {history.map((item) => (
                    <HistoryItem key={item.id} item={item} onDelete={deleteLog} />
                ))}
                {history.length === 0 && (
                    <Text style={{ color: '#64748b', paddingBottom: 20 }}>{i18n.t('no_history')}</Text>
                )}
            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        padding: 24,
    },
    header: {
        marginTop: 24,
        marginBottom: 24,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    date: {
        color: '#94a3b8',
        fontSize: 14,
    },
    card: {
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardTitle: {
        color: '#a3e635',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    trendRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statLabel: {
        color: '#94a3b8',
        fontSize: 12,
    },
    statValue: {
        color: '#f8fafc',
        fontSize: 18,
        fontWeight: 'bold',
    },
    message: {
        color: '#f8fafc',
        fontStyle: 'italic',
        marginBottom: 16,
    },
    inputRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    label: {
        color: '#f8fafc',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#0f172a',
        color: 'white',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#475569',
    },
    button: {
        backgroundColor: '#38bdf8',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#0f172a',
        fontWeight: 'bold',
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    historyDate: {
        color: '#f1f5f9',
        fontWeight: '500',
    },
    historyTime: {
        color: '#64748b',
        fontSize: 12,
    },
    historyLabel: {
        color: '#64748b',
        fontSize: 10,
        textAlign: 'right',
    },
    historyValue: {
        color: '#f1f5f9',
        fontWeight: 'bold',
    }
});
