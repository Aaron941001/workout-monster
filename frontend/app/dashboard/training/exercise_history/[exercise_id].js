import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../../utils/api';
import i18n from '../../../../utils/i18n';

const SCREEN_W = Dimensions.get('window').width;

export default function ExerciseHistory() {
    const { exercise_id, exercise_name, exercise_name_zh } = useLocalSearchParams();
    const router = useRouter();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const displayName = i18n.locale?.startsWith('zh') && exercise_name_zh
        ? decodeURIComponent(exercise_name_zh)
        : decodeURIComponent(exercise_name || '');

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const resp = await api.get(`/training/exercise/${exercise_id}/history`, {
                params: { limit: 20 }
            });
            setHistory(resp.data);
        } catch (e) {
            console.log('Error fetching exercise history', e);
        } finally {
            setLoading(false);
        }
    }, [exercise_id]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Build chart data: max weight per session chronologically
    const chartData = history.map((session, idx) => ({
        value: session.max_weight,
        label: idx % 3 === 0 ? session.date.slice(5) : '',
        dataPointText: '',
    }));

    const hasData = history.length > 0;
    const maxW = hasData ? Math.max(...history.map(s => s.max_weight)) : 0;
    const totalVol = history.reduce((sum, s) => sum + s.total_volume, 0);

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#f8fafc" />
                </TouchableOpacity>
                <Text style={styles.title} numberOfLines={1}>{displayName}</Text>
                <View style={{ width: 36 }} />
            </View>

            <Text style={styles.subtitle}>{i18n.t('exercise_history')}</Text>

            {loading ? (
                <ActivityIndicator color="#a3e635" style={{ marginTop: 40 }} />
            ) : !hasData ? (
                <View style={styles.emptyBox}>
                    <Ionicons name="barbell-outline" size={48} color="#334155" />
                    <Text style={styles.emptyText}>{i18n.t('no_exercise_history')}</Text>
                </View>
            ) : (
                <>
                    {/* Stats Row */}
                    <View style={styles.statRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{maxW} kg</Text>
                            <Text style={styles.statLabel}>{i18n.t('max_weight')}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{Math.round(totalVol / history.length)} kg</Text>
                            <Text style={styles.statLabel}>{i18n.t('total_volume')} / {i18n.t('sessions')}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{history.length}</Text>
                            <Text style={styles.statLabel}>{i18n.t('sessions')}</Text>
                        </View>
                    </View>

                    {/* Max Weight Chart */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{i18n.t('max_weight')} (kg)</Text>
                        <LineChart
                            data={chartData}
                            color="#a3e635"
                            thickness={2.5}
                            curved
                            isAnimated
                            areaChart
                            startFillColor="rgba(163, 230, 53, 0.3)"
                            endFillColor="rgba(163, 230, 53, 0.02)"
                            noOfSections={4}
                            yAxisTextStyle={{ color: '#64748b', fontSize: 10 }}
                            xAxisLabelTextStyle={{ color: '#64748b', fontSize: 9 }}
                            hideRules={false}
                            rulesColor="rgba(255,255,255,0.05)"
                            height={160}
                            width={SCREEN_W - 72}
                            spacing={Math.max(20, Math.floor((SCREEN_W - 80) / Math.max(chartData.length, 1)))}
                            initialSpacing={10}
                            endSpacing={10}
                            dataPointsColor="#a3e635"
                            dataPointsRadius={3}
                            yAxisSuffix=" kg"
                        />
                    </View>

                    {/* Sessions List */}
                    <Text style={styles.sectionTitle}>
                        {i18n.t('sessions')} ({history.length})
                    </Text>
                    {[...history].reverse().map((session, idx) => (
                        <View key={idx} style={styles.sessionCard}>
                            <View style={styles.sessionHeader}>
                                <Text style={styles.sessionDate}>{session.date}</Text>
                                <Text style={styles.sessionMax}>⬆ {session.max_weight} kg</Text>
                            </View>
                            <View style={styles.setsRow}>
                                {session.sets.map((set, si) => (
                                    <View key={si} style={styles.setBadge}>
                                        <Text style={styles.setBadgeText}>
                                            {set.weight_kg}kg × {set.reps}
                                            {set.rpe ? ` @${set.rpe}` : ''}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                            <Text style={styles.sessionVol}>
                                {i18n.t('total_volume')}: {Math.round(session.total_volume)} kg·reps
                            </Text>
                        </View>
                    ))}
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 8,
    },
    backBtn: { padding: 4 },
    title: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc', flex: 1, textAlign: 'center' },
    subtitle: { color: '#64748b', fontSize: 12, textAlign: 'center', marginBottom: 20 },
    emptyBox: { flex: 1, alignItems: 'center', paddingTop: 60, gap: 16 },
    emptyText: { color: '#64748b', textAlign: 'center' },
    statRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
    statCard: {
        flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, alignItems: 'center',
    },
    statValue: { color: '#a3e635', fontWeight: 'bold', fontSize: 18 },
    statLabel: { color: '#64748b', fontSize: 11, textAlign: 'center', marginTop: 2 },
    card: { backgroundColor: '#1e293b', marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 20 },
    cardTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase' },
    sectionTitle: { color: '#f8fafc', fontWeight: 'bold', fontSize: 16, paddingHorizontal: 16, marginBottom: 10 },
    sessionCard: {
        backgroundColor: '#1e293b', marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 14,
    },
    sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    sessionDate: { color: '#94a3b8', fontSize: 13 },
    sessionMax: { color: '#a3e635', fontWeight: 'bold', fontSize: 13 },
    setsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
    setBadge: {
        backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
        borderWidth: 1, borderColor: '#334155',
    },
    setBadgeText: { color: '#f8fafc', fontSize: 12 },
    sessionVol: { color: '#64748b', fontSize: 11 },
});
