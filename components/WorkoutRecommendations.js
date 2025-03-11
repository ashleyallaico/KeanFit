import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { getDatabase, ref, onValue, set, get } from 'firebase/database';
import { auth } from '../services/firebaseConfig'; 
import { fetchUserPreferences } from '../services/userService';

const WorkoutRecommendations = () => {
    const [preferences, setPreferences] = useState([]);
    const [workouts, setWorkouts] = useState([]);
    const [userWorkouts, setUserWorkouts] = useState([]); 
    const [expandedWorkout, setExpandedWorkout] = useState(null);

    useEffect(() => {
        const unsubscribePrefs = fetchUserPreferences((prefs) => {
            setPreferences(prefs || []);
        });
        return () => unsubscribePrefs();
    }, []);

    useEffect(() => {
        if (preferences.length === 0) return;

        const db = getDatabase();
        let fetchedWorkouts = [];

        const listeners = preferences.map((preference) => {
            const preferenceRef = ref(db, `Workouts/${preference}`);
            return onValue(preferenceRef, (snapshot) => {
                if (snapshot.exists()) {
                    const workoutsData = snapshot.val();
                    const workoutsArray = Object.keys(workoutsData).map((key) => ({
                        name: key,
                        ...workoutsData[key]
                    }));

                    fetchedWorkouts = [...fetchedWorkouts, ...workoutsArray];
                    setWorkouts([...fetchedWorkouts]);
                }
            });
        });

        return () => {
            listeners.forEach((unsubscribe) => unsubscribe());
        };
    }, [preferences]);

    useEffect(() => {
        fetchUserWorkouts();
    }, []);

    const fetchUserWorkouts = async () => {
        const user = auth.currentUser;
        if (!user) {
            console.error("User not authenticated");
            return;
        }

        const db = getDatabase();
        const userWorkoutsRef = ref(db, `Users/${user.uid}/MyWorkout`);

        try {
            const snapshot = await get(userWorkoutsRef);
            if (snapshot.exists() && Array.isArray(snapshot.val())) {
                setUserWorkouts(snapshot.val());
            } else {
                setUserWorkouts([]); // Ensure it's always an array
            }
        } catch (error) {
            console.error("Failed to fetch user workouts:", error);
            setUserWorkouts([]); // Fallback to an empty array
        }
    };

    const handleAddWorkout = async (workout) => {
        const user = auth.currentUser;
        if (!user) {
            console.error("User not authenticated");
            return;
        }

        const db = getDatabase();
        const userWorkoutsRef = ref(db, `Users/${user.uid}/MyWorkout`);

        try {
            const currentWorkouts = Array.isArray(userWorkouts) ? userWorkouts : [];

            if (!currentWorkouts.some((w) => w.name === workout.name)) {
                const updatedWorkouts = [...currentWorkouts, workout];
                await set(userWorkoutsRef, updatedWorkouts);
                setUserWorkouts(updatedWorkouts); 
                console.log(`Workout added: ${workout.name}`);
            } else {
                console.log(`Workout "${workout.name}" is already in the list`);
            }
        } catch (error) {
            console.error("Failed to add workout:", error);
        }
    };

    const renderItem = ({ item }) => {
        const isExpanded = expandedWorkout === item.name;
        const isAlreadySaved = Array.isArray(userWorkouts) && userWorkouts.some((w) => w.name === item.name);

        return (
            <View style={styles.item}>
                {/* Exercise Name */}
                <TouchableOpacity onPress={() => setExpandedWorkout(isExpanded ? null : item.name)}>
                    <Text style={styles.title}>{item.name}</Text>
                </TouchableOpacity>

                {/* Always Show Description */}
                {item.description && <Text style={styles.description}>Description: {item.description}</Text>}

                {/* Show Difficulty when expanded */}
                {isExpanded && item.difficulty && <Text>Difficulty: {item.difficulty}</Text>}

                {/* Show "Add Workout" Button if not already saved */}
                {isExpanded && !isAlreadySaved && (
                    <TouchableOpacity style={styles.addButton} onPress={() => handleAddWorkout(item)}>
                        <Text style={styles.addButtonText}>Add Workout to My List</Text>
                    </TouchableOpacity>
                )}

                {/* Show More / Show Less Button */}
                <TouchableOpacity onPress={() => setExpandedWorkout(isExpanded ? null : item.name)}>
                    <Text style={styles.showMore}>{isExpanded ? "Show Less" : "Show More"}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <FlatList
            data={workouts}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.name}_${index}`}
            scrollEnabled={false} // Prevents nested scroll conflicts
            nestedScrollEnabled={true} // Allows scrolling inside parent FlatList
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
    description: {
        marginTop: 5,
        fontSize: 14,
        color: '#333',
    },
    showMore: {
        marginTop: 10,
        color: 'blue',
        fontWeight: 'bold',
    },
    addButton: {
        marginTop: 10,
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default WorkoutRecommendations;
