import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../utils/api';
import i18n from '../../../utils/i18n';

export default function ExerciseLibrary() {
    const router = useRouter();
    const [exercises, setExercises] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedMuscle, setSelectedMuscle] = useState('All');

    const muscles = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

    useEffect(() => {
        fetchExercises();
    }, [search]);

    const fetchExercises = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/training/exercises?q=${search}`);
            setExercises(res.data);
        } catch (error) {
            console.log("Error fetching exercises", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredExercises = exercises.filter(ex =>
        selectedMuscle === 'All' || ex.primary_muscle.toLowerCase() === selectedMuscle.toLowerCase()
    );

    const renderItem = ({ item }) => (
        <View style={styles.item}>
            <View>
                <Text style={styles.itemName}>
                    {i18n.locale.startsWith('zh') && item.name_zh ? item.name_zh : item.name}
                </Text>
                {i18n.locale.startsWith('zh') && item.name_zh && (
                    <Text style={styles.itemSubName}>{item.name}</Text>
                )}
                <Text style={styles.itemMeta}>
                    {i18n.t(item.primary_muscle) || item.primary_muscle} • {i18n.t(item.equipment) || item.equipment}
                </Text>
            </View>
            <Ionicons name="information-circle-outline" size={24} color="#94a3b8" />
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{i18n.t('exercise_library')}</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color="#f8fafc" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#94a3b8" />
                <TextInput
                    style={styles.input}
                    placeholder={i18n.t('search_exercises')}
                    placeholderTextColor="#94a3b8"
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <View style={styles.filterContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={muscles}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                selectedMuscle === item && styles.filterChipActive
                            ]}
                            onPress={() => setSelectedMuscle(item)}
                        >
                            <Text style={[
                                styles.filterText,
                                selectedMuscle === item && styles.filterTextActive
                            ]}>
                                {i18n.t(item.toLowerCase()) || item}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#a3e635" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={filteredExercises}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    input: {
        flex: 1,
        color: '#f8fafc',
        paddingVertical: 12,
        paddingHorizontal: 8,
        fontSize: 16,
    },
    filterContainer: {
        marginBottom: 16,
        height: 40,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1e293b',
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    filterChipActive: {
        backgroundColor: '#a3e635',
        borderColor: '#a3e635',
    },
    filterText: {
        color: '#94a3b8',
        fontWeight: '500',
    },
    filterTextActive: {
        color: '#0f172a',
        fontWeight: 'bold',
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#f8fafc',
    },
    itemSubName: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    itemMeta: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 4,
        textTransform: 'capitalize',
    },
});
