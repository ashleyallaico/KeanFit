import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { getDatabase, ref, get, set } from 'firebase/database';
import { auth } from '../services/firebaseConfig';
import NavBar from '../components/NavBar';

const MyWorkoutScreen = () => {
    const [userWorkouts, setUserWorkouts] = useState([]);
    const [groupedWorkouts, setGroupedWorkouts] = useState({});

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
            if (snapshot.exists()) {
                const workouts = snapshot.val();
                setUserWorkouts(workouts);
                groupWorkoutsByCategory(workouts);
            } else {
                setUserWorkouts([]);
                setGroupedWorkouts({});
            }
        } catch (error) {
            console.error("Failed to fetch user workouts:", error);
        }
    };

    const groupWorkoutsByCategory = (workouts) => {
        const grouped = {};
        workouts.forEach((workout) => {
            const category = workout.Category || "Uncategorized";
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(workout);
        });
        setGroupedWorkouts(grouped);
    };

    const handleRemoveWorkout = async (workout) => {
        const user = auth.currentUser;
        if (!user) {
            console.error("User not authenticated");
            return;
        }

        const db = getDatabase();
        const userWorkoutsRef = ref(db, `Users/${user.uid}/MyWorkout`);

        try {
            const updatedWorkouts = userWorkouts.filter((w) => w.name !== workout.name);
            await set(userWorkoutsRef, updatedWorkouts);
            setUserWorkouts(updatedWorkouts);
            groupWorkoutsByCategory(updatedWorkouts);
            console.log(`Workout removed: ${workout.name}`);
        } catch (error) {
            console.error("Failed to remove workout:", error);
        }
    };

    const renderWorkoutItem = ({ item }) => (
        <View style={styles.item}>
            <Text style={styles.title}>{item.name}</Text>
            {item.Equipment && <Text>Equipment: {item.Equipment}</Text>}
            {item.Description && <Text>Description: {item.Description}</Text>}
            {item.difficulty && <Text>Difficulty: {item.difficulty}</Text>}
            <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveWorkout(item)}>
                <Text style={styles.removeButtonText}>Remove Workout</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>My Workouts</Text>
            {Object.keys(groupedWorkouts).length > 0 ? (
                <ScrollView>
                    {Object.keys(groupedWorkouts).map((category) => (
                        <View key={category}>
                            <Text style={styles.categoryHeader}>{category}</Text>
                            <FlatList
                                data={groupedWorkouts[category]}
                                renderItem={renderWorkoutItem}
                                keyExtractor={(item, index) => `${item.name}_${index}`}
                                scrollEnabled={false}
                            />
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <Text style={styles.noWorkoutsText}>No workouts saved yet.</Text>
            )}
            <NavBar />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,        
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    categoryHeader: {
        fontSize: 22,
        fontWeight: 'bold',
        marginVertical: 10,
        paddingLeft: 10,
        color: '#333',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingBottom: 5,
    },
    item: {
        backgroundColor: '#f9c2ff',
        padding: 20,
        marginVertical: 8,
        borderRadius: 8,
        marginHorizontal: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    removeButton: {
        marginTop: 10,
        backgroundColor: '#FF6347',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    removeButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    noWorkoutsText: {
        textAlign: 'center',
        fontSize: 16,
        color: 'gray',
    },
});

export default MyWorkoutScreen;