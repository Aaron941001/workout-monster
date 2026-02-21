import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Dimensions
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import api from '../../../utils/api';
import i18n from '../../../utils/i18n';

const SCREEN_W = Dimensions.get('window').width;

const RANGES = [7, 30, 60];
const FILTERS = ['calories', 'protein', 'carbs', 'fats'];
const FILTER_COLORS = {
    calories: '#a3e635',
    protein: '#38bdf8',
    carbs: '#fb923c',
    fats: '#fbbf24',
};

function formatDate(d) {
    return d.toISOString().split('T')[0];
}
function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}
function filterLabel(f) {
    const map = { calories: i18n.t('kcal'), protein: 'Protein', carbs: 'Carbs', fats: 'Fats' };
    const mapZh = { calories: i18n.t('kcal'), protein: '蛋白質', carbs: '碳水', fats: '脂肪' };
    return i18n.locale?.startsWith('zh') ? mapZh[f] : map[f];
}

export default function NutritionHistory() {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dayData, setDayData] = useState(null);
    const [chartData30, setChartData30] = useState([]);
    const [filter, setFilter] = useState('calories');
    const [range, setRange] = useState(30);
    const [loading, setLoading] = useState(false);
    const [chartLoading, setChartLoading] = useState(false);

    const fetchDay = useCallback(async (date) => {
        setLoading(true);
        try {
            const resp = await api.get('/nutrition/day', { params: { date: formatDate(date) } });
            setDayData(resp.data);
        } catch (e) {
            console.log('Error fetching day', e);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRange = useCallback(async (days) => {
        setChartLoading(true);
        try {
            const today = new Date();
            const results = await Promise.all(
                Array.from({ length: days }, (_, i) => {
                    const d = addDays(today, -(days - 1 - i));
                    return api.get('/nutrition/day', { params: { date: formatDate(d) } })
                        .then(r => ({ date: formatDate(d), actuals: r.data.actuals, targets: r.data.targets }))
                        .catch(() => ({ date: formatDate(d), actuals: {}, targets: {} }));
                })
            );
            setChartData30(results);
        } catch (e) {
            console.log('Error fetching range', e);
        } finally {
            setChartLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        fetchDay(selectedDate);
        fetchRange(range);
    }, []));

    const changeRange = (r) => {
        setRange(r);
        fetchRange(r);
    };

    // Build actual-value chart points + a flat target reference line
    const buildChartPoints = () => {
        return chartData30.map((day, idx) => {
            const actual = day.actuals?.[filter] || 0;
            return {
                value: actual,
                label: idx % Math.ceil(range / 7) === 0 ? day.date.slice(5) : '',
                dataPointText: '',
                hideDataPoint: true,    // no black dots
            };
        });
    };

    const avgTarget = chartData30.length > 0
        ? Math.round(chartData30.reduce((s, d) => s + (d.targets?.[filter] || 0), 0) / chartData30.length)
        : 0;

    const goDay = (delta) => {
        const d = addDays(selectedDate, delta);
        setSelectedDate(d);
        fetchDay(d);
    };

    const isToday = formatDate(selectedDate) === formatDate(new Date());
    const actuals = dayData?.actuals || {};
    const targets = dayData?.targets || {};
    const logs = dayData?.logs || [];

    const handleDeleteLog = async (logId) => {
        try {
            await api.delete(`/nutrition/log/${logId}`);
            fetchDay(selectedDate);
            fetchRange(range);
        } catch (e) {
            console.log('Delete error', e);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#f8fafc" />
                </TouchableOpacity>
                <Text style={styles.title}>{i18n.t('nutrition_history')}</Text>
                <View style={{ width: 32 }} />
            </View>

            {/* Chart Card */}
            <View style={styles.card}>
                {/* Range selector */}
                <View style={styles.rangeRow}>
                    {RANGES.map(r => (
                        <TouchableOpacity
                            key={r}
                            style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
                            onPress={() => changeRange(r)}
                        >
                            <Text style={[styles.rangeBtnText, range === r && styles.rangeBtnTextActive]}>
                                {i18n.t(`days_${r}`)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Filter tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                    {FILTERS.map(f => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterTab, filter === f && { backgroundColor: FILTER_COLORS[f] + '33', borderColor: FILTER_COLORS[f] }]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.filterTabText, filter === f && { color: FILTER_COLORS[f] }]}>
                                {filterLabel(f)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {chartLoading ? (
                    <ActivityIndicator color="#a3e635" style={{ marginVertical: 30 }} />
                ) : chartData30.length > 0 ? (
                    <>
                        {/* Chart container with target line overlay */}
                        <View style={{ position: 'relative' }}>
                            <LineChart
                                data={buildChartPoints()}
                                color={FILTER_COLORS[filter]}
                                thickness={2.5}
                                curved
                                isAnimated
                                areaChart
                                startFillColor={FILTER_COLORS[filter] + '44'}
                                endFillColor={FILTER_COLORS[filter] + '05'}
                                noOfSections={4}
                                yAxisTextStyle={{ color: '#64748b', fontSize: 9 }}
                                xAxisLabelTextStyle={{ color: '#64748b', fontSize: 8 }}
                                hideRules={false}
                                rulesColor="rgba(255,255,255,0.04)"
                                height={140}
                                width={SCREEN_W - 72}
                                spacing={Math.max(6, Math.floor((SCREEN_W - 80) / Math.max(chartData30.length, 1)))}
                                initialSpacing={4}
                                endSpacing={4}
                                hideDataPoints
                                showDataPointOnFocus={false}
                            />
                            {/* Target line overlay — positioned proportionally */}
                            {avgTarget > 0 && (() => {
                                const maxVal = Math.max(...chartData30.map(d => d.actuals?.[filter] || 0), avgTarget);
                                const pct = avgTarget / maxVal;  // 0..1 where 1=top
                                // chart area top padding ~10, bottom ~30 for labels
                                const chartAreaH = 140;
                                const topOffset = 10 + (1 - pct) * (chartAreaH - 10);
                                return (
                                    <View
                                        pointerEvents="none"
                                        style={{
                                            position: 'absolute',
                                            left: 44,   // after y-axis labels
                                            right: 0,
                                            top: topOffset,
                                            borderTopWidth: 1.5,
                                            borderColor: '#94a3b8',
                                            borderStyle: 'dashed',
                                        }}
                                    />
                                );
                            })()}
                        </View>
                        <View style={styles.legendRow}>
                            <View style={[styles.legendDot, { backgroundColor: FILTER_COLORS[filter] }]} />
                            <Text style={styles.legendText}>{filterLabel(filter)}</Text>
                            <View style={{ width: 24, height: 1.5, backgroundColor: '#94a3b8', marginLeft: 12, marginRight: 4 }} />
                            <Text style={styles.legendText}>{i18n.t('target')} ({avgTarget})</Text>
                        </View>
                    </>
                ) : (
                    <Text style={styles.emptyText}>{i18n.t('no_history')}</Text>
                )}
            </View>

            {/* Date Navigator */}
            <View style={styles.dateNav}>
                <TouchableOpacity onPress={() => goDay(-1)} style={styles.dateArrow}>
                    <Ionicons name="chevron-back" size={22} color="#a3e635" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.dateLabel}>{formatDate(selectedDate)}</Text>
                    {isToday && <Text style={styles.todayBadge}>{i18n.locale?.startsWith('zh') ? '今天' : 'Today'}</Text>}
                </View>
                <TouchableOpacity onPress={() => goDay(1)} style={[styles.dateArrow, isToday && { opacity: 0.3 }]} disabled={isToday}>
                    <Ionicons name="chevron-forward" size={22} color="#a3e635" />
                </TouchableOpacity>
            </View>

            {/* Day Macro Summary */}
            {loading ? (
                <ActivityIndicator color="#a3e635" style={{ marginVertical: 24 }} />
            ) : (
                <>
                    <View style={styles.macroRow}>
                        {FILTERS.map(f => {
                            const actual = actuals[f] || 0;
                            const target = targets[f] || 1;
                            const pct = Math.min(Math.round((actual / target) * 100), 100);
                            const color = FILTER_COLORS[f];
                            return (
                                <View key={f} style={[styles.macroChip, { borderColor: color + '55' }]}>
                                    <Text style={[styles.macroChipLabel, { color }]}>{filterLabel(f)}</Text>
                                    <Text style={styles.macroChipValue}>{actual}</Text>
                                    <Text style={styles.macroChipTarget}>/ {target}</Text>
                                    <View style={styles.macroBarBg}>
                                        <View style={[styles.macroBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    <Text style={styles.logsTitle}>
                        {i18n.locale?.startsWith('zh') ? '飲食記錄' : 'Food Logs'}
                        <Text style={{ fontSize: 13, color: '#64748b' }}> ({logs.length})</Text>
                    </Text>

                    {logs.length === 0 ? (
                        <Text style={styles.emptyText}>{i18n.t('no_history')}</Text>
                    ) : (
                        logs.map(log => (
                            <View key={log.id} style={styles.logItem}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.logName}>{log.name}</Text>
                                    <Text style={styles.logTime}>
                                        {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                                        <Text style={[styles.macroTag, { color: '#38bdf8' }]}>P {log.protein}g</Text>
                                        <Text style={[styles.macroTag, { color: '#fb923c' }]}>C {log.carbs}g</Text>
                                        <Text style={[styles.macroTag, { color: '#fbbf24' }]}>F {log.fats}g</Text>
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                                    <Text style={styles.logCal}>{log.calories} {i18n.t('kcal')}</Text>
                                    <TouchableOpacity onPress={() => handleDeleteLog(log.id)}>
                                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16,
    },
    backBtn: { padding: 4 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#f8fafc' },
    card: { backgroundColor: '#1e293b', marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16 },
    rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    rangeBtn: {
        flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
        borderColor: '#334155', alignItems: 'center',
    },
    rangeBtnActive: { backgroundColor: '#a3e63522', borderColor: '#a3e635' },
    rangeBtnText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
    rangeBtnTextActive: { color: '#a3e635' },
    filterTab: {
        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
        borderWidth: 1, borderColor: '#334155', marginRight: 8,
    },
    filterTabText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
    legendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
    legendText: { color: '#64748b', fontSize: 11 },
    emptyText: { color: '#64748b', textAlign: 'center', marginVertical: 20 },
    dateNav: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, marginBottom: 16, backgroundColor: '#1e293b',
        marginHorizontal: 16, borderRadius: 14, paddingVertical: 12,
    },
    dateArrow: { padding: 6 },
    dateLabel: { color: '#f8fafc', fontWeight: 'bold', fontSize: 16 },
    todayBadge: { color: '#a3e635', fontSize: 11, marginTop: 2 },
    macroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 20 },
    macroChip: {
        flex: 1, minWidth: '44%', backgroundColor: '#1e293b',
        borderRadius: 12, padding: 12, borderWidth: 1,
    },
    macroChipLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
    macroChipValue: { color: '#f8fafc', fontWeight: 'bold', fontSize: 20 },
    macroChipTarget: { color: '#64748b', fontSize: 12, marginBottom: 8 },
    macroBarBg: { height: 4, backgroundColor: '#0f172a', borderRadius: 2 },
    macroBarFill: { height: '100%', borderRadius: 2 },
    logsTitle: { color: '#f8fafc', fontWeight: 'bold', fontSize: 16, marginHorizontal: 16, marginBottom: 12 },
    logItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b',
        marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12,
    },
    logName: { color: '#f8fafc', fontWeight: '600', fontSize: 15, marginBottom: 2 },
    logTime: { color: '#64748b', fontSize: 12 },
    macroTag: { fontSize: 12, fontWeight: '600' },
    logCal: { color: '#a3e635', fontWeight: 'bold', fontSize: 15 },
});
