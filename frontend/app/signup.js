import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { AuthContext } from '../context/AuthContext';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const { signup } = useContext(AuthContext);
    const router = useRouter();

    const handleSignup = async () => {
        try {
            await signup(email, password, displayName);
            router.replace('/onboarding');
        } catch (error) {
            const message = error.response?.data?.detail || 'Signup failed. Please try again.';
            Alert.alert('Signup Failed', message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Join the Club</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Display Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Your Name"
                    placeholderTextColor="#94a3b8"
                    value={displayName}
                    onChangeText={setDisplayName}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter email"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSignup}>
                <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>

            <Link href="/login" asChild>
                <TouchableOpacity style={styles.linkButton}>
                    <Text style={styles.linkText}>Already have an account? Login</Text>
                </TouchableOpacity>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        padding: 24,
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#a3e635',
        textAlign: 'center',
        marginBottom: 48,
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
    },
    buttonText: {
        color: '#0f172a',
        fontWeight: 'bold',
        fontSize: 16,
    },
    linkButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    linkText: {
        color: '#38bdf8',
    },
});
