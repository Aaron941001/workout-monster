import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import i18n from '../../utils/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {
    const { logout } = useContext(AuthContext);
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [currentLang, setCurrentLang] = useState(i18n.locale);
    const [apiKey, setApiKey] = useState('');
    const [hasKey, setHasKey] = useState(false);
    const [keySaving, setKeySaving] = useState(false);

    useEffect(() => {
        fetchUser();
        loadLanguage();
        checkAiKey();
    }, []);

    const loadLanguage = async () => {
        try {
            const savedLang = await AsyncStorage.getItem('userLanguage');
            if (savedLang) {
                i18n.locale = savedLang;
                setCurrentLang(savedLang);
            }
        } catch (e) {
            console.log('Error loading language', e);
        }
    };

    const switchLanguage = async (lang) => {
        try {
            i18n.locale = lang;
            setCurrentLang(lang);
            await AsyncStorage.setItem('userLanguage', lang);
            // Force re-render by updating state
        } catch (e) {
            console.log('Error saving language', e);
        }
    };

    const fetchUser = async () => {
        try {
            const res = await api.get('/user/me');
            setUser(res.data);
        } catch (e) {
            console.log(e);
            if (e.response && e.response.status === 401) {
                Alert.alert(i18n.t('session_expired'), i18n.t('please_login_again'), [
                    { text: i18n.t('ok'), onPress: handleLogout }
                ]);
            }
        }
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/');
    };

    const checkAiKey = async () => {
        try {
            const res = await api.get('/ai/key');
            setHasKey(res.data.has_key);
        } catch (e) { /* ignore */ }
    };

    const saveApiKey = async () => {
        if (!apiKey.trim()) return;
        setKeySaving(true);
        try {
            await api.post('/ai/key', { api_key: apiKey.trim() });
            setHasKey(true);
            setApiKey('');
            Alert.alert('', i18n.t('ai_key_saved'));
        } catch (e) {
            Alert.alert('Error', 'Failed to save key');
        } finally {
            setKeySaving(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>{i18n.t('profile')}</Text>

            {user ? (
                <View style={styles.card}>
                    <Text style={styles.label}>Name</Text>
                    <Text style={styles.value}>{user.display_name}</Text>

                    <Text style={styles.label}>{i18n.t('email')}</Text>
                    <Text style={styles.value}>{user.email}</Text>

                    <Text style={styles.label}>Goal</Text>
                    <Text style={styles.valueUpper}>{user.settings?.goal || 'Not set'}</Text>
                </View>
            ) : (
                <View style={styles.card}>
                    <Text style={{ color: '#94a3b8', textAlign: 'center' }}>{i18n.t('loading')}</Text>
                </View>
            )}

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Language / 語言</Text>
                <View style={styles.languageRow}>
                    <TouchableOpacity
                        style={[styles.langButton, currentLang.startsWith('en') && styles.langButtonActive]}
                        onPress={() => switchLanguage('en')}
                    >
                        <Text style={[styles.langText, currentLang.startsWith('en') && styles.langTextActive]}>
                            English
                        </Text>
                        {currentLang.startsWith('en') && <Ionicons name="checkmark-circle" size={20} color="#a3e635" />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.langButton, currentLang.startsWith('zh') && styles.langButtonActive]}
                        onPress={() => switchLanguage('zh')}
                    >
                        <Text style={[styles.langText, currentLang.startsWith('zh') && styles.langTextActive]}>
                            中文
                        </Text>
                        {currentLang.startsWith('zh') && <Ionicons name="checkmark-circle" size={20} color="#a3e635" />}
                    </TouchableOpacity>
                </View>
            </View>

            {/* AI Coach Settings */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>{i18n.t('ai_coach_settings')}</Text>
                <Text style={styles.label}>
                    {hasKey ? i18n.t('ai_key_status_set') : i18n.t('ai_key_status_none')}
                </Text>
                <TextInput
                    style={styles.keyInput}
                    value={apiKey}
                    onChangeText={setApiKey}
                    placeholder={i18n.t('ai_key_placeholder')}
                    placeholderTextColor="#475569"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <TouchableOpacity
                    style={[styles.saveKeyBtn, keySaving && { opacity: 0.5 }]}
                    onPress={saveApiKey}
                    disabled={keySaving}
                >
                    <Text style={styles.saveKeyText}>{keySaving ? i18n.t('loading') : i18n.t('ai_key_save')}</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogout}>
                <Text style={styles.buttonText}>{i18n.t('logout')}</Text>
            </TouchableOpacity>

            <Text style={styles.version}>Workout Monster v0.1.0</Text>
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
        padding: 24,
        borderRadius: 16,
        marginBottom: 32,
    },
    label: {
        color: '#94a3b8',
        fontSize: 14,
        marginBottom: 4,
    },
    value: {
        color: '#f8fafc',
        fontSize: 18,
        marginBottom: 16,
    },
    valueUpper: {
        color: '#a3e635',
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    button: {
        backgroundColor: '#ef4444',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    version: {
        color: '#475569',
        textAlign: 'center',
        marginTop: 32,
    },
    sectionTitle: {
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    languageRow: {
        flexDirection: 'row',
        gap: 12,
    },
    langButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#475569',
    },
    langButtonActive: {
        backgroundColor: 'rgba(163, 230, 53, 0.1)',
        borderColor: '#a3e635',
    },
    langText: {
        color: '#94a3b8',
        fontWeight: '500',
    },
    langTextActive: {
        color: '#a3e635',
        fontWeight: 'bold',
    },
    keyInput: {
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        marginTop: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
    },
    saveKeyBtn: {
        backgroundColor: '#a3e635',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveKeyText: {
        color: '#0f172a',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
