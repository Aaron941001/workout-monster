import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const login = async (email, password) => {
        try {
            const formData = new FormData();
            formData.append('username', email); // OAuth2 expects 'username'
            formData.append('password', password);

            const response = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const token = response.data.access_token;
            setUserToken(token);
            await SecureStore.setItemAsync('userToken', token);
            // Save credentials for Biometrics later
            await SecureStore.setItemAsync('userEmail', email);
            await SecureStore.setItemAsync('userPassword', password);

            return true;
        } catch (error) {
            console.log('Login error', error);
            throw error;
        }
    };

    const signup = async (email, password, displayName) => {
        try {
            const response = await api.post('/auth/signup', { email, password, display_name: displayName });
            const token = response.data.access_token;
            setUserToken(token);
            await SecureStore.setItemAsync('userToken', token);
            return true;
        } catch (error) {
            console.log('Signup error', error);
            throw error;
        }
    };

    const logout = async () => {
        setUserToken(null);
        await SecureStore.deleteItemAsync('userToken');
    };

    const isLoggedIn = async () => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            setUserToken(token);
            setIsLoading(false);
        } catch (error) {
            console.log('isLoggedIn error', error);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    const loginWithBiometrics = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                alert('Face ID / Touch ID not available');
                return false;
            }

            const email = await SecureStore.getItemAsync('userEmail');
            const password = await SecureStore.getItemAsync('userPassword');

            if (!email || !password) {
                alert('No credentials saved. Please log in manually first to enable Face ID.');
                return false;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Login with Face ID',
                fallbackLabel: 'Use Passcode'
            });

            if (result.success) {
                return await login(email, password);
            }
            return false;
        } catch (error) {
            console.log('Biometric error', error);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ login, signup, logout, loginWithBiometrics, isLoading, userToken }}>
            {children}
        </AuthContext.Provider>
    );
};
