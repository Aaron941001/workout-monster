import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../utils/api';
import i18n from '../../../utils/i18n';

const QUICK_ACTIONS = [
    { key: 'today', labelKey: 'ai_btn_today', prompt_en: "Please analyze my nutrition and training for today and give me a short summary.", prompt_zh: "請分析我今天的飲食和訓練狀況，給我一個簡短的總結。" },
    { key: 'nutrition', labelKey: 'ai_btn_nutrition', prompt_en: "Based on my recent eating patterns, give me specific actionable nutrition advice.", prompt_zh: "根據我近期的飲食習慣，給我具體可執行的飲食建議。" },
    { key: 'training', labelKey: 'ai_btn_training', prompt_en: "Based on my recent workouts and progress, suggest specific training adjustments for the next week.", prompt_zh: "根據我最近的訓練紀錄和進度，建議我下週訓練的具體調整方向。" },
    { key: 'progress', labelKey: 'ai_btn_progress', prompt_en: "Summarize my weight and body composition trends over the last 2 weeks and tell me if I'm on track.", prompt_zh: "幫我總結過去兩週的體重和身體組成趨勢，告訴我是否在正軌上。" },
    { key: 'goals', labelKey: 'ai_btn_goals', prompt_en: "Based on all my data, set 3 specific and realistic goals for me this week.", prompt_zh: "根據我的所有數據，幫我設定本週3個具體且可執行的目標。" },
];

export default function AICoach() {
    const router = useRouter();
    const scrollRef = useRef(null);
    const [hasKey, setHasKey] = useState(null);  // null = loading
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const lang = i18n.locale?.startsWith('zh') ? 'zh' : 'en';

    useEffect(() => {
        checkKey();
    }, []);

    useEffect(() => {
        // Auto-scroll to bottom when new message arrives
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, [messages]);

    const checkKey = async () => {
        try {
            const res = await api.get('/ai/key');
            setHasKey(res.data.has_key);
            if (res.data.has_key) {
                // Show welcome message
                setMessages([{
                    role: 'assistant',
                    text: lang === 'zh'
                        ? '嗨！我是 ROBO，你的 AI 健身教練 💪\n點下方快捷按鈕，或直接告訴我你想問什麼！\n\n你也可以直接說「今天吃了XXX 300卡」或「量體重 73kg」，我會幫你自動記錄。'
                        : "Hey! I'm ROBO, your AI fitness coach 💪\nTap a quick action or just ask me anything!\n\nYou can also say things like 'I ate chicken rice 600 kcal' and I'll log it for you.",
                }]);
            }
        } catch (e) {
            setHasKey(false);
        }
    };

    const sendMessage = async (text) => {
        const userText = (text || input).trim();
        if (!userText) return;

        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/ai/chat', { message: userText, language: lang });
            const { reply, logged } = res.data;

            setMessages(prev => [...prev, { role: 'assistant', text: reply }]);

            if (logged === 'food_log') {
                setMessages(prev => [...prev, { role: 'system', text: i18n.t('ai_logged_food') }]);
            } else if (logged === 'body_stat') {
                setMessages(prev => [...prev, { role: 'system', text: i18n.t('ai_logged_body') }]);
            }
        } catch (e) {
            const errMsg = e?.response?.data?.detail || 'Error contacting AI.';
            setMessages(prev => [...prev, { role: 'system', text: `⚠️ ${errMsg}` }]);
        } finally {
            setLoading(false);
        }
    };

    // ---- No key state ----
    if (hasKey === null) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color="#a3e635" />
            </View>
        );
    }

    if (hasKey === false) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
                <Image source={require('../../../assets/images/monster_ai.png')} style={styles.mascotLarge} resizeMode="contain" />
                <Text style={styles.noKeyTitle}>{i18n.t('ai_no_key')}</Text>
                <Text style={styles.noKeyDesc}>{i18n.t('ai_no_key_desc')}</Text>
                <TouchableOpacity style={styles.goProfileBtn} onPress={() => router.push('/dashboard/profile')}>
                    <Text style={styles.goProfileText}>{i18n.t('ai_go_to_profile')}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#0f172a" />
                </TouchableOpacity>
            </View>
        );
    }

    // ---- Chat UI ----
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
        >
            {/* Header */}
            <View style={styles.header}>
                <Image source={require('../../../assets/images/monster_ai.png')} style={styles.mascotSmall} resizeMode="contain" />
                <Text style={styles.headerTitle}>{i18n.t('ai_coach_title')}</Text>
            </View>

            {/* Quick action buttons */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll} contentContainerStyle={styles.quickContent}>
                {QUICK_ACTIONS.map(action => (
                    <TouchableOpacity
                        key={action.key}
                        style={styles.quickBtn}
                        onPress={() => sendMessage(lang === 'zh' ? action.prompt_zh : action.prompt_en)}
                        disabled={loading}
                    >
                        <Text style={styles.quickBtnText}>{i18n.t(action.labelKey)}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Messages */}
            <ScrollView
                ref={scrollRef}
                style={styles.messages}
                contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
            >
                {messages.map((msg, idx) => (
                    <View
                        key={idx}
                        style={[
                            styles.bubble,
                            msg.role === 'user' ? styles.bubbleUser : msg.role === 'system' ? styles.bubbleSystem : styles.bubbleAI,
                        ]}
                    >
                        {msg.role === 'assistant' && (
                            <Image source={require('../../../assets/images/monster_ai.png')} style={styles.avatarSmall} resizeMode="contain" />
                        )}
                        <Text style={[
                            styles.bubbleText,
                            msg.role === 'user' ? styles.bubbleTextUser : msg.role === 'system' ? styles.bubbleTextSystem : styles.bubbleTextAI,
                        ]}>
                            {msg.text}
                        </Text>
                    </View>
                ))}
                {loading && (
                    <View style={[styles.bubble, styles.bubbleAI, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                        <Image source={require('../../../assets/images/monster_ai.png')} style={styles.avatarSmall} resizeMode="contain" />
                        <ActivityIndicator color="#a3e635" size="small" />
                        <Text style={styles.bubbleTextAI}>{i18n.t('ai_thinking')}</Text>
                    </View>
                )}
            </ScrollView>

            {/* Input bar */}
            <View style={styles.inputBar}>
                <TextInput
                    style={styles.textInput}
                    value={input}
                    onChangeText={setInput}
                    placeholder={i18n.t('ai_placeholder')}
                    placeholderTextColor="#475569"
                    multiline
                    maxLength={500}
                    onSubmitEditing={() => sendMessage()}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
                    onPress={() => sendMessage()}
                    disabled={!input.trim() || loading}
                >
                    <Ionicons name="send" size={20} color="#0f172a" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 56,
        paddingHorizontal: 20,
        paddingBottom: 12,
        backgroundColor: '#1e293b',
        gap: 10,
    },
    headerTitle: {
        color: '#f8fafc',
        fontSize: 20,
        fontWeight: 'bold',
    },
    mascotSmall: {
        width: 40,
        height: 40,
    },
    mascotLarge: {
        width: 140,
        height: 140,
        marginBottom: 24,
    },
    noKeyTitle: {
        color: '#f8fafc',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    noKeyDesc: {
        color: '#94a3b8',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 22,
    },
    goProfileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#a3e635',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    goProfileText: {
        color: '#0f172a',
        fontWeight: 'bold',
        fontSize: 15,
    },
    quickScroll: {
        maxHeight: 52,
        backgroundColor: '#1e293b',
    },
    quickContent: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    quickBtn: {
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    quickBtnText: {
        color: '#94a3b8',
        fontSize: 13,
    },
    messages: {
        flex: 1,
    },
    bubble: {
        marginBottom: 12,
        maxWidth: '85%',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    bubbleUser: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    bubbleAI: {
        alignSelf: 'flex-start',
    },
    bubbleSystem: {
        alignSelf: 'center',
        maxWidth: '100%',
    },
    avatarSmall: {
        width: 28,
        height: 28,
        marginTop: 2,
    },
    bubbleText: {
        fontSize: 14,
        lineHeight: 21,
        padding: 12,
        borderRadius: 16,
        flexShrink: 1,
    },
    bubbleTextUser: {
        backgroundColor: '#a3e635',
        color: '#0f172a',
        borderBottomRightRadius: 4,
    },
    bubbleTextAI: {
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        borderBottomLeftRadius: 4,
    },
    bubbleTextSystem: {
        backgroundColor: 'rgba(163, 230, 53, 0.1)',
        color: '#a3e635',
        borderRadius: 8,
        fontSize: 13,
        textAlign: 'center',
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        backgroundColor: '#1e293b',
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: '#334155',
    },
    textInput: {
        flex: 1,
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        maxHeight: 100,
    },
    sendBtn: {
        backgroundColor: '#a3e635',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
