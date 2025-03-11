import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import CardioComponent from '../components/CardioComponent';
import StrengthComponent from '../components/StrengthComponent';
import YogaComponent from '../components/YogaComponent';
import { getDatabase, ref, push, set } from 'firebase/database';
import { auth } from '../services/firebaseConfig';
import NavBar from '../components/NavBar';


const TrackWorkoutScreen = () => {
    const [selectedCategory, setSelectedCategory] = useState('Select Workout');
    // const [isStepMode, setIsStepMode] = useState(false);
    const [isTrackingCardio, setIsTrackingCardio] = useState(false);
    const [steps, setSteps] = useState(0);
    const [cardioDuration, setCardioDuration] = useState(0);
    const [reps, setReps] = useState('');
    const [sets, setSets] = useState('');
    const [weight, setWeight] = useState('');
    const [yogaDuration, setYogaDuration] = useState(0);
    const [isTrackingYoga, setIsTrackingYoga] = useState(false);


    const handleSubmit = () => {
        const db = getDatabase();
        const user = auth.currentUser;

        if (user) {
            const uid = user.uid;
            let workoutData = {
                time: new Date().toLocaleTimeString(),
                date: new Date().toLocaleDateString()

            };

            // Add fields based on the selected workout category
            switch (selectedCategory) {
                case 'Cardio':
                    workoutData = { ...workoutData, steps, cardioDuration };
                    break;
                case 'Strength':
                    workoutData = { ...workoutData, reps, sets, weight };
                    break;
                case 'Yoga':
                    workoutData = { ...workoutData, yogaDuration };
                    break;
            }

            const activityRef = ref(db, `Activity/${uid}/${selectedCategory}`);
            const newWorkoutRef = push(activityRef);

            set(newWorkoutRef, workoutData)
                .then(() => {
                    console.log("Workout saved successfully!");
                    alert('Workout saved successfully!');
                    setSteps(0);
                    setCardioDuration(0);
                    setReps('');
                    setSets('');
                    setWeight('');
                    setIsTrackingCardio(false)
                    setYogaDuration(0)
                    setIsTrackingYoga(false)

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
        <View style={styles.container}>
            <ScrollView style={styles.scrollContainer}>
                <View style={styles.trackingContainer}>
                    <Text style={styles.header}>Track Your Workout</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={selectedCategory}
                            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                            style={styles.picker}>
                            <Picker.Item label="Select Workout" value="Select Workout" />
                            <Picker.Item label="Cardio" value="Cardio" />
                            <Picker.Item label="Strength Training" value="Strength" />
                            <Picker.Item label="Yoga" value="Yoga" />
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
                                    duration={cardioDuration}
                                    setDuration={setCardioDuration}
                                    isTracking={isTrackingCardio}
                                    setIsTracking={setIsTrackingCardio}
                                    handleSubmit={handleSubmit}
                                />
                            </View>
                        )}

                        {selectedCategory === 'Strength' && (
                            <View>
                                <StrengthComponent
                                    setReps={setReps}
                                    reps={reps}
                                    setSets={setSets}
                                    sets={sets}
                                    setWeight={setWeight}
                                    weight={weight}
                                    handleSubmit={handleSubmit}
                                />
                            </View>
                        )}
                        {selectedCategory === 'Yoga' && (
                            <YogaComponent
                                timer={yogaDuration}
                                setTimer={setYogaDuration} 
                                isRunning={isTrackingYoga}
                                setIsRunning={setIsTrackingYoga}
                                handleSubmit={handleSubmit}
                            />

                        )}
                    </View>
                </View>
            </ScrollView>

            <NavBar />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 70,
    },
    trackingContainer: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
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
    },
    navContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
});

export default TrackWorkoutScreen;