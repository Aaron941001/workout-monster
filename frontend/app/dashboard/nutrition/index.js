import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import api from '../../../utils/api';
import { Ionicons } from '@expo/vector-icons';
import FoodSearchModal from '../../../components/nutrition/FoodSearchModal';
import { t } from '../../../utils/i18n';

export default function Nutrition() {
    const [data, setData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [foodSearchVisible, setFoodSearchVisible] = useState(false);

    // Form State
    const [foodName, setFoodName] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fats, setFats] = useState('');

    const fetchData = async () => {
        try {
            const response = await api.get('/nutrition/day');
            setData(response.data);
        } catch (e) {
            console.log('Error fetching nutrition', e);
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

    const handleLogFood = async () => {
        if (!foodName || !calories) {
            Alert.alert("Missing Info", "Please enter at least a name and calories.");
            return;
        }

        try {
            await api.post('/nutrition/log', {
                name: foodName,
                calories: parseInt(calories),
                protein: parseInt(protein) || 0,
                carbs: parseInt(carbs) || 0,
                fats: parseInt(fats) || 0
            });
            setModalVisible(false);
            // Reset form
            setFoodName('');
            setCalories('');
            setProtein('');
            setCarbs('');
            setFats('');
            fetchData(); // Refresh data
        } catch (e) {
            Alert.alert("Error logging food", "Please try again.");
        }
    };

    if (!data) return <View style={styles.container}><Text style={{ color: 'white' }}>Loading...</Text></View>;

    const { targets, actuals, logs } = data;
    const remainingCals = targets.calories - actuals.calories;

    const MacroBar = ({ label, actual, target, color }) => {
        const percent = Math.min((actual / target) * 100, 100);
        return (
            <View style={styles.macroBarContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={styles.macroLabel}>{label}</Text>
                    <Text style={styles.macroValue}>{actual} / {target}g</Text>
                </View>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${percent}%`, backgroundColor: color }]} />
                </View>
            </View>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a3e635" />}
        >
            <Text style={styles.header}>Daily Nutrition</Text>

            {/* Main Calorie Card */}
            <View style={[styles.card, targets.is_training_day ? styles.trainingCard : styles.restCard]}>
                <Text style={styles.dayType}>{data.is_training_day ? "TRAINING DAY" : "REST DAY"}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                    <Text style={styles.calories}>{remainingCals}</Text>
                    <Text style={styles.calLabel}> kcal left</Text>
                </View>
                <Text style={styles.subtext}>Goal: {targets.calories} - Eaten: {actuals.calories}</Text>
            </View>

            {/* Macros */}
            <View style={styles.card}>
                <MacroBar label="Protein" actual={actuals.protein} target={targets.protein} color="#38bdf8" />
                <MacroBar label="Carbs" actual={actuals.carbs} target={targets.carbs} color="#a3e635" />
                <MacroBar label="Fats" actual={actuals.fats} target={targets.fats} color="#fbbf24" />
            </View>

            {/* Quick Add Button */}
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                <Ionicons name="add-circle" size={24} color="#0f172a" />
                <Text style={styles.addButtonText}>Log Meal</Text>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.actionButton, styles.searchButton]} onPress={() => setFoodSearchVisible(true)}>
                    <Ionicons name="search" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>{t('search_foods')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.logButton]} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Manual Log</Text>
                </TouchableOpacity>
            </View>

            {/* Logs List */}
            <Text style={styles.sectionTitle}>Today's Logs</Text>
            {logs.map((log) => (
                <View key={log.id} style={styles.logItem}>
                    <View>
                        <Text style={styles.logName}>{log.name}</Text>
                        <Text style={styles.logTime}>{new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.logCal}>{log.calories} kcal</Text>
                        <Text style={styles.logMacros}>P:{log.protein} C:{log.carbs} F:{log.fats}</Text>
                    </View>
                </View>
            ))}
            {logs.length === 0 && <Text style={{ color: '#64748b', textAlign: 'center' }}>No meals logged yet.</Text>}

            <View style={{ height: 50 }} />

            {/* Log Food Modal */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Log Food</Text>

                        <Text style={styles.inputLabel}>Food Name</Text>
                        <TextInput style={styles.input} value={foodName} onChangeText={setFoodName} placeholder="e.g. Chicken Rice" placeholderTextColor="#64748b" />

                        <Text style={styles.inputLabel}>Calories</Text>
                        <TextInput style={styles.input} value={calories} onChangeText={setCalories} keyboardType="numeric" placeholder="0" placeholderTextColor="#64748b" />

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>Protein (g)</Text>
                                <TextInput style={styles.input} value={protein} onChangeText={setProtein} keyboardType="numeric" placeholder="0" placeholderTextColor="#64748b" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>Carbs (g)</Text>
                                <TextInput style={styles.input} value={carbs} onChangeText={setCarbs} keyboardType="numeric" placeholder="0" placeholderTextColor="#64748b" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>Fats (g)</Text>
                                <TextInput style={styles.input} value={fats} onChangeText={setFats} keyboardType="numeric" placeholder="0" placeholderTextColor="#64748b" />
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleLogFood}>
                                <Text style={styles.saveText}>Save Log</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Food Search Modal */}
            <FoodSearchModal
                visible={foodSearchVisible}
                onClose={() => setFoodSearchVisible(false)}
                onSelect={() => {
                    setFoodSearchVisible(false);
                    fetchData(); // Refresh data after adding food
                }}
            />

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#0f172a',
        padding: 24,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 24,
        marginTop: 24,
    },
    card: {
        backgroundColor: '#1e293b',
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    trainingCard: {
        borderColor: '#a3e635',
        borderWidth: 1,
        backgroundColor: 'rgba(163, 230, 53, 0.1)',
    },
    restCard: {
        borderColor: '#38bdf8',
        borderWidth: 1,
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
    },
    dayType: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 4,
    },
    calories: {
        color: '#f8fafc',
        fontSize: 42,
        fontWeight: 'bold',
    },
    calLabel: {
        color: '#94a3b8',
        fontSize: 16,
        marginBottom: 8,
    },
    subtext: {
        color: '#94a3b8',
        marginTop: 4,
    },
    macroBarContainer: {
        marginBottom: 16,
    },
    macroLabel: {
        color: '#cbd5e1',
        fontSize: 14,
    },
    macroValue: {
        color: '#f8fafc',
        fontWeight: 'bold',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#0f172a',
        borderRadius: 4,
        marginTop: 6,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    addButton: {
        backgroundColor: '#a3e635',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 32,
    },
    addButtonText: {
        color: '#0f172a',
        fontWeight: 'bold',
        fontSize: 18,
        marginLeft: 8,
    },
    sectionTitle: {
        color: '#f8fafc',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    logItem: {
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    logName: {
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: 'bold',
    },
    logTime: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 4,
    },
    logCal: {
        color: '#a3e635',
        fontWeight: 'bold',
        fontSize: 16,
    },
    logMacros: {
        color: '#94a3b8',
        fontSize: 12,
        marginTop: 4,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#1e293b',
        padding: 24,
        borderRadius: 24,
    },
    modalTitle: {
        color: '#f8fafc',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputLabel: {
        color: '#94a3b8',
        marginBottom: 6,
        fontSize: 12,
    },
    input: {
        backgroundColor: '#0f172a',
        color: 'white',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
        marginTop: 8,
    },
    cancelBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#334155',
        alignItems: 'center',
    },
    cancelText: {
        color: '#f8fafc',
        fontWeight: 'bold',
    },
    saveBtn: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#a3e635',
        alignItems: 'center',
    },
    saveText: {
        color: '#0f172a',
        fontWeight: 'bold',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        gap: 8,
    },
    searchButton: {
        backgroundColor: '#3b82f6',
    },
    logButton: {
        backgroundColor: '#10b981',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
});
