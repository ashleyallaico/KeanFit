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
import { useNavigation } from '@react-navigation/native';
import { setupActivityListener } from '../services/fetchUserActivities';
import { getDatabase, ref, set, onValue } from 'firebase/database';
import { auth } from '../services/firebaseConfig';

const StepTrackingScreen = ({ route, navigation }) => {
  // State variables
  const [dailySteps, setDailySteps] = useState(0);
  const [dailyDuration, setDailyDuration] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);
  const [date] = useState(new Date());
  const [stepGoal, setStepGoal] = useState(10000);
  const [newWeeklyStepGoal, setNewWeeklyStepGoal] = useState('');
  const [activities, setActivities] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);

  // Get current date in readable format
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const todayDate = date.toLocaleDateString();

  // Load saved data on component mount
  useEffect(() => {
    loadData();

    // Add listener for when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('StepTracking screen is focused, reloading data');
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  // Load step data from storage
  const loadData = async () => {
    try {
      console.log('Loading data from AsyncStorage');
      // Load weekly data
      const weeklyDataString = await AsyncStorage.getItem('weekly_stats');
      console.log('Loaded weekly data string:', weeklyDataString);

      if (weeklyDataString) {
        const parsedData = JSON.parse(weeklyDataString);
        console.log('Parsed weekly data:', parsedData);
        setWeeklyData(parsedData);

        // Get today's data from the weekly data
        const today = new Date().getDay();
        const todayData = parsedData.find((day, index) => index === today);
        if (todayData) {
          console.log('Found today data:', todayData);
          setDailySteps(todayData.steps || 0);
          setDailyDuration(todayData.duration || 0);
        }
      } else {
        // Initialize weekly data if none exists
        console.log('No weekly data found, initializing...');
        initializeWeeklyData();
      }

      // Load step goal from AsyncStorage as a fallback
      const goalString = await AsyncStorage.getItem('step_goal');
      if (goalString) {
        setStepGoal(parseInt(goalString));
      }

      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    // Hide the header to be consistent with dashboard
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Initialize weekly data structure
  const initializeWeeklyData = async () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();

    const newWeeklyData = days.map((day, index) => ({
      day,
      steps: index === today ? dailySteps : 0,
      duration: index === today ? dailyDuration : 0,
      isToday: index === today,
    }));

    console.log('Initialized weekly data:', newWeeklyData);
    setWeeklyData(newWeeklyData);
    try {
      await AsyncStorage.setItem('weekly_stats', JSON.stringify(newWeeklyData));
      console.log('Weekly data saved to AsyncStorage');
    } catch (error) {
      console.error('Error saving weekly data:', error);
    }
  };

  // Update weekly data based on processed activities
  const updateWeeklyData = async (steps, duration) => {
    console.log('updateWeeklyData called with:', steps, duration);
    console.log('Current weeklyData:', weeklyData);

    if (!weeklyData || weeklyData.length === 0) {
      console.log('No weekly data, initializing...');
      await initializeWeeklyData();
      return;
    }

    const todayIndex = new Date().getDay();
    console.log('Today index:', todayIndex);

    // Update weekly data
    const updatedWeeklyData = weeklyData.map((day, index) => ({
      ...day,
      steps: index === todayIndex ? steps : day.steps,
      duration: index === todayIndex ? duration : day.duration,
      isToday: index === todayIndex,
    }));

    console.log('Updated weekly data:', updatedWeeklyData);
    setWeeklyData(updatedWeeklyData);
    try {
      await AsyncStorage.setItem(
        'weekly_stats',
        JSON.stringify(updatedWeeklyData)
      );
      console.log('Updated weekly data saved to AsyncStorage');
    } catch (error) {
      console.error('Error saving updated weekly data:', error);
    }
  };

  // Setup activity listener from UserStats - only after data is loaded first time
  useEffect(() => {
    if (!dataLoaded) return;

    console.log('Setting up activity listener');
    const unsubscribe = setupActivityListener((data) => {
      console.log('Received activities data:', data);

      if (data && data.Cardio) {
        let totalSteps = 0;
        let totalDuration = 0;
        const today = new Date();
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
        updateWeeklyData(totalSteps, totalDuration);
        setActivities(data); // Save the activities data for displaying today's activities
      }
    });

    return () => unsubscribe();
  }, [dataLoaded]);

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

  // Calculate height for weekly progress bars
  const calculateBarHeight = (steps) => {
    return Math.max((steps / stepGoal) * 100, 5);
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
        // Also update in local state
        setStepGoal(goalNumber);
        // Save to AsyncStorage as backup
        AsyncStorage.setItem('step_goal', goalNumber.toString());
      })
      .catch((error) => {
        Alert.alert('Error', 'Failed to update goal: ' + error.message);
      });
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
            fill={Math.min((dailySteps / stepGoal) * 100, 100)}
            tintColor="#09355c"
            backgroundColor="#e0e0e0"
            lineCap="round"
            rotation={210}
            arcSweepAngle={300}
          >
            {() => (
              <View style={styles.circleContent}>
                <Text style={styles.stepsNumber}>
                  {dailySteps.toLocaleString()}
                </Text>
                <Text style={styles.stepsLabel}>Steps</Text>
                <Text style={styles.stepsGoal}>
                  Goal: {stepGoal.toLocaleString()}
                </Text>
              </View>
            )}
          </AnimatedCircularProgress>
        </View>

        {/* Step Goal Edit Section */}
        <View style={styles.goalEditContainer}>
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
            {weeklyData && weeklyData.length > 0 ? (
              weeklyData.map((day, index) => {
                // Ensure we have valid values to prevent NaN
                const steps = typeof day.steps === 'number' ? day.steps : 0;
                // Only show a percentage if there are steps, otherwise 0
                const percentage =
                  steps > 0
                    ? Math.max((steps / (stepGoal || 10000)) * 100, 5)
                    : 0;
                const barHeight = (percentage / 100) * 150; // 150 is the container height

                console.log(
                  `Bar for ${day.day}: steps=${steps}, height=${barHeight}px`
                );

                return (
                  <View key={index} style={styles.dayBar}>
                    <View style={styles.barContainer}>
                      {steps > 0 && (
                        <View
                          style={[
                            styles.bar,
                            {
                              height: barHeight,
                              backgroundColor: day.isToday
                                ? '#09355c'
                                : '#4682B4',
                            },
                          ]}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.dayLabel,
                        day.isToday && styles.todayLabel,
                      ]}
                    >
                      {day.day}
                    </Text>
                    <Text style={styles.stepsText}>
                      {steps.toLocaleString()}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noDataText}>No weekly data available</Text>
            )}
          </View>
        </View>

        {/* Spacer for bottom nav */}
        <View style={{ height: 70 }} />
      </ScrollView>

      <NavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  dateContainer: {
    backgroundColor: '#09355c',
    padding: 20,
    paddingTop: 80, // Increased padding to account for status bar
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  circleContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  circleContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#09355c',
  },
  stepsLabel: {
    fontSize: 16,
    color: '#666',
  },
  stepsGoal: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
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
  metricLabel: {
    fontSize: 12,
    color: '#666',
  },
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
    height: 200,
    marginTop: 10,
  },
  dayBar: {
    alignItems: 'center',
    width: '13%',
    height: 200,
  },
  barContainer: {
    height: 150,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#09355c',
  },
  bar: {
    width: '100%',
    backgroundColor: '#4682B4',
    borderRadius: 10,
    position: 'absolute',
    bottom: 0,
    minHeight: 5,
    borderWidth: 1,
    borderColor: '#09355c',
  },
  dayLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  todayLabel: {
    fontWeight: 'bold',
    color: '#09355c',
  },
  stepsText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  noDataText: {
    textAlign: 'center',
    width: '100%',
    color: '#666',
    fontSize: 14,
    marginTop: 50,
  },
  goalEditContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 15,
    marginTop: -15,
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
  editGoalButton: {
    backgroundColor: '#09355c',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  editGoalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default StepTrackingScreen;
