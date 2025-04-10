import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { FontAwesome5 } from '@expo/vector-icons';

const CardioComponent = ({ currentSteps, setCurrentSteps, duration, setDuration, isTracking, setIsTracking, selectedSubCategory, setSelectedSubCategory, handleSubmit }) => {
    const lastStepCount = useRef(0);
    const timerInterval = useRef(null);

    useEffect(() => {
        if (isTracking) {
            timerInterval.current = setInterval(() => {
                setDuration((prevDuration) => prevDuration + 1);
            }, 1000);

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
        setIsTracking(!isTracking);
    };

    const handleReset = () => {
        Alert.alert(
            "Restart Workout",
            "Are you sure you want to restart?",
            [
                { text: "Yes", onPress: () => {
                    setCurrentSteps(0);
                    setDuration(0);
                    setIsTracking(false);
                    lastStepCount.current = 0;
                } },
                { text: "No", style: "cancel" }
            ],
            { cancelable: true }
        );
    };

    const calculateDistance = (steps) => {
        const stepLength = 0.76;
        return (steps * stepLength).toFixed(2);
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const renderWorkoutText = () => {
        switch (selectedSubCategory) {
          case 'Jump Rope':
            return 'Jumps';
          case 'Running':
            return 'Steps';
          case 'Walking':
            return 'Steps';
          default:
            return 'Steps';
        }
      };



    return (
        <View style={styles.container}>

             {/* setSelectedSubCategory */}
            <Text style={styles.header}>Cardio Workout</Text>
            <Text style={styles.stepsCount}>{renderWorkoutText()}: {currentSteps}</Text>
            <Text style={styles.distanceText}>Distance: {calculateDistance(currentSteps)} meters</Text>
            <Text style={styles.timerText}>Time: {formatTime(duration)}</Text>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.button, { backgroundColor: isTracking ? "#09355c" : "#09355c" }]} onPress={toggleTracking}>
                    <FontAwesome5 name={isTracking ? "pause" : "play"} size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: "#09355c" }]} onPress={handleReset}>
                    <FontAwesome5 name="redo" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: "#09355c" }]} onPress={handleSubmit}>
                    <FontAwesome5 name="save" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 15,
        shadowColor: '#09355c',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: '#09355c',
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#09355c',
        marginBottom: 10,
    },
    stepsCount: {
        fontSize: 18,
        color: '#09355c',
        marginBottom: 10,
    },
    timerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#09355c',
        marginBottom: 10,
    },
    distanceText: {
        fontSize: 18,
        color: '#09355c',
        marginBottom: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '80%',
        marginTop: 15,
    },
    button: {
        padding: 15,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        width: 60,
        height: 60,
        elevation: 5,
    },
});

export default CardioComponent;