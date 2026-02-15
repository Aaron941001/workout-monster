import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

export default function Onboarding() {
    const router = useRouter();
    const [form, setForm] = useState({
        age: '',
        gender: 'male',
        height_cm: '',
        weight_kg: '',
        activity_level: 'moderately_active',
        goal: 'cut'
    });

    const handleSubmit = async () => {
        try {
            // Validate inputs
            if (!form.age || !form.height_cm || !form.weight_kg) {
                Alert.alert('Missing Data', 'Please fill in all fields');
                return;
            }

            const payload = {
                age: parseInt(form.age),
                gender: form.gender,
                height_cm: parseFloat(form.height_cm),
                weight_kg: parseFloat(form.weight_kg),
                activity_level: form.activity_level,
                goal: form.goal
            };

            await api.put('/user/onboarding', payload);
            router.replace('/dashboard');
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Failed to save profile');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Let's Calibrate</Text>
            <Text style={styles.subtitle}>We need this to calculate your initial macros.</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={form.age}
                    onChangeText={(t) => setForm({ ...form, age: t })}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Gender (male/female)</Text>
                <TextInput
                    style={styles.input}
                    value={form.gender}
                    onChangeText={(t) => setForm({ ...form, gender: t })}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Height (cm)</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={form.height_cm}
                    onChangeText={(t) => setForm({ ...form, height_cm: t })}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={form.weight_kg}
                    onChangeText={(t) => setForm({ ...form, weight_kg: t })}
                />
            </View>

            {/* Simplified Dropdowns as TextInputs for MVP */}
            <View style={styles.inputContainer}>
                <Text style={styles.label}>Activity (sedentary, lightly_active...)</Text>
                <TextInput
                    style={styles.input}
                    value={form.activity_level}
                    onChangeText={(t) => setForm({ ...form, activity_level: t })}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Goal (cut, bulk, maintain)</Text>
                <TextInput
                    style={styles.input}
                    value={form.goal}
                    onChangeText={(t) => setForm({ ...form, goal: t })}
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Generate Plan</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#0f172a',
        padding: 24,
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#a3e635',
        marginBottom: 8,
    },
    subtitle: {
        color: '#94a3b8',
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        color: '#f8fafc',
        marginBottom: 8,
        fontSize: 14,
    },
    input: {
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    button: {
        backgroundColor: '#a3e635',
        padding: 16,
        borderRadius: 12,
        marginTop: 24,
        alignItems: 'center',
        marginBottom: 40,
    },
    buttonText: {
        color: '#0f172a',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
