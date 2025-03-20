import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { Pedometer } from 'expo-sensors';

const CardioComponent = ({ currentSteps, setCurrentSteps, duration, setDuration, handleSubmit, isTracking, setIsTracking }) => {
    const lastStepCount = useRef(0);
    const timerInterval = useRef(null);

    useEffect(() => {
        if (isTracking) {
            // Start Timer
            timerInterval.current = setInterval(() => {
                setDuration((prevDuration) => prevDuration + 1);
            }, 1000);

            // Start Step Tracking
            const subscribe = Pedometer.watchStepCount((result) => {
                const newSteps = result.steps - lastStepCount.current;
                if (newSteps > 0) {
                    setCurrentSteps((prevSteps) => prevSteps + newSteps);
                    lastStepCount.current = result.steps;
                }
            });

            return () => {
                clearInterval(timerInterval.current);
                subscribe.remove();
            };
        } else {
            clearInterval(timerInterval.current);
        }
    }, [isTracking]);

    const toggleTracking = () => {
        // setIsRunning(!isRunning);
        setIsTracking(!isTracking);
    };

    const handleReset = () => {
        Alert.alert(
            "Restart Workout",
            "Are you sure you want to restart?",
            [
                {
                    text: "Yes", onPress: () => {
                        setCurrentSteps(0);
                        setDuration(0);
                        setIsTracking(false);
                        lastStepCount.current = 0;
                    }
                },
                { text: "No", style: "cancel" }
            ],
            { cancelable: true }
        );
    };

    const calculateDistance = (steps) => {
        const stepLength = 0.76; // Approximate step length in meters
        return (steps * stepLength).toFixed(2);
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Cardio Workout</Text>
            <Text style={styles.stepsCount}>Steps: {currentSteps}</Text>
            <Text style={styles.timerText}>Time: {formatTime(duration)}</Text>
            <Text style={styles.distanceText}>Distance: {calculateDistance(currentSteps)} meters</Text>

            <View style={styles.buttonContainer}>
                <Button
                    title={isTracking ? "Pause" : "Start"}
                    onPress={toggleTracking}
                    color={isTracking ? "#FFA500" : "#4CAF50"}
                />
                <Button title="Restart" onPress={handleReset} color="#FF6347" />
                <Button
                    title="Save Workout"
                    onPress={handleSubmit}
                    color="#09355c"
                    style={styles.saveButton}
                />

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        alignItems: 'center',
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    stepsCount: {
        fontSize: 16,
        marginBottom: 12,
    },
    timerText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    distanceText: {
        fontSize: 16,
        marginBottom: 12,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 15,
    },
});

export default CardioComponent;