import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavBar from '../components/NavBar';
import { setupActivityListener } from '../services/fetchUserActivities';
import { getDatabase, ref, set, onValue } from 'firebase/database';
import { auth } from '../services/firebaseConfig';
import { useNavigation } from '@react-navigation/native';

const StepTrackingScreen = ({ route }) => {
  // State variables
  const [dailySteps, setDailySteps] = useState(0);
  const [dailyDuration, setDailyDuration] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);
  const [date, setDate] = useState(new Date());
  const [stepGoal, setStepGoal] = useState(10000); // Default goal
  const [newWeeklyStepGoal, setNewWeeklyStepGoal] = useState('');
  const [activities, setActivities] = useState({});
  const navigation = useNavigation();

  // Get current date in readable format
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const todayDate = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD

  // Setup activity listener from UserStats
  useEffect(() => {
    const unsubscribe = setupActivityListener((data) => {
      console.log('Received activities data:', data);

      if (data && data.Cardio) {
        let totalSteps = 0;
        let totalDuration = 0;
        const today = new Date();
        const todayTimestamp = today.getTime();
        const todayStart = new Date(today.setHours(0, 0, 0, 0)).getTime();
        const todayEnd = new Date(today.setHours(23, 59, 59, 999)).getTime();

        console.log('Today timestamp range:', todayStart, 'to', todayEnd);

        Object.entries(data.Cardio).forEach(([entryId, entryDetails]) => {
          console.log('Processing entry:', entryId, entryDetails);

          if (
            entryDetails &&
            entryDetails.date >= todayStart &&
            entryDetails.date <= todayEnd
          ) {
            totalSteps += Number(entryDetails.steps) || 0;
            totalDuration += Number(entryDetails.cardioDuration) || 0;
          }
        });

        console.log('Total steps:', totalSteps);
        console.log('Total duration:', totalDuration);

        setDailySteps(totalSteps);
        setDailyDuration(totalDuration);
        setActivities(data); // Store the activities data

        // Update weekly data with the new totals
        updateWeeklyData(totalSteps, totalDuration);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to changes in the weekly step goal from Firebase
  useEffect(() => {
    const fetchWeeklyStepGoal = () => {
      const db = getDatabase();
      const user = auth.currentUser;
      if (user) {
        const weeklyStepGoalRef = ref(
          db,
          `Users/${user.uid}/Goals/weeklySteps`
        );
        onValue(weeklyStepGoalRef, (snapshot) => {
          if (snapshot.exists()) {
            const value = snapshot.val();
            setStepGoal(Number(value));
          }
        });
      }
    };
    fetchWeeklyStepGoal();
  }, []);

  // Load saved data on component mount
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Load step data from storage
  const loadData = async () => {
    try {
      // Load weekly data
      const weeklyDataString = await AsyncStorage.getItem('weekly_stats');
      if (weeklyDataString) {
        const parsedData = JSON.parse(weeklyDataString);
        console.log('Loaded weekly data:', parsedData);

        // Ensure the "today" marker is correctly set
        const today = new Date().getDay();
        const updatedData = parsedData.map((day, index) => ({
          ...day,
          day:
            day.day || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index], // Ensure day label exists
          isToday: index === today,
        }));

        console.log('Updated weekly data with day labels:', updatedData);
        setWeeklyData(updatedData);
      } else {
        // Initialize weekly data if none exists
        await initializeWeeklyData();
      }

      // Load step goal from AsyncStorage as a fallback
      const goalString = await AsyncStorage.getItem('step_goal');
      if (goalString) {
        setStepGoal(parseInt(goalString));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Initialize weekly data structure
  const initializeWeeklyData = async () => {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const today = new Date().getDay();
    console.log('Today day index for initialization:', today);

    const newWeeklyData = days.map((day, index) => ({
      day: day.substring(0, 3), // First 3 letters of each day
      steps: 0,
      duration: 0,
      isToday: index === today,
    }));

    console.log('Initialized weekly data:', newWeeklyData);
    setWeeklyData(newWeeklyData);
    await AsyncStorage.setItem('weekly_stats', JSON.stringify(newWeeklyData));
  };

  // Update weekly data based on processed activities
  const updateWeeklyData = async (steps, duration) => {
    if (!weeklyData || weeklyData.length === 0) {
      console.log('Weekly data not initialized yet, initializing first');
      await initializeWeeklyData();
      return;
    }

    const todayIndex = new Date().getDay();
    console.log('Updating weekly data for day index:', todayIndex);

    // Update weekly data
    const updatedWeeklyData = [...weeklyData];
    updatedWeeklyData[todayIndex] = {
      ...updatedWeeklyData[todayIndex],
      steps: steps,
      duration: duration,
      isToday: true,
    };

    console.log('Updated weekly data:', updatedWeeklyData);
    setWeeklyData(updatedWeeklyData);
    await AsyncStorage.setItem(
      'weekly_stats',
      JSON.stringify(updatedWeeklyData)
    );
  };

  // Update daily and weekly stats
  const updateDailyStats = async (newSteps, newDuration) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayIndex = new Date().getDay();

      // Update daily stats
      const updatedSteps = dailySteps + newSteps;
      const updatedDuration = dailyDuration + newDuration;

      setDailySteps(updatedSteps);
      setDailyDuration(updatedDuration);

      // Save daily stats
      await AsyncStorage.setItem(
        `stats_${today}`,
        JSON.stringify({
          steps: updatedSteps,
          duration: updatedDuration,
        })
      );

      // Update weekly data
      const updatedWeeklyData = [...weeklyData];
      updatedWeeklyData[todayIndex] = {
        ...updatedWeeklyData[todayIndex],
        steps: updatedSteps,
        duration: updatedDuration,
      };

      setWeeklyData(updatedWeeklyData);
      await AsyncStorage.setItem(
        'weekly_stats',
        JSON.stringify(updatedWeeklyData)
      );
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  // Handler for updating the weekly step goal in Firebase
  const handleUpdateStepGoal = async () => {
    const db = getDatabase();
    const user = auth.currentUser;
    if (!user) return;

    const goalNumber = parseInt(newWeeklyStepGoal, 10);
    if (isNaN(goalNumber)) {
      Alert.alert('Invalid Input', 'Please enter a valid number.');
      return;
    }

    const weeklyStepGoalRef = ref(db, `Users/${user.uid}/Goals/weeklySteps`);
    set(weeklyStepGoalRef, goalNumber)
      .then(() => {
        Alert.alert('Success', 'Weekly step goal updated.');
        setNewWeeklyStepGoal('');
      })
      .catch((error) => {
        Alert.alert('Error', 'Failed to update goal: ' + error.message);
      });
  };

  // Format time from seconds to mm:ss
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculate distance from steps
  const calculateDistance = (steps) => {
    const stepLength = 0.76; // Approximate step length in meters
    const distanceInMeters = steps * stepLength;

    if (distanceInMeters >= 1000) {
      return (distanceInMeters / 1000).toFixed(2) + ' km';
    }
    return distanceInMeters.toFixed(2) + ' m';
  };

  // Calculate calories burned (very approximate)
  const calculateCalories = (steps, duration) => {
    const caloriesPerMinute = 4;
    const minutes = duration / 60;
    return Math.round(caloriesPerMinute * minutes);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Date Header */}
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        {/* Main Progress Circle */}
        <View style={styles.circleContainer}>
          <AnimatedCircularProgress
            size={250}
            width={15}
            fill={(dailySteps / stepGoal) * 100}
            tintColor="#09355c"
            backgroundColor="#e0e0e0"
            lineCap="round"
            rotation={210}
            arcSweepAngle={300}
          >
            {(fill) => (
              <View style={styles.circleContent}>
                <Text style={styles.stepsNumber}>{dailySteps}</Text>
                <Text style={styles.stepsLabel}>Steps</Text>
                <Text style={styles.stepsGoal}>Goal: {stepGoal}</Text>
              </View>
            )}
          </AnimatedCircularProgress>
        </View>

        {/* Weekly Step Goal Update */}
        <View style={styles.goalUpdateContainer}>
          <TextInput
            style={styles.goalInput}
            value={newWeeklyStepGoal}
            onChangeText={setNewWeeklyStepGoal}
            placeholder="Set new weekly step goal"
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.updateGoalButton}
            onPress={handleUpdateStepGoal}
          >
            <Text style={styles.updateGoalButtonText}>Update Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Metrics Cards */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <FontAwesome5 name="shoe-prints" size={24} color="#09355c" />
            <Text style={styles.metricValue}>
              {calculateDistance(dailySteps)}
            </Text>
            <Text style={styles.metricLabel}>Distance</Text>
          </View>

          <View style={styles.metricCard}>
            <FontAwesome5 name="clock" size={24} color="#09355c" />
            <Text style={styles.metricValue}>{formatTime(dailyDuration)}</Text>
            <Text style={styles.metricLabel}>Active Time</Text>
          </View>

          <View style={styles.metricCard}>
            <FontAwesome5 name="fire" size={24} color="#09355c" />
            <Text style={styles.metricValue}>
              {calculateCalories(dailySteps, dailyDuration)}
            </Text>
            <Text style={styles.metricLabel}>Calories</Text>
          </View>
        </View>

        {/* Weekly Progress */}
        <View style={styles.weeklyContainer}>
          <Text style={styles.weeklyTitle}>Weekly Progress</Text>
          <View style={styles.weeklyBars}>
            {weeklyData.map((day, index) => (
              <View key={index} style={styles.dayBar}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.min(
                          (day.steps / stepGoal) * 100,
                          100
                        )}%`,
                        backgroundColor: day.isToday ? '#09355c' : '#4682B4',
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.dayLabel, day.isToday && styles.todayLabel]}
                  numberOfLines={1}
                >
                  {day.day}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Today's Activities */}
        {activities.Cardio &&
          Object.keys(activities.Cardio).some(
            (id) => activities.Cardio[id].date === todayDate
          ) && (
            <View style={styles.activityContainer}>
              <Text style={styles.activityTitle}>Today's Activities</Text>
              {Object.entries(activities.Cardio)
                .filter(([id, details]) => details.date === todayDate)
                .map(([id, details]) => (
                  <View key={id} style={styles.activityItem}>
                    <Text style={styles.activityText}>
                      Total Steps: {details.steps}
                    </Text>
                    <Text style={styles.activityText}>
                      Cardio Duration: {formatTime(details.cardioDuration)}
                    </Text>
                  </View>
                ))}
            </View>
          )}

        {/* Spacer for bottom nav */}
        <View style={{ height: 70 }} />
      </ScrollView>
      <NavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  dateContainer: {
    backgroundColor: '#09355c',
    padding: 20,
    marginTop: 50,
    paddingTop: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  dateText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  circleContainer: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  circleContent: { alignItems: 'center', justifyContent: 'center' },
  stepsNumber: { fontSize: 40, fontWeight: 'bold', color: '#09355c' },
  stepsLabel: { fontSize: 16, color: '#666' },
  stepsGoal: { fontSize: 14, color: '#888', marginTop: 5 },
  goalUpdateContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 15,
    marginBottom: 20,
  },
  goalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    width: '60%',
    borderRadius: 6,
    backgroundColor: '#fff',
    marginRight: 10,
  },
  updateGoalButton: {
    backgroundColor: '#09355c',
    padding: 10,
    borderRadius: 6,
    justifyContent: 'center',
  },
  updateGoalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 15,
    marginVertical: 20,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  metricLabel: { fontSize: 12, color: '#666' },
  weeklyContainer: {
    marginHorizontal: 15,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  weeklyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  weeklyBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 120,
    marginTop: 10,
    paddingHorizontal: 5,
  },
  dayBar: {
    alignItems: 'center',
    width: '13%',
    marginHorizontal: 2,
  },
  barContainer: {
    height: '85%',
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: '#4682B4',
    borderRadius: 10,
  },
  dayLabel: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  todayLabel: {
    fontWeight: 'bold',
    color: '#09355c',
  },
  activityContainer: {
    marginHorizontal: 15,
    marginTop: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 15,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  activityItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  activityText: { fontSize: 16, color: '#333' },
});

export default StepTrackingScreen;
