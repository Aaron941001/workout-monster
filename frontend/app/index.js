import { useEffect, useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/AuthContext';

export default function Index() {
    const { userToken, isLoading } = useContext(AuthContext);
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (userToken) {
                router.replace('/dashboard');
            } else {
                router.replace('/login');
            }
        }
    }, [isLoading, userToken]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
            <ActivityIndicator size="large" color="#a3e635" />
        </View>
    );
}
