import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';

const YogaComponent = ({ timer, setTimer, handleSubmit, isRunning, setIsRunning }) => {
    // const [isRunning, setIsRunning] = useState(false);
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

    const startTimer = () => {
        if (!isRunning) {
            setIsRunning(true);
        }
    };

    const pauseTimer = () => {
        setIsRunning(false);
    };

    const confirmReset = () => {
        Alert.alert(
            "Confirm Reset",
            "This will delete all recorded time permanently. Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    onPress: resetTimer,
                    style: "destructive",
                },
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
                <Button title="Start" onPress={startTimer} color="#4CAF50" />
                <Button title="Pause" onPress={pauseTimer} color="#FFA500" />
                <Button title="Reset" onPress={confirmReset} color="#FF6347" />
            </View>

            <Button title="Save Session" onPress={handleSubmit} color="#09355c" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    timerText: {
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
    },
});

export default YogaComponent;
