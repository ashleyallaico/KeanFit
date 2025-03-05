
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Switch, StyleSheet, Button, Alert } from 'react-native';
import { Pedometer } from 'expo-sensors';

const CardioComponent = ({ currentSteps, setCurrentSteps, duration, setDuration, isStepMode, setIsStepMode }) => {

    const lastStepCount = useRef(0);
    const timerInterval = useRef(null);

    useEffect(() => {
        if (isStepMode) {
            const subscribe = Pedometer.watchStepCount(result => {
                const newSteps = result.steps - lastStepCount.current;
                if (newSteps > 0) {
                    setCurrentSteps(currentSteps => currentSteps + newSteps);
                    lastStepCount.current = result.steps;
                }
            });

            timerInterval.current = setInterval(() => {
                setDuration(duration => duration + 1);
            }, 1000);

            return () => {
                clearInterval(timerInterval.current);
                subscribe.remove();
            };
        } else {
            clearInterval(timerInterval.current);
        }
    }, [isStepMode]);

    const handleReset = () => {
        Alert.alert(
            "Restart Workout",
            "Are you sure you want to restart?",
            [
                {
                    text: "Yes", onPress: () => {
                        setCurrentSteps(0);
                        setDuration(0);
                        lastStepCount.current = 0;
                    }
                },
                { text: "No", style: "cancel" }
            ],
            { cancelable: true }
        );
    };

    const handleModeChange = (newMode) => {
        setIsStepMode(newMode);
        setCurrentSteps(0);
        lastStepCount.current = 0;
    };

    const calculateDistance = (steps) => {
        const stepLength = 0.76;
        return (steps * stepLength).toFixed(2);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Cardio Workout</Text>
            <Switch
                onValueChange={handleModeChange}
                value={isStepMode}
                style={styles.switch}
            />

            <>
                <Text style={styles.stepsCount}>Steps: {currentSteps}</Text>
                <Text style={styles.timerText}>Time: {duration} seconds</Text>
                <Text style={styles.distanceText}>Distance: {calculateDistance(currentSteps)} meters</Text>
                <Button title="Restart Workout" onPress={handleReset} color="#09355c" />

            </>

            

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    switch: {
        marginBottom: 12,
    },
    stepsCount: {
        fontSize: 16,
        marginBottom: 12,
    },
    timerText: {
        fontSize: 16,
        marginBottom: 12,
    },
    distanceText: {
        fontSize: 16,
        marginBottom: 12,
    }
});

export default CardioComponent;
