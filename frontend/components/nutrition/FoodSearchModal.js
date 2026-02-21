import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import i18n, { t } from '../../utils/i18n';
import api from '../../utils/api';

export default function FoodSearchModal({ visible, onClose, onSelect }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedFood, setSelectedFood] = useState(null);
    const [servings, setServings] = useState('1');
    const [mealName, setMealName] = useState(i18n.locale?.startsWith('zh') ? '餐點' : 'Meal');

    useEffect(() => {
        if (visible && searchQuery.length > 0) {
            searchFoods();
        } else if (visible && searchQuery.length === 0) {
            // Load all foods when modal opens
            searchFoods();
        }
    }, [searchQuery, visible]);

    const searchFoods = async () => {
        try {
            setLoading(true);
            const response = await api.get('/nutrition/foods', {
                params: { q: searchQuery || undefined, limit: 50 }
            });
            setFoods(response.data);
        } catch (error) {
            console.log('Error searching foods', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectFood = (food) => {
        setSelectedFood(food);
    };

    const handleAddToLog = async () => {
        if (!selectedFood) return;

        try {
            const servingsNum = parseFloat(servings) || 1;

            await api.post(
                '/nutrition/log_from_food',
                null,
                {
                    params: {
                        food_id: selectedFood.id,
                        servings: servingsNum,
                        meal_name: mealName
                    }
                }
            );

            onSelect && onSelect();
            resetAndClose();
        } catch (error) {
            console.log('Error logging food', error);
        }
    };

    const resetAndClose = () => {
        setSearchQuery('');
        setSelectedFood(null);
        setServings('1');
        setMealName(i18n.locale?.startsWith('zh') ? '餐點' : 'Meal');
        onClose();
    };

    const renderFoodItem = ({ item }) => {
        const lang = i18n.locale?.startsWith('zh') ? 'zh' : 'en';
        const name = lang === 'zh' && item.name_zh ? item.name_zh : item.name;
        const servingSize = lang === 'zh' && item.serving_size_zh ? item.serving_size_zh : item.serving_size;

        return (
            <TouchableOpacity
                style={[styles.foodItem, selectedFood?.id === item.id && styles.selectedFood]}
                onPress={() => handleSelectFood(item)}
            >
                <View style={styles.foodHeader}>
                    <Text style={styles.foodName}>{name}</Text>
                    <Text style={styles.calories}>{Math.round(item.calories)} {t('kcal')}</Text>
                </View>
                <Text style={styles.servingSize}>{servingSize}</Text>
                <View style={styles.macros}>
                    <Text style={styles.macroText}>P: {Math.round(item.protein_g)}g</Text>
                    <Text style={styles.macroText}>C: {Math.round(item.carbs_g)}g</Text>
                    <Text style={styles.macroText}>F: {Math.round(item.fat_g)}g</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={resetAndClose}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={resetAndClose}>
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>{t('search_foods')}</Text>
                    <View style={{ width: 28 }} />
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('search_placeholder')}
                        placeholderTextColor="#888"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                    />
                </View>

                {/* Food List */}
                {loading ? (
                    <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={foods}
                        renderItem={renderFoodItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>{t('no_foods_found')}</Text>
                        }
                    />
                )}

                {/* Selected Food Details */}
                {selectedFood && (
                    <View style={styles.selectionPanel}>
                        <Text style={styles.selectionTitle}>{t('add_to_log')}</Text>

                        <View style={styles.inputRow}>
                            <Text style={styles.label}>{t('meal_name')}:</Text>
                            <TextInput
                                style={styles.input}
                                value={mealName}
                                onChangeText={setMealName}
                                placeholder="Breakfast"
                            />
                        </View>

                        <View style={styles.inputRow}>
                            <Text style={styles.label}>{t('servings')}:</Text>
                            <TextInput
                                style={styles.input}
                                value={servings}
                                onChangeText={setServings}
                                keyboardType="decimal-pad"
                                placeholder="1"
                            />
                        </View>

                        <View style={styles.totalMacros}>
                            <Text style={styles.totalText}>
                                {t('total')}: {Math.round(selectedFood.calories * parseFloat(servings || 1))} {t('kcal')}
                            </Text>
                            <Text style={styles.totalText}>
                                P: {Math.round(selectedFood.protein_g * parseFloat(servings || 1))}g |
                                C: {Math.round(selectedFood.carbs_g * parseFloat(servings || 1))}g |
                                F: {Math.round(selectedFood.fat_g * parseFloat(servings || 1))}g
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.addButton} onPress={handleAddToLog}>
                            <Text style={styles.addButtonText}>{t('add_to_log')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#1E1E1E',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        margin: 16,
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        paddingVertical: 12,
    },
    listContainer: {
        padding: 16,
    },
    foodItem: {
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    selectedFood: {
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    foodHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    foodName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    calories: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    servingSize: {
        fontSize: 14,
        color: '#888',
        marginBottom: 8,
    },
    macros: {
        flexDirection: 'row',
        gap: 12,
    },
    macroText: {
        fontSize: 14,
        color: '#aaa',
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
        fontSize: 16,
        marginTop: 40,
    },
    selectionPanel: {
        backgroundColor: '#1E1E1E',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    selectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    label: {
        fontSize: 16,
        color: '#fff',
        width: 100,
    },
    input: {
        flex: 1,
        backgroundColor: '#2A2A2A',
        color: '#fff',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    totalMacros: {
        backgroundColor: '#2A2A2A',
        padding: 12,
        borderRadius: 8,
        marginVertical: 12,
    },
    totalText: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 4,
    },
    addButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
