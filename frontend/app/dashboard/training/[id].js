import React, { useEffect, useState } from 'react';

import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Modal, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../../utils/api';
import { Ionicons } from '@expo/vector-icons';

export default function ActiveWorkout() {
    const { id, planId, dayName } = useLocalSearchParams(); // id = workout_id
    const router = useRouter();
    const [exercises, setExercises] = useState([]);
    const [logs, setLogs] = useState({}); // { exercise_id: [ {weight, reps, rpe...} ] }
    const [timerVisible, setTimerVisible] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [timerRunning, setTimerRunning] = useState(false);

    useEffect(() => {
        fetchPlanDetails();
    }, [planId]);

    useEffect(() => {
        let interval = null;
        if (timerRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setTimerRunning(false);
            Alert.alert("Time's up!", "Rest finished.");
            setTimerVisible(false);
        }
        return () => clearInterval(interval);
    }, [timerRunning, timeLeft]);

    const startRest = (seconds = 90) => {
        setTimeLeft(seconds);
        setTimerRunning(true);
        setTimerVisible(true);
    };

    const fetchPlanDetails = async () => {
        try {
            // Check if it's a custom plan (UUID length > 20 as a heuristic)
            if (planId && planId.length > 20) {
                const response = await api.get(`/training/plans/${planId}`);
                // response.data.days is { "Day 1": [exercises] }
                // We need to decode dayName because it might have spaces/special chars
                const decodedDayName = decodeURIComponent(dayName);
                const dayExercises = response.data.days[decodedDayName];

                if (dayExercises) {
                    setExercises(dayExercises);
                } else {
                    // Fallback: try finding by key match if decoding fails or subtle mismatch
                    const match = Object.entries(response.data.days).find(([k, v]) => k === dayName);
                    if (match) setExercises(match[1]);
                }
            } else {
                // Default Plan (Legacy)
                const response = await api.get('/training/plan');
                const allDays = response.data.days;
                const currentPlan = allDays.find(d => d.id === planId);
                if (currentPlan) {
                    setExercises(currentPlan.exercises); // [{id, name}, ...]
                }
            }
        } catch (e) {
            console.log(e);
            Alert.alert("Error fetching plan");
        }
    };

    const addSet = (exerciseId) => {
        const currentSets = logs[exerciseId] || [];
        const previousSet = currentSets.length > 0 ? currentSets[currentSets.length - 1] : { weight: '', reps: '', rpe: '' };

        const newSet = { ...previousSet, set_order: currentSets.length + 1, completed: false, id: Date.now() }; // Temp ID
        setLogs({
            ...logs,
            [exerciseId]: [...currentSets, newSet]
        });
    };

    const updateSet = (exerciseId, index, field, value) => {
        const newSets = [...(logs[exerciseId] || [])];
        newSets[index][field] = value;
        setLogs({ ...logs, [exerciseId]: newSets });
    };

    const completeSet = async (exerciseId, index) => {
        const set = logs[exerciseId][index];

        if (!set.weight || !set.reps || !set.rpe) {
            Alert.alert("Missing fields", "Please fill in Weight, Reps, and RPE.");
            return;
        }

        try {
            const payload = {
                workout_id: id,
                exercise_id: exerciseId,
                set_order: set.set_order,
                weight_kg: parseFloat(set.weight),
                reps: parseInt(set.reps),
                rpe: parseFloat(set.rpe)
            };

            const response = await api.post('/training/set', payload);

            const newSets = [...logs[exerciseId]];
            newSets[index].completed = true;
            newSets[index].suggestion = response.data.suggestion;
            setLogs({ ...logs, [exerciseId]: newSets });

            // Auto-start rest timer
            startRest(90);

        } catch (e) {
            console.log(e);
            Alert.alert("Error logging set", "Check network or input.");
        }
    };

    const finishWorkout = async () => {
        try {
            await api.post(`/training/session/finish?workout_id=${id}`);
            Alert.alert("Workout Finished!", "Great job.");
            router.replace('/dashboard/training');
        } catch (e) {
            Alert.alert("Error finishing");
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.header}>Active Session</Text>
                <TouchableOpacity onPress={() => startRest(60)} style={styles.timerBtn}>
                    <Ionicons name="timer-outline" size={24} color="#a3e635" />
                </TouchableOpacity>
            </View>

            {exercises.map((ex, index) => {
                // Use ex.exercise_id if available (custom plan), otherwise ex.id (default plan)
                // This ensures we log against the actual Exercise ID, not the PlanExercise ID
                const loggingId = ex.exercise_id || ex.id;

                return (
                    <View key={`${ex.id}-${index}`} style={styles.exerciseCard}>
                        <Text style={styles.exerciseTitle}>{ex.name}</Text>

                        <View style={styles.tableHeader}>
                            <Text style={[styles.col, { flex: 0.5 }]}>#</Text>
                            <Text style={[styles.col, { flex: 2 }]}>kg</Text>
                            <Text style={[styles.col, { flex: 2 }]}>Reps</Text>
                            <Text style={[styles.col, { flex: 2 }]}>RPE</Text>
                            <Text style={[styles.col, { flex: 1.5 }]}>Log</Text>
                        </View>

                        {(logs[loggingId] || []).map((set, i) => (
                            <View key={i} style={styles.setRow}>
                                <Text style={[styles.colText, { flex: 0.5 }]}>{i + 1}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={set.weight ? set.weight.toString() : ''}
                                    onChangeText={(v) => updateSet(loggingId, i, 'weight', v)}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#475569"
                                />
                                <TextInput
                                    style={styles.input}
                                    value={set.reps ? set.reps.toString() : ''}
                                    onChangeText={(v) => updateSet(loggingId, i, 'reps', v)}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#475569"
                                />
                                <TextInput
                                    style={styles.input}
                                    value={set.rpe ? set.rpe.toString() : ''}
                                    onChangeText={(v) => updateSet(loggingId, i, 'rpe', v)}
                                    keyboardType="numeric"
                                    placeholder="-"
                                    placeholderTextColor="#475569"
                                />
                                <TouchableOpacity
                                    style={[styles.checkBtn, set.completed && styles.checkedBtn]}
                                    onPress={() => completeSet(loggingId, i)}
                                    disabled={set.completed}
                                >
                                    <Text style={{ color: '#0f172a', fontWeight: 'bold' }}>
                                        {set.completed ? '✓' : 'GO'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ))}

                        {/* Show request to add set if empty */}
                        {(logs[loggingId] || []).length === 0 && (
                            <Text style={{ color: '#64748b', textAlign: 'center', marginBottom: 10, fontSize: 12 }}>
                                No sets added yet.
                            </Text>
                        )}

                        {logs[loggingId] && logs[loggingId].some(s => s.suggestion) && (
                            <Text style={styles.suggestion}>
                                💡 {logs[loggingId].filter(s => s.suggestion).pop().suggestion}
                            </Text>
                        )}

                        <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(loggingId)}>
                            <Text style={styles.addSetText}>+ Add Set</Text>
                        </TouchableOpacity>
                    </View>
                );
            })}

            <TouchableOpacity style={styles.finishBtn} onPress={finishWorkout}>
                <Text style={styles.finishText}>Finish Workout</Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.8 }}>
                <Image
                    source={require('../../../assets/images/monster_lifting.png')}
                    style={{ width: 120, height: 120 }}
                    resizeMode="contain"
                />
                <Text style={{ color: '#64748b', marginTop: 10, fontStyle: 'italic' }}>Keep Pushing!</Text>
            </View>

            <View style={{ height: 100 }} />

            {/* Simple Timer Modal */}
            <Modal transparent={true} visible={timerVisible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.timerCard}>
                        <Text style={styles.timerTitle}>Resting</Text>
                        <Image
                            source={require('../../../assets/images/monster_sleeping.png')}
                            style={{ width: 150, height: 150, marginBottom: 20 }}
                            resizeMode="contain"
                        />
                        <Text style={styles.timerValue}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</Text>
                        <View style={styles.timerControls}>
                            <TouchableOpacity onPress={() => setTimeLeft(timeLeft + 10)}><Text style={styles.timerControlText}>+10s</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => setTimerVisible(false)}><Text style={[styles.timerControlText, { color: '#f87171' }]}>Skip</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 24,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#a3e635',
    },
    timerBtn: {
        padding: 8,
    },
    exerciseCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    exerciseTitle: {
        color: '#f8fafc',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    tableHeader: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    col: {
        color: '#94a3b8',
        fontSize: 12,
        textAlign: 'center',
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    colText: {
        color: '#f8fafc',
        textAlign: 'center',
    },
    input: {
        flex: 2,
        backgroundColor: '#0f172a',
        color: 'white',
        borderRadius: 8,
        padding: 10,
        textAlign: 'center',
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#334155'
    },
    checkBtn: {
        flex: 1.5,
        backgroundColor: '#38bdf8',
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    checkedBtn: {
        backgroundColor: '#a3e635',
    },
    addSetBtn: {
        marginTop: 8,
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 8,
        borderStyle: 'dashed',
    },
    addSetText: {
        color: '#94a3b8',
        fontWeight: 'bold',
    },
    finishBtn: {
        backgroundColor: '#a3e635',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    finishText: {
        color: '#0f172a',
        fontWeight: 'bold',
        fontSize: 18,
    },
    suggestion: {
        color: '#38bdf8',
        marginTop: 8,
        marginBottom: 8,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timerCard: {
        backgroundColor: '#1e293b',
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        minWidth: 200,
    },
    timerTitle: {
        color: '#94a3b8',
        marginBottom: 10,
    },
    timerValue: {
        color: '#a3e635',
        fontSize: 48,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    timerControls: {
        flexDirection: 'row',
        gap: 20,
    },
    timerControlText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
