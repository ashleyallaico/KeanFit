import React from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';

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
            <TextInput
                style={styles.input}
                onChangeText={handleNumberInput(setReps)}
                value={reps}
                placeholder="Enter repetitions"
                keyboardType="numeric"
            />
            <TextInput
                style={styles.input}
                onChangeText={handleNumberInput(setSets)}
                value={sets}
                placeholder="Enter sets"
                keyboardType="numeric"
            />
            <TextInput
                style={styles.input}
                onChangeText={handleNumberInput(setWeight)}
                value={weight}
                placeholder="Enter weight (in lbs)"
                keyboardType="numeric"
            />
            <Button
                title="Save Workout"
                onPress={validateAndSubmit}
                color="#09355c"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 15,
        fontSize: 16,
    },
});

export default StrengthComponent;
