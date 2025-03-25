import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
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

    // Custom Button component with border
    const BorderedButton = ({ title, onPress, color }) => (
        <View style={[styles.borderedButton, { borderColor: color }]}>
            <Button 
                title={title}
                onPress={onPress}
                color={color}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Yoga Timer</Text>
            <Text style={styles.timerText}>
                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </Text>

            <View style={styles.buttonContainer}>
                <BorderedButton title="Start" onPress={startTimer} color="#09355c" />
                <BorderedButton title="Pause" onPress={pauseTimer} color="#09355c" />
                <BorderedButton title="Reset" onPress={confirmReset} color="#09355c" />
            </View>

            <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSubmit}
            >
                <FontAwesome5 name="save" size={20} color="#fff" style={styles.saveIcon} />
                <Text style={styles.saveText}>Save Session</Text>
            </TouchableOpacity>
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
        width: '100%',
        marginBottom: 20,
    },
    borderedButton: {
        borderWidth: 2,
        borderRadius: 10,
        overflow: 'hidden',
    },
    saveButton: {
        backgroundColor: '#09355c',
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    saveText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    saveIcon: {
        marginRight: 5,
    }
});

export default YogaComponent;