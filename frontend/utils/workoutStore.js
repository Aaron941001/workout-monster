// Simple in-memory store for passing exercises between plan detail → active workout
// Avoids URL param size limits with large exercise JSON
let pendingExercises = [];

export function setPendingExercises(exercises) {
    pendingExercises = exercises || [];
}

export function getPendingExercises() {
    return pendingExercises;
}

export function clearPendingExercises() {
    pendingExercises = [];
}
