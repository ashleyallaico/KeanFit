import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  width,
} from 'react-native';
import { getDatabase, ref, onValue, set, get } from 'firebase/database';
import { auth } from '../services/firebaseConfig';
import { fetchUserPreferences } from '../services/userService';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
            ...workoutsData[key],
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
      console.error('User not authenticated');
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
      console.error('Failed to fetch user workouts:', error);
      setUserWorkouts([]); // Fallback to an empty array
    }
  };

  const handleAddWorkout = async (workout) => {
    const user = auth.currentUser;
    if (!user) {
      console.error('User not authenticated');
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
      console.error('Failed to add workout:', error);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Cardio':
        return 'running';
      case 'Strength Training':
        return 'dumbbell';
      case 'Yoga':
        return 'praying-hands';
      default:
        return 'heartbeat';
    }
  };

  const getDifficultyText = (level) => {
    if (level <= 2) return 'Beginner';
    if (level <= 4) return 'Intermediate';
    return 'Advanced';
  };

  const renderWorkoutCard = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.workoutCard}
        onPress={() => setExpandedWorkout(item)}
        activeOpacity={0.9}
      >
        <Image source={item.imageUrl} style={styles.workoutCardImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)']}
          style={styles.cardGradient}
        />

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item.id)}
        >
          <FontAwesome5
            name="heart"
            solid={item.favorite}
            size={18}
            color={item.favorite ? '#FF385C' : '#fff'}
          />
        </TouchableOpacity>

        <View style={styles.workoutCardContent}>
          <Text style={styles.workoutCardTitle} numberOfLines={1}>
            {item.name}
          </Text>

          <View style={styles.workoutCardMeta}>
            <View style={styles.categoryPill}>
              <FontAwesome5
                name={getCategoryIcon(item.Category)}
                size={10}
                color="#09355c"
                style={styles.categoryIcon}
              />
              <Text style={styles.categoryPillText}>{item.Category}</Text>
            </View>

            <View style={styles.minutesPill}>
              <FontAwesome5 name="clock" size={12} color="#09355c" />
              <Text style={styles.minutesPillText}>{item.duration} min</Text>
            </View>
          </View>

          <View style={styles.difficultyContainer}>
            {[1, 2, 3, 4, 5].map((level) => (
              <View
                key={level}
                style={[
                  styles.difficultyDot,
                  {
                    backgroundColor:
                      level <= item.difficulty ? '#09355c' : '#e0e0e0',
                  },
                ]}
              />
            ))}
            <Text style={styles.difficultyText}>
              {getDifficultyText(item.difficulty)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={workouts}
      numColumns={2}
      renderItem={renderWorkoutCard}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.workoutGrid}
    />
  );
};

const styles = StyleSheet.create({
  workoutGrid: {
    padding: 10,
  },
  workoutCard: {
    width: '50%',
    height: 200,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  workoutCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 15,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutCardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
  },
  workoutCardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  workoutCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 10,
  },
  categoryPillText: {
    color: '#09355c',
    fontSize: 12,
    marginLeft: 5,
  },
  categoryIcon: {
    marginRight: 5,
  },
  minutesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 10,
  },
  minutesPillText: {
    color: '#09355c',
    fontSize: 12,
    marginLeft: 5,
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  difficultyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
  },
});

export default WorkoutRecommendations;
