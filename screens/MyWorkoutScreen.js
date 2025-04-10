import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { getDatabase, ref, get, set } from 'firebase/database';
import { auth } from '../services/firebaseConfig';
import NavBar from '../components/NavBar';
import { FontAwesome } from '@expo/vector-icons';
import Disclaimer from '../components/Disclaimer';


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
            <Text style={styles.workoutDescription}>{item.Description}</Text>
            {item.Equipment && 
                <View style={styles.workoutDetail}>
                    <Text style={styles.detailLabel}>Equipment:</Text>
                    <Text style={styles.detailValue}>{item.Equipment}</Text>
                </View>
            }
            {item.difficulty && 
                <View style={styles.workoutDetail}>
                    <Text style={styles.detailLabel}>Difficulty:</Text>
                    <View style={styles.difficultyContainer}>
                        {[1, 2, 3, 4, 5].map((level) => (
                        <FontAwesome
                            key={level}
                            name="circle"
                            size={12}
                            color={level <= item.difficulty ? '#09355c' : '#e0e0e0'}
                            style={{ marginRight: 5 }}
                        />
                        ))}
                    </View>
                </View>          
            }
            {item.Category && 
                <View style={styles.workoutDetail}>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>{item.Category}</Text>
                </View>
            }

            <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveWorkout(item)}>
                <Text style={styles.removeButtonText}>Remove Workout</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {Object.keys(groupedWorkouts).length > 0 ? (
                <ScrollView>
                    {Object.keys(groupedWorkouts).map((category) => (
                        <View key={category}>
                            <FlatList
                                data={groupedWorkouts[category]}
                                renderItem={renderWorkoutItem}
                                keyExtractor={(item, index) => `${item.name}_${index}`}
                                scrollEnabled={false}
                            />
                        </View>
                    ))}
                    <Disclaimer/>
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
        backgroundColor: '#fff',
        padding: 20,
        marginVertical: 8,
        borderRadius: 8,
        marginHorizontal: 10,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#09355c',
    },
    textTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#09355c',
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
    workoutDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
      },
      detailLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        width: 90,
      },
      detailValue: {
        fontSize: 14,
        color: '#666',
        flex: 1,
      },
      workoutDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
      },
      difficultyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      },
});

export default MyWorkoutScreen;