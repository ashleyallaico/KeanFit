import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const YogaComponent = ({ timer, setTimer, handleSubmit, isRunning, setIsRunning }) => {
    const intervalRef = useRef(null); 

    useEffect(() => {
        if (isRunning) {
            clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
                setTimer((prevTimer) => prevTimer + 1);
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }

        return () => clearInterval(intervalRef.current); 
    }, [isRunning, setTimer]);

    const startTimer = () => setIsRunning(true);
    const pauseTimer = () => setIsRunning(false);
    
    const confirmReset = () => {
        Alert.alert(
            "Confirm Reset",
            "This will delete all recorded time permanently. Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Reset", onPress: resetTimer, style: "destructive" },
            ]
        );
    };

    const resetTimer = () => {
        setIsRunning(false);
        setTimer(0);
        clearInterval(intervalRef.current);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Yoga Timer</Text>
            <Text style={styles.timerText}>
                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </Text>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.circleButton} onPress={startTimer}>
                    <FontAwesome5 name="play" size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.circleButton} onPress={confirmReset}>
                    <FontAwesome5 name="redo" size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.circleButton} onPress={handleSubmit}>
                    <FontAwesome5 name="save" size={24} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 15,
        shadowColor: '#09355c',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: '#09355c',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#09355c',
    },
    timerText: {
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#09355c',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '80%',
    },
    circleButton: {
        backgroundColor: '#09355c',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
});

export default YogaComponent;
