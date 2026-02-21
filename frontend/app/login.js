import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { AuthContext } from '../context/AuthContext';
import i18n from '../utils/i18n';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [lang, setLang] = useState(i18n.locale?.startsWith('zh') ? 'zh' : 'en');
    const { login } = useContext(AuthContext);
    const router = useRouter();

    const toggleLanguage = () => {
        const newLang = lang === 'en' ? 'zh' : 'en';
        i18n.locale = newLang;
        setLang(newLang);
    };

    const handleLogin = async () => {
        try {
            await login(email, password);
            router.replace('/dashboard');
        } catch (error) {
            const message = error.response?.data?.detail || i18n.t('check_credentials');
            Alert.alert(i18n.t('login_failed'), message);
        }
    };

    return (
        <View style={styles.container}>
            {/* Language Toggle */}
            <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
                <Text style={styles.langText}>{lang === 'en' ? '中文' : 'EN'}</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Workout Monster</Text>
            <Text style={styles.subtitle}>{lang === 'zh' ? '你最強的訓練夥伴' : 'Your ultimate training companion'}</Text>

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

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>{i18n.t('login')}</Text>
            </TouchableOpacity>

            <Link href="/signup" asChild>
                <TouchableOpacity style={styles.linkButton}>
                    <Text style={styles.linkText}>{i18n.t('dont_have_account')}</Text>
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
        fontSize: 36,
        fontWeight: 'bold',
        color: '#a3e635',
        textAlign: 'center',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 40,
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
        marginTop: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#0f172a',
        fontWeight: 'bold',
        fontSize: 16,
    },
    linkButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    linkText: {
        color: '#38bdf8',
    },
});
