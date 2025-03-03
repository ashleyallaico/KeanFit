import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import CardioComponent from '../components/CardioComponent';
import { getDatabase, ref, push, set } from 'firebase/database';
import { auth } from '../services/firebaseConfig';


const TrackWorkoutScreen = () => {
    const [selectedCategory, setSelectedCategory] = useState('Select Workout');
    const [isStepMode, setIsStepMode] = useState(false);
    const [steps, setSteps] = useState(0);
    const [duration, setDuration] = useState(0);
    const [reps, setReps] = useState('');
    const [sets, setSets] = useState('');
    const [weight, setWeight] = useState('');

    const handleSubmit = () => {
        const db = getDatabase();
        const user = auth.currentUser;

        if (user) {
            const uid = user.uid;
            let workoutData = {
                date: new Date().toLocaleTimeString(), // Record the time of the workout
                // any additional fields needed 
            };

            // Add fields based on the selected workout category
            switch (selectedCategory) {
                case 'Cardio':
                    workoutData = { ...workoutData, steps, duration };
                    break;
                case 'Strength':
                    workoutData = { ...workoutData, reps, sets, weight };
                    break;
                case 'Flexibility':
                    // Assuming flexibility does not have additional fields for now
                    break;
            }

            // reference to the path where workouts are stored
            const activityRef = ref(db, `Activity/${uid}/${selectedCategory}`);

            // new child location using a unique key generated by push() 
            // and returns a reference to it to ensure not overwritting data
            const newWorkoutRef = push(activityRef);

            // Sets the workout data at this new location
            set(newWorkoutRef, workoutData)
                .then(() => {
                    console.log("Workout saved successfully!");
                    alert('Workout saved successfully!');
                    setSteps(0);
                    setDuration(0);
                    setReps('');
                    setSets('');
                    setWeight('');
                    setIsStepMode(false);
                })
                .catch((error) => {
                    console.error("Failed to save workout data: ", error);
                    alert('Failed to save workout. Please try again.');
                });
        } else {
            alert('No user is logged in. Please log in to track your workout.');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Track Your Workout</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={selectedCategory}
                    onValueChange={(itemValue, itemIndex) => setSelectedCategory(itemValue)}
                    style={styles.picker}>
                    <Picker.Item label="Select Workout" value="Select Workout" />
                    <Picker.Item label="Cardio" value="Cardio" />
                    <Picker.Item label="Strength Training" value="Strength" />
                    <Picker.Item label="Flexibility" value="Flexibility" />
                </Picker>
            </View>

            <View style={styles.formContainer}>

                {selectedCategory === 'Select Workout' && (
                    <Text style={styles.header}>Please Select a Workout to track</Text>
                )}
                {selectedCategory === 'Cardio' && (
                    <View>
                        <CardioComponent

                            currentSteps={steps}
                            setCurrentSteps={setSteps}
                            duration={duration}
                            setDuration={setDuration}
                            isStepMode={isStepMode}
                            setIsStepMode={setIsStepMode}
                        />
                        <Button
                            title="Save Workout"
                            onPress={handleSubmit}
                            color="#09355c"
                            style={styles.saveButton}
                        />
                    </View>


                )}

                {selectedCategory === 'Strength' && (
                    <View>
                        <TextInput
                            style={styles.input}
                            onChangeText={setReps}
                            value={reps}
                            placeholder="Enter repetitions"
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.input}
                            onChangeText={setSets}
                            value={sets}
                            placeholder="Enter sets"
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.input}
                            onChangeText={setWeight}
                            value={weight}
                            placeholder="Enter weight (in lbs)"
                            keyboardType="numeric"
                        />
                        <Button
                            title="Save Workout"
                            onPress={handleSubmit}
                            color="#09355c"
                            style={styles.saveButton}
                        />
                    </View>
                )}

            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f9f9f9',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#09355c',
    },
    input: {
        height: 40,
        marginBottom: 12,
        borderWidth: 1,
        padding: 10,
        borderRadius: 5,
        borderColor: '#ccc',
        backgroundColor: '#fff',
    },
    pickerContainer: {
        marginBottom: 20,
    },
    formContainer: {
        marginBottom: 20,
    },
    saveButton: {
        marginTop: 10,
    }
});

export default TrackWorkoutScreen;