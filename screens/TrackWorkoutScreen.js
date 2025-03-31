import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import CardioComponent from '../components/CardioComponent';
import StrengthComponent from '../components/StrengthComponent';
import YogaComponent from '../components/YogaComponent';
import { getDatabase, ref, push, set } from 'firebase/database';
import { auth } from '../services/firebaseConfig';
import NavBar from '../components/NavBar';
// import subCategories from '../constants/categories';

const TrackWorkoutScreen = () => {
    const [selectedCategory, setSelectedCategory] = useState('Select Workout');
    const [selectedSubCategory, setSelectedSubCategory] = useState('Select Option');
    const [isTrackingCardio, setIsTrackingCardio] = useState(false);
    const [steps, setSteps] = useState(0);
    const [cardioDuration, setCardioDuration] = useState(0);
    const [reps, setReps] = useState('');
    const [sets, setSets] = useState('');
    const [weight, setWeight] = useState('');
    const [yogaDuration, setYogaDuration] = useState(0);
    const [isTrackingYoga, setIsTrackingYoga] = useState(false);

    // Mapping for subcategories based on the selected category
    const subCategories = {
        Cardio: [
            { label: 'Jump Rope', value: 'Jump Rope' },
            { label: 'Running', value: 'Running' },
            { label: 'Walking', value: 'Walking' },
        ],
        Strength: [
            { label: 'Bench Press', value: 'Bench Press' },
            { label: 'DeadLift', value: 'DeadLift' },
            { label: 'Squats', value: 'Squats' },
        ],
        Yoga: [
            { label: 'Downward Dog (Adho Mukha Svanasana)', value: 'Downward Dog (Adho Mukha Svanasana)' },
        ],
    };

    const handleSubmit = () => {
        const db = getDatabase();
        const user = auth.currentUser;

        if (user) {
            const uid = user.uid;
            const now = new Date();

            let workoutData = {
                time: now.toLocaleTimeString(),
                date: now.getTime(),
            };

            // Include subcategory along with category-specific data
            switch (selectedCategory) {
                case 'Cardio':
                    workoutData = { ...workoutData, steps, cardioDuration, subCategory: selectedSubCategory };
                    break;
                case 'Strength':
                    workoutData = { ...workoutData, reps, sets, weight, subCategory: selectedSubCategory };
                    break;
                case 'Yoga':
                    workoutData = { ...workoutData, yogaDuration, subCategory: selectedSubCategory };
                    break;
            }

            const activityRef = ref(db, `Activity/${uid}/${selectedCategory}`);
            const newWorkoutRef = push(activityRef);

            set(newWorkoutRef, workoutData)
                .then(() => {
                    console.log('Workout saved successfully!');
                    alert('Workout saved successfully!');
                    // Reset state
                    setSteps(0);
                    setCardioDuration(0);
                    setReps('');
                    setSets('');
                    setWeight('');
                    setIsTrackingCardio(false);
                    setYogaDuration(0);
                    setIsTrackingYoga(false);
                    setSelectedSubCategory('Select Option');
                    setSelectedCategory('Select Workout');
                })
                .catch((error) => {
                    console.error('Failed to save workout data: ', error);
                    alert('Failed to save workout. Please try again.');
                });
        } else {
            alert('No user is logged in. Please log in to track your workout.');
        }
    };

    // Check if either field is still at its default value
    const isInvalidSelection =
        selectedCategory === 'Select Workout' || selectedSubCategory === 'Select Option';



    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollContainer}>
                <View style={styles.trackingContainer}>
                    <Text style={styles.header}>Select a workout to track</Text>
                    <View style={styles.pickerContainer}>
                        {/* Category Picker */}
                        <View style={styles.pickerWrapper}>
                            <Text style={styles.label}>Category</Text>
                            <Picker
                                selectedValue={selectedCategory}
                                onValueChange={(itemValue) => {
                                    setSelectedCategory(itemValue);
                                    setSelectedSubCategory('Select Option');
                                }}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select Workout" value="Select Workout" />
                                <Picker.Item label="Cardio" value="Cardio" />
                                <Picker.Item label="Strength Training" value="Strength" />
                                <Picker.Item label="Yoga" value="Yoga" />
                            </Picker>
                        </View>
                        {/* Subcategory Picker */}
                        <View style={styles.pickerWrapper}>
                            <Text style={styles.label}>Subcategory</Text>
                            <Picker
                                selectedValue={selectedSubCategory}
                                onValueChange={(itemValue) => setSelectedSubCategory(itemValue)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select Option" value="Select Option" />
                                {selectedCategory !== 'Select Workout' &&
                                    subCategories[selectedCategory] &&
                                    subCategories[selectedCategory].map((item) => (
                                        <Picker.Item key={item.value} label={item.label} value={item.value} />
                                    ))}
                            </Picker>
                        </View>
                    </View>

                    {!isInvalidSelection ? (
                        <>

                            <View style={styles.formContainer}>
                                {selectedCategory === 'Cardio' && (
                                    <CardioComponent
                                        currentSteps={steps}
                                        setCurrentSteps={setSteps}
                                        duration={cardioDuration}
                                        setDuration={setCardioDuration}
                                        isTracking={isTrackingCardio}
                                        setIsTracking={setIsTrackingCardio}
                                        selectedSubCategory={selectedSubCategory}
                                        handleSubmit={handleSubmit}
                                    />
                                )}

                                {selectedCategory === 'Strength' && (
                                    <StrengthComponent
                                        setReps={setReps}
                                        reps={reps}
                                        setSets={setSets}
                                        sets={sets}
                                        setWeight={setWeight}
                                        weight={weight}
                                        handleSubmit={handleSubmit}
                                    />
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
                        </>
                    ) : (
                        <Text>Please select both a category and a sub-category</Text>
                    )}
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
        paddinsg: 10,
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
    label: {
        marginBottom: 5,
        fontWeight: 'bold',
    },
    pickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',

    },
    pickerWrapper: {
        flex: 1,

    },
    picker: {

        width: '100%',
    },
    formContainer: {
        marginBottom: 20,
    },
});

export default TrackWorkoutScreen;
