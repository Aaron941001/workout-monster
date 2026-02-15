import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loginWithBiometrics } = useContext(AuthContext);
    const router = useRouter();

    const handleLogin = async () => {
        try {
            await login(email, password);
            router.replace('/dashboard');
        } catch (error) {
            const message = error.response?.data?.detail || 'Login failed. Please check your credentials';
            Alert.alert('Login Failed', message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Workout Monster</Text>

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

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.biometricButton} onPress={() => loginWithBiometrics()}>
                <Ionicons name="scan-outline" size={24} color="#a3e635" />
                <Text style={styles.biometricText}> Login with Face ID</Text>
            </TouchableOpacity>

            <Link href="/signup" asChild>
                <TouchableOpacity style={styles.linkButton}>
                    <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
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
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        padding: 12,
        borderWidth: 1,
        borderColor: '#a3e635',
        borderRadius: 12,
    },
    biometricText: {
        color: '#a3e635',
        fontWeight: 'bold',
        marginLeft: 8,
    },
});
