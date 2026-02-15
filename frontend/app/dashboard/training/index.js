import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../../../utils/i18n';

export default function Training() {
    const router = useRouter();
    const [allPlans, setAllPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);
            const customRes = await api.get('/training/plans');
            const customPlans = customRes.data.map(p => ({ ...p, type: 'custom' }));

            const defaultPlan = {
                id: 'default',
                name: 'Default Plan (Upper/Lower)',
                type: 'default',
                exercises: [] // Placeholder
            };

            // prioritizing active plan
            setAllPlans([...customPlans, defaultPlan]);
        } catch (error) {
            console.log('Error loading plans', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlanPress = (plan) => {
        router.push(`/dashboard/training/plan/${plan.id}`);
    };

    const seedExercises = async () => {
        try {
            await api.post('/training/seed_exercises_extended');
            alert('Exercises Seeded! 動作已載入！');
        } catch (e) {
            console.log(e);
            alert('Error seeding exercises');
        }
    }

    return (
        <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadPlans} tintColor="#a3e635" />}>
            <View style={styles.headerRow}>
                <View>
                    <Text style={styles.header}>{i18n.t('training')}</Text>
                    <Text style={styles.subHeader}>{i18n.t('select_plan')}</Text>
                </View>
                <View style={styles.headerButtons}>
                    <TouchableOpacity onPress={() => router.push('/dashboard/training/create_plan')} style={styles.createPlanButton}>
                        <Ionicons name="add-circle" size={32} color="#a3e635" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/dashboard/training/exercises')}>
                        <Ionicons name="search" size={24} color="#a3e635" />
                    </TouchableOpacity>
                </View>
            </View>

            {allPlans.map((plan) => (
                <TouchableOpacity key={plan.id} style={styles.card} onPress={() => handlePlanPress(plan)}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.cardTitle}>{plan.name}</Text>
                            {plan.is_active && (
                                <View style={styles.activeBadge}>
                                    <Text style={styles.activeBadgeText}>{i18n.t('active')}</Text>
                                </View>
                            )}
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#64748b" />
                    </View>
                    <Text style={styles.cardSubtitle}>
                        {plan.type === 'default' ? i18n.t('default_plan') : i18n.t('custom_plan')}
                    </Text>
                </TouchableOpacity>
            ))}

            <TouchableOpacity onPress={seedExercises} style={{ marginTop: 50, alignItems: 'center' }}>
                <Text style={{ color: '#475569' }}>Debug: Seed Exercises</Text>
            </TouchableOpacity>
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
        fontSize: 28,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginTop: 24,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    subHeader: {
        color: '#94a3b8',
        fontSize: 14,
    },
    sectionTitle: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 10,
        marginTop: 10,
        letterSpacing: 1,
    },
    card: {
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    cardSubtitle: {
        color: '#64748b',
        fontSize: 14,
        marginTop: 2,
    },
    activeBadge: {
        backgroundColor: '#a3e635',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    activeBadgeText: {
        color: '#0f172a',
        fontSize: 10,
        fontWeight: 'bold',
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
    },
    createPlanButton: {
        padding: 4,
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#64748b',
    }
});
