import { Stack } from 'expo-router';

export default function TrainingLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="create_plan" options={{ presentation: 'modal' }} />
            <Stack.Screen name="plan/[id]" />
            <Stack.Screen name="[id]" />
            <Stack.Screen name="exercises" options={{ presentation: 'modal' }} />
            <Stack.Screen name="exercise_history/[exercise_id]" />
        </Stack>
    );
}
