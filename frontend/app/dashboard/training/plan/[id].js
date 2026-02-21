import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, ImageBackground, Image } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import api from '../../../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../../../../utils/i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { setPendingExercises } from '../../../../utils/workoutStore';

export default function PlanDetails() {
    const { id } = useLocalSearchParams(); // Plan ID
    const router = useRouter();
    const [plan, setPlan] = useState(null);
    const [days, setDays] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchPlanDetails();
        }, [id])
    );

    const fetchPlanDetails = async () => {
        try {
            // setLoading(true); // Don't wipe screen on refocus
            let daysData = [];
            let planName = "";

            if (id === 'default') {
                const response = await api.get('/training/plan');
                daysData = response.data.days;
                planName = i18n.t('default_plan');
                setPlan({ name: planName, is_active: true, type: 'default' });
            } else {
                const response = await api.get(`/training/plans/${id}`);
                planName = response.data.name;
                setPlan({ ...response.data, type: 'custom' });

                daysData = Object.entries(response.data.days || {}).map(([dayName, exercises], index) => ({
                    id: dayName,
                    name: dayName,
                    exercises: exercises,
                    isCustom: true
                }));
            }
            setDays(daysData);
        } catch (error) {
            console.log("Error fetching plan details", error);
        } finally {
            setLoading(false);
        }
    };

    const activatePlan = async () => {
        if (id === 'default') return;
        try {
            await api.post(`/training/plans/${id}/activate`);
            alert(i18n.t('plan_saved')); // Reuse simple success msg or add 'activated'
            fetchPlanDetails();
        } catch (e) {
            console.log(e);
            alert(i18n.t('error_saving'));
        }
    }

    const startWorkout = async (dayIdentifier, dayExercises) => {
        try {
            let url = '/training/session/start';

            if (id !== 'default') {
                url += `?plan_id=${id}`;
            } else {
                url += `?plan_id=${dayIdentifier}`;
            }

            const response = await api.post(url);
            const workoutId = response.data.id;

            // Store exercises in module-level store (avoids URL param size limits)
            setPendingExercises(dayExercises || []);

            router.push({
                pathname: `/dashboard/training/${workoutId}`,
                params: {
                    planId: id !== 'default' ? id : dayIdentifier,
                    dayName: dayIdentifier,
                }
            });
        } catch (e) {
            console.log('Error starting session', e);
            alert(i18n.t('error_saving'));
        }
    }

    const editPlan = () => {
        router.push(`/dashboard/training/create_plan?id=${id}`);
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#a3e635" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('../../../../assets/images/monster_sleeping.png')}
                style={styles.headerBackground}
                imageStyle={{ opacity: 0.1, resizeMode: 'cover', top: -50 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={styles.title}>{plan?.name}</Text>
                        <Text style={styles.subtitle}>{days.length} {i18n.t('days')}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {id !== 'default' && (
                            <>
                                <TouchableOpacity onPress={editPlan} style={styles.iconBtn}>
                                    <Ionicons name="create-outline" size={24} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={activatePlan} style={styles.iconBtn}>
                                    <Ionicons name={plan?.is_active ? "star" : "star-outline"} size={24} color={plan?.is_active ? "#a3e635" : "#fff"} />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </ImageBackground>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                <Text style={styles.sectionHeader}>{i18n.t('select_plan')}</Text>

                {days.map((day, index) => (
                    <View key={index}>
                        <LinearGradient
                            colors={['rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 0.95)']}
                            style={styles.card}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.cardHeader}>
                                <View style={styles.dayBadge}>
                                    <Text style={styles.dayBadgeText}>
                                        {i18n.locale?.startsWith('zh') ? `第${index + 1}天` : `DAY ${index + 1}`}
                                    </Text>
                                </View>
                                <Text style={styles.cardTitle}>{day.name}</Text>
                            </View>

                            {/* Exercise list — each row tappable to view history */}
                            <View style={styles.exercisePreview}>
                                {day.exercises.map((e, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={styles.exerciseRow}
                                        onPress={() => router.push({
                                            pathname: `/dashboard/training/exercise_history/${e.exercise_id || e.id}`,
                                            params: {
                                                exercise_id: e.exercise_id || e.id,
                                                exercise_name: encodeURIComponent(e.name || ''),
                                                exercise_name_zh: encodeURIComponent(e.name_zh || ''),
                                            }
                                        })}
                                    >
                                        <Text style={styles.exerciseText}>
                                            {i18n.locale?.startsWith('zh') && e.name_zh ? e.name_zh : e.name}
                                        </Text>
                                        <Ionicons name="trending-up-outline" size={14} color="#475569" />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity onPress={() => startWorkout(day.id || day.name, day.exercises)} style={styles.startBadge}>
                                <Text style={styles.startText}>{i18n.t('start_workout')}</Text>
                                <Ionicons name="arrow-forward" size={16} color="#0f172a" />
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    headerBackground: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#1e293b',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    iconBtn: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f8fafc',
        textAlign: 'center',
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: 12,
        marginTop: 4,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionHeader: {
        color: '#a3e635',
        fontWeight: 'bold',
        marginBottom: 16,
        letterSpacing: 1,
        fontSize: 12,
    },
    card: {
        borderRadius: 20,
        marginBottom: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    dayBadge: {
        backgroundColor: 'rgba(163, 230, 53, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(163, 230, 53, 0.3)',
    },
    dayBadgeText: {
        color: '#a3e635',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    exercisePreview: {
        marginBottom: 16,
    },
    exerciseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    exerciseText: {
        color: '#94a3b8',
        fontSize: 14,
        flex: 1,
    },
    startBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#a3e635',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    startText: {
        color: '#0f172a',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
