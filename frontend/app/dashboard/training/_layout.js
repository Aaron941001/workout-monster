import { Stack } from 'expo-router';

export default function TrainingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="plan/[id]" />
            <Stack.Screen name="[id]" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
            <Stack.Screen name="exercises" options={{ presentation: 'modal' }} />
        </Stack>
    );
}
