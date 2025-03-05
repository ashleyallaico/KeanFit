import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getDatabase, ref, onValue } from 'firebase/database';
import { fetchUserPreferences } from '../services/userService';

const WorkoutRecommendations = () => {
    const [preferences, setPreferences] = useState([]);
    const [workouts, setWorkouts] = useState([]);

    // Fetch user preferences
    useEffect(() => {
        const unsubscribePrefs = fetchUserPreferences((prefs) => {
            setPreferences(prefs || []);
        });
        return () => unsubscribePrefs();
    }, []);

    // Fetch workouts based on preferences
    useEffect(() => {
        if (preferences.length === 0) return;

        const db = getDatabase();
        const fetchedWorkouts = [];

        const listeners = preferences.map((preference) => {
            const preferenceRef = ref(db, `Workouts/${preference}`);
            return onValue(preferenceRef, (snapshot) => {
                if (snapshot.exists()) {
                    const workoutsData = snapshot.val();
                    const workoutsArray = Object.keys(workoutsData).map((key) => ({
                        name: key,
                        ...workoutsData[key] 
                    }));
                    fetchedWorkouts.push(...workoutsArray);
                    setWorkouts([...fetchedWorkouts]); 
                }
            });
        });

        return () => {
            listeners.forEach((unsubscribe) => unsubscribe());
        };
    }, [preferences]);

    const renderItem = ({ item }) => (
        <View style={styles.item}>
            <Text style={styles.title}>{item.name}</Text>
            {item.description && <Text>Description: {item.description}</Text>}
            {item.difficulty && <Text>Difficulty: {item.difficulty}</Text>}
        </View>
    );

    return (
        <FlatList
            data={workouts}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.name}_${index}`}
            scrollEnabled={false}
        />
    );
};

const styles = StyleSheet.create({
    item: {
        backgroundColor: '#f9c2ff',
        padding: 20,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default WorkoutRecommendations;
