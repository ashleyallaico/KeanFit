import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { getDatabase, ref, onValue, set, get } from 'firebase/database';
import { auth } from '../services/firebaseConfig'; 
import { fetchUserPreferences } from '../services/userService';
import { FontAwesome } from '@expo/vector-icons';


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
                alert(`Workout added: ${workout.name}`);
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
          <TouchableOpacity
            style={styles.workoutCard}
            onPress={() => setExpandedWorkout(isExpanded ? null : item.name)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.workoutTitle}>{item.name}</Text>
              <FontAwesome
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#09355c"
              />
            </View>
    
            {/* Fix: Display the Description properly */}
            <Text style={styles.workoutDescription}>{item.Description}</Text>
    
            {isExpanded && (
              <View style={styles.expandedContent}>
                <View style={styles.workoutDetail}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailValue}>{item.Category}</Text>
                </View>
    
                <View style={styles.workoutDetail}>
                  <Text style={styles.detailLabel}>Equipment:</Text>
                  {/* Fix: Display the Equipment properly */}
                  <Text style={styles.detailValue}>{item.Equipment}</Text>
                </View>
    
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

                {/* Show "Add Workout" Button if not already saved */}
                {isExpanded && !isAlreadySaved && (
                    <TouchableOpacity style={styles.addButton} onPress={() => handleAddWorkout(item)}>
                        <Text style={styles.addButtonText}>Add Workout to My List</Text>
                    </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>
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
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#09355c',
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
    workoutCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      },
      cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
      },
      workoutTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#09355c',
      },
      workoutDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
      },
      expandedContent: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10,
        marginTop: 5,
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
      difficultyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
      },
});

export default WorkoutRecommendations;
