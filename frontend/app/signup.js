import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { AuthContext } from '../context/AuthContext';
import i18n from '../utils/i18n';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [lang, setLang] = useState(i18n.locale?.startsWith('zh') ? 'zh' : 'en');
    const { signup } = useContext(AuthContext);
    const router = useRouter();

    const toggleLanguage = () => {
        const newLang = lang === 'en' ? 'zh' : 'en';
        i18n.locale = newLang;
        setLang(newLang);
    };

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
            {/* Language Toggle */}
            <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
                <Text style={styles.langText}>{lang === 'en' ? '中文' : 'EN'}</Text>
            </TouchableOpacity>

            <Text style={styles.title}>{lang === 'zh' ? '加入俱樂部' : 'Join the Club'}</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>{lang === 'zh' ? '顯示名稱' : 'Display Name'}</Text>
                <TextInput
                    style={styles.input}
                    placeholder={lang === 'zh' ? '您的名稱' : 'Your Name'}
                    placeholderTextColor="#94a3b8"
                    value={displayName}
                    onChangeText={setDisplayName}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>{i18n.t('email')}</Text>
                <TextInput
                    style={styles.input}
                    placeholder={i18n.t('email')}
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>{i18n.t('password')}</Text>
                <TextInput
                    style={styles.input}
                    placeholder={i18n.t('password')}
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSignup}>
                <Text style={styles.buttonText}>{i18n.t('signup')}</Text>
            </TouchableOpacity>

            <Link href="/login" asChild>
                <TouchableOpacity style={styles.linkButton}>
                    <Text style={styles.linkText}>{i18n.t('already_have_account')}</Text>
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
    langToggle: {
        position: 'absolute',
        top: 56,
        right: 24,
        backgroundColor: '#1e293b',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    langText: {
        color: '#a3e635',
        fontWeight: 'bold',
        fontSize: 13,
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
