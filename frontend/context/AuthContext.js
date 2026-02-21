import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userInfo, setUserInfo] = useState(null);

    const login = async (email, password) => {
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const token = response.data.access_token;
            setUserToken(token);
            await SecureStore.setItemAsync('userToken', token);
            await _fetchUserInfo(token);
            return true;
        } catch (error) {
            console.log('Login error', error);
            throw error;
        }
    };

    const loginWithGoogle = async (idToken) => {
        try {
            const response = await api.post('/auth/google', { id_token: idToken });
            const token = response.data.access_token;
            setUserToken(token);
            await SecureStore.setItemAsync('userToken', token);
            await _fetchUserInfo(token);
            return true;
        } catch (error) {
            console.log('Google login error', error);
            throw error;
        }
    };

    const signup = async (email, password, displayName) => {
        try {
            const response = await api.post('/auth/signup', { email, password, display_name: displayName });
            const token = response.data.access_token;
            setUserToken(token);
            await SecureStore.setItemAsync('userToken', token);
            await _fetchUserInfo(token);
            return true;
        } catch (error) {
            console.log('Signup error', error);
            throw error;
        }
    };

    const logout = async () => {
        setUserToken(null);
        setUserInfo(null);
        await SecureStore.deleteItemAsync('userToken');
    };

    const _fetchUserInfo = async (token) => {
        try {
            // Set the token temporarily to make the request
            const resp = await api.get('/user/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserInfo(resp.data);
        } catch (e) {
            console.log('Could not fetch user info', e);
        }
    };

    const isLoggedIn = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            setUserToken(token);
            if (token) {
                await _fetchUserInfo(token);
            }
        } catch (error) {
            console.log('isLoggedIn error', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AuthContext.Provider value={{ login, signup, logout, loginWithGoogle, isLoading, userToken, userInfo }}>
            {children}
        </AuthContext.Provider>
    );
};
