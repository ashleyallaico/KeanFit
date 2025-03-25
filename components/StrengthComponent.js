import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const StrengthComponent = ({
    setReps,
    reps,
    setSets,
    sets,
    setWeight,
    weight,
    handleSubmit,
}) => {
    // Ensures only numbers are entered
    const handleNumberInput = (setter) => (value) => {
        if (/^\d*$/.test(value)) {
            setter(value);
        }
    };

    // Validates input before submission
    const validateAndSubmit = () => {
        if (!reps || !sets || !weight) {
            Alert.alert("Error", "All fields must be filled with numbers.");
            return;
        }

        handleSubmit();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Strength Training</Text>
            
            <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        onChangeText={handleNumberInput(setSets)}
                        value={sets}
                        placeholder="Sets"
                        placeholderTextColor="#09355c80"
                        keyboardType="numeric"
                    />
                    <Text style={styles.label}>Sets</Text>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        onChangeText={handleNumberInput(setReps)}
                        value={reps}
                        placeholder="Reps"
                        placeholderTextColor="#09355c80"
                        keyboardType="numeric"
                    />
                    <Text style={styles.label}>Reps</Text>
                </View>
                
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        onChangeText={handleNumberInput(setWeight)}
                        value={weight}
                        placeholder="Weight"
                        placeholderTextColor="#09355c80"
                        keyboardType="numeric"
                    />
                    <Text style={styles.label}>Weight (lbs)</Text>
                </View>
            </View>
            
            <TouchableOpacity 
                style={styles.saveButton}
                onPress={validateAndSubmit}
            >
                <FontAwesome5 name="save" size={20} color="#fff" style={styles.saveIcon} />
                <Text style={styles.saveText}>Save Workout</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
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
        marginBottom: 15,
        color: '#09355c',
        textAlign: 'center',
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    inputContainer: {
        width: '30%',
        alignItems: 'center',
    },
    input: {
        height: 50,
        borderColor: '#09355c',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        fontSize: 16,
        width: '100%',
        color: '#09355c',
    },
    label: {
        marginTop: 5,
        fontSize: 14,
        color: '#09355c',
        fontWeight: '500',
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

export default StrengthComponent;