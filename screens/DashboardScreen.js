import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Dimensions,
  ImageBackground,
  Platform,
} from 'react-native';
import { FontAwesome, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import NavBar from '../components/NavBar';
import { auth } from '../services/firebaseConfig';
import { getDatabase, ref, onValue } from 'firebase/database';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { setupActivityListener } from '../services/fetchUserActivities';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [goals, setGoals] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [stepData, setStepData] = useState({
    today: 0,
    goal: 10000,
    distance: '0 m',
    calories: 0,
    duration: 0,
  });
  const [greeting, setGreeting] = useState('');

  // Setup activity listener from UserStats
  useEffect(() => {
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

        setStepData((prevState) => ({
          ...prevState,
          today: totalSteps,
          duration: totalDuration,
          distance: calculateDistance(totalSteps),
          calories: calculateCalories(totalSteps, totalDuration),
        }));
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
            setStepData((prevState) => ({
              ...prevState,
              goal: Number(value),
            }));
          }
        });
      }
    };
    fetchWeeklyStepGoal();
  }, []);

  // Calculate distance from steps
  const calculateDistance = (steps) => {
    const stepLength = 0.76; // Approximate step length in meters
    const distanceInMeters = steps * stepLength;

    if (distanceInMeters >= 1000) {
      return (distanceInMeters / 1000).toFixed(2) + ' km';
    }
    return distanceInMeters.toFixed(2) + ' m';
  };

  // Calculate calories burned
  const calculateCalories = (steps, duration) => {
    const caloriesPerMinute = 4;
    const minutes = duration / 60;
    return Math.round(caloriesPerMinute * minutes);
  };

  // Format time from seconds to mm:ss
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // IMPORTANT: Hide the header to remove "Dashboard" text
    navigation.setOptions({
      headerShown: false,
    });

    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Fetch user data
    fetchUserData();
  }, [navigation]);

  const fetchUserData = () => {
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();

    // Fetch profile
    const profileRef = ref(db, `Users/${user.uid}`);
    onValue(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.val());
      }
    });

    // Fetch goals
    const goalsRef = ref(db, `Users/${user.uid}/Goals`);
    onValue(goalsRef, (snapshot) => {
      if (snapshot.exists()) {
        const goalsData = snapshot.val();
        const goalsArray = Object.entries(goalsData)
          .map(([id, value]) => ({ id, ...value }))
          .filter((goal) => !goal.completed)
          .sort((a, b) => a.deadline - b.deadline)
          .slice(0, 2); // Get only 2 upcoming goals
        setGoals(goalsArray);
      }
    });

    // Fetch activities
    const activitiesRef = ref(db, `Users/${user.uid}/Activities`);
    onValue(activitiesRef, (snapshot) => {
      if (snapshot.exists()) {
        const activitiesData = snapshot.val();
        const activitiesArray = Object.values(activitiesData)
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3); // Get only 3 recent activities
        setRecentActivities(activitiesArray);
      }
    });

    // Fetch workouts to set today's suggested workout
    const workoutsRef = ref(db, `Users/${user.uid}/MyWorkout`);
    onValue(workoutsRef, (snapshot) => {
      if (snapshot.exists()) {
        const workouts = snapshot.val();
        if (workouts && workouts.length > 0) {
          // For demo purposes, just pick a random workout as "today's workout"
          const randomIndex = Math.floor(Math.random() * workouts.length);
          setTodayWorkout(workouts[randomIndex]);
        }
      }
    });
  };

  // Calculate step progress percentage
  const stepProgressPercentage = Math.min(
    (stepData.today / stepData.goal) * 100,
    100
  );

  // Format date for displaying
  const formatDate = () => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  // Calculate deadline status
  const getDeadlineStatus = (deadline) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((deadlineDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1) return `In ${diffDays} days`;
    return 'Overdue';
  };

  // Quick access items
  const quickAccessItems = [
    {
      title: 'My Workout',
      icon: 'dumbbell',
      iconFamily: 'FontAwesome5',
      navigateTo: 'MyWorkout',
      color: '#053559',
    },
    {
      title: 'Track',
      icon: 'bar-chart',
      iconFamily: 'FontAwesome',
      navigateTo: 'TrackWorkout',
      color: '#053559',
    },
    {
      title: 'Goals',
      icon: 'trophy',
      iconFamily: 'FontAwesome',
      navigateTo: 'MyGoalsScreen',
      color: '#053559',
    },
    {
      title: 'Activities',
      icon: 'list',
      iconFamily: 'FontAwesome',
      navigateTo: 'MyActivity',
      color: '#053559',
    },
    {
      title: 'Meals',
      icon: 'cutlery',
      iconFamily: 'FontAwesome',
      navigateTo: 'MealPreferences',
      color: '#053559',
    },
    {
      title: 'Log Calories',
      icon: 'calculator',
      iconFamily: 'FontAwesome',
      navigateTo: 'LogCalories',
      color: '#053559',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#053559"
        translucent={true}
      />

      {/* Hero Section with KeanBG.png Background */}
      <ImageBackground
        source={require('../assets/KeanBG.png')}
        style={styles.heroSection}
        resizeMode="cover"
      >
        {/* Profile section */}
        <View style={styles.profileSection}>
          <View style={styles.profileInfo}>
            <Text style={styles.greetingText}>{greeting},</Text>
            <Text style={styles.nameText}>
              {profile?.Name || 'Fitness Enthusiast'}
            </Text>
            <Text style={styles.dateText}>{formatDate()}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={() => navigation.navigate('Profile')}
          >
            {profile?.profileImage ? (
              <Image
                source={{ uri: profile.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileIconBg}>
                <FontAwesome name="user-circle" size={40} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ImageBackground>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Dashboard Content */}
        <View style={styles.dashboardContent}>
          {/* Step Tracking Progress - Preview Style */}
          <View style={styles.stepProgressCard}>
            <View style={styles.stepProgressHeader}>
              <View>
                <Text style={styles.stepProgressTitle}>Today's Steps</Text>
                <Text style={styles.stepCount}>
                  {stepData.today.toLocaleString()} /{' '}
                  {stepData.goal.toLocaleString()}
                </Text>
              </View>
              <FontAwesome5 name="walking" size={24} color="#053559" />
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${stepProgressPercentage}%` },
                ]}
              />
            </View>

            {/* Quick Metrics */}
            <View style={styles.stepMetricsContainer}>
              <View style={styles.stepMetric}>
                <FontAwesome5 name="shoe-prints" size={14} color="#053559" />
                <Text style={styles.stepMetricValue}>{stepData.distance}</Text>
              </View>

              <View style={styles.stepMetric}>
                <FontAwesome5 name="clock" size={14} color="#053559" />
                <Text style={styles.stepMetricValue}>
                  {formatTime(stepData.duration)}
                </Text>
              </View>

              <View style={styles.stepMetric}>
                <FontAwesome5 name="fire" size={14} color="#053559" />
                <Text style={styles.stepMetricValue}>
                  {stepData.calories} cal
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.stepTrackingButton}
              onPress={() => navigation.navigate('StepTracking')}
            >
              <Text style={styles.stepTrackingButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>

          {/* Today's Workout Section */}
          {todayWorkout ? (
            <View style={styles.todayWorkoutContainer}>
              <Text style={styles.sectionTitle}>Today's Workout</Text>
              <TouchableOpacity
                style={styles.workoutCard}
                onPress={() => navigation.navigate('MyWorkout')}
              >
                <View style={styles.workoutCardContent}>
                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutTitle}>{todayWorkout.name}</Text>
                    <Text style={styles.workoutCategory}>
                      {todayWorkout.Category || 'General'}
                    </Text>
                    <View style={styles.workoutMeta}>
                      {todayWorkout.difficulty && (
                        <View style={styles.difficultyContainer}>
                          {[1, 2, 3, 4, 5].map((level) => (
                            <FontAwesome
                              key={level}
                              name="circle"
                              size={8}
                              color={
                                level <= todayWorkout.difficulty
                                  ? '#053559'
                                  : '#e0e0e0'
                              }
                              style={{ marginRight: 3 }}
                            />
                          ))}
                        </View>
                      )}
                      <Text style={styles.difficultyLabel}>
                        {todayWorkout.difficulty
                          ? todayWorkout.difficulty === 1
                            ? 'Beginner'
                            : todayWorkout.difficulty === 2
                            ? 'Easy'
                            : todayWorkout.difficulty === 3
                            ? 'Moderate'
                            : todayWorkout.difficulty === 4
                            ? 'Advanced'
                            : 'Expert'
                          : 'Difficulty not set'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.startButtonContainer}>
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={() =>
                        navigation.navigate('TrackWorkout', {
                          workout: todayWorkout,
                          category: todayWorkout.Category,
                          subCategory: todayWorkout.name,
                        })
                      }
                    >
                      <Text style={styles.startButtonText}>Start</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.noWorkoutCard}
              onPress={() => navigation.navigate('MyWorkout')}
            >
              <Text style={styles.noWorkoutTitle}>No Workout Selected</Text>
              <Text style={styles.noWorkoutText}>
                Tap here to choose a workout for today
              </Text>
            </TouchableOpacity>
          )}

          {/* Goals Section */}
          <View style={styles.goalsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Goals</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('MyGoalsScreen')}
              >
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {goals.length > 0 ? (
              <View style={styles.goalsList}>
                {goals.map((goal, index) => (
                  <TouchableOpacity
                    key={goal.id}
                    style={styles.goalItem}
                    onPress={() => navigation.navigate('MyGoalsScreen')}
                  >
                    <View style={styles.goalIconContainer}>
                      {goal.category === 'Cardio' ? (
                        <FontAwesome
                          name="heartbeat"
                          size={22}
                          color="#053559"
                        />
                      ) : goal.category === 'Strength' ? (
                        <FontAwesome5
                          name="dumbbell"
                          size={22}
                          color="#053559"
                        />
                      ) : (
                        <FontAwesome name="leaf" size={22} color="#053559" />
                      )}
                    </View>
                    <View style={styles.goalContent}>
                      <Text style={styles.goalTitle}>
                        {goal.title || `${goal.category} Goal`}
                      </Text>
                      <Text style={styles.goalDeadline}>
                        {getDeadlineStatus(goal.deadline)}
                      </Text>
                    </View>
                    <FontAwesome name="chevron-right" size={16} color="#999" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.noGoalsContainer}
                onPress={() => navigation.navigate('MyGoalsScreen')}
              >
                <Text style={styles.noContentText}>
                  No goals set. Tap to create a goal.
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Access Grid */}
          <View style={styles.quickAccessSection}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.quickAccessGrid}>
              {quickAccessItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickAccessItem}
                  onPress={() => navigation.navigate(item.navigateTo)}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: item.color },
                    ]}
                  >
                    {item.iconFamily === 'FontAwesome5' ? (
                      <FontAwesome5 name={item.icon} size={22} color="#fff" />
                    ) : (
                      <FontAwesome name={item.icon} size={22} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.quickAccessText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Activities */}
          <View style={styles.recentActivitiesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activities</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('MyActivity')}
              >
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {recentActivities.length > 0 ? (
              <View style={styles.activitiesList}>
                {recentActivities.map((activity, index) => (
                  <View key={index} style={styles.activityItem}>
                    <View style={styles.activityIconContainer}>
                      {activity.type === 'Cardio' ? (
                        <FontAwesome5 name="running" size={20} color="#fff" />
                      ) : activity.type === 'Strength' ? (
                        <FontAwesome5 name="dumbbell" size={20} color="#fff" />
                      ) : activity.type === 'Yoga' ? (
                        <FontAwesome name="leaf" size={20} color="#fff" />
                      ) : (
                        <FontAwesome name="star" size={20} color="#fff" />
                      )}
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>
                        {activity.name || activity.type}
                      </Text>
                      <Text style={styles.activityDate}>{activity.date}</Text>
                    </View>
                    {activity.duration && (
                      <View style={styles.activityStats}>
                        <Text style={styles.activityDuration}>
                          {activity.duration} min
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noActivitiesContainer}>
                <Text style={styles.noContentText}>
                  No recent activities to show.
                </Text>
              </View>
            )}
          </View>

          {/* Motivation Quote */}
          <LinearGradient
            colors={['#053559', '#09355c']}
            style={styles.motivationCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.quoteContainer}>
              <Text style={styles.quoteText}>
                "The difference between try and triumph is just a little umph!"
              </Text>
              <Text style={styles.quoteAuthor}>- KEANFIT</Text>
            </View>

            <View style={styles.logoWatermark}>
              <FontAwesome name="paw" size={60} color="rgba(255,255,255,0.2)" />
            </View>
          </LinearGradient>

          {/* Bottom Padding for NavBar */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
  },
  heroSection: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 15,
    position: 'relative', // For positioning the logo background
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    zIndex: 10,
    overflow: 'hidden', // Make sure the rounded corners show properly
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 2, // Above the background logo
  },
  profileInfo: {
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    marginTop: 30,
    color: '#fff',
    opacity: 0.9,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  dateText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    marginTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileIconBg: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 5,
    borderRadius: 25,
  },
  dashboardContent: {
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  stepProgressCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  stepProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  stepProgressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stepCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#053559',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginBottom: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#053559',
    borderRadius: 5,
  },
  stepMetricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingTop: 5,
    paddingBottom: 5,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  stepMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  stepMetricValue: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  stepTrackingButton: {
    backgroundColor: '#053559',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  stepTrackingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  todayWorkoutContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  workoutCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  workoutCardContent: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#053559',
    marginBottom: 4,
  },
  workoutCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyContainer: {
    flexDirection: 'row',
    marginRight: 8,
    alignItems: 'center',
  },
  difficultyLabel: {
    fontSize: 12,
    color: '#888',
  },
  startButtonContainer: {
    paddingLeft: 15,
  },
  startButton: {
    backgroundColor: '#053559',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  noWorkoutCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 25,
    marginBottom: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noWorkoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#053559',
    marginBottom: 10,
  },
  noWorkoutText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  goalsSection: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 14,
    color: '#053559',
    fontWeight: '600',
  },
  goalsList: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  goalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  goalDeadline: {
    fontSize: 14,
    color: '#666',
  },
  noGoalsContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noContentText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  quickAccessSection: {
    marginBottom: 25,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAccessItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  recentActivitiesSection: {
    marginBottom: 25,
  },
  activitiesList: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#053559',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 14,
    color: '#666',
  },
  activityStats: {
    paddingLeft: 10,
  },
  activityDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#053559',
  },
  noActivitiesContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  motivationCard: {
    borderRadius: 18,
    padding: 25,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  quoteContainer: {
    zIndex: 2,
  },
  quoteText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#FFCB05', // Yellow from logo
    textAlign: 'right',
    fontWeight: 'bold',
  },
  logoWatermark: {
    position: 'absolute',
    right: 20,
    bottom: -15,
    opacity: 0.7,
    zIndex: 1,
  },
  bottomPadding: {
    height: 100,
  },
});
