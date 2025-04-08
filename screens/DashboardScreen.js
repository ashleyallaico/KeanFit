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
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import NavBar from '../components/NavBar';
import { auth } from '../services/firebaseConfig';
import { getDatabase, ref, onValue } from 'firebase/database';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [goals, setGoals] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [stepData, setStepData] = useState({ today: 0, goal: 10000 });
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Fetch user data
    fetchUserData();
  }, []);

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

    // Fetch step data (simplified mock)
    // In a real app, you would fetch actual step tracking data
    const stepRef = ref(db, `Users/${user.uid}/StepTracking`);
    onValue(stepRef, (snapshot) => {
      if (snapshot.exists()) {
        const stepDataFromDB = snapshot.val();
        const latestDay = Object.keys(stepDataFromDB).sort().pop();
        if (latestDay && stepDataFromDB[latestDay]) {
          setStepData({
            today: stepDataFromDB[latestDay].steps || 0,
            goal: 10000, // Default goal
          });
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
      navigateTo: 'MyWorkout',
      color: '#4A6572',
    },
    {
      title: 'Track',
      icon: 'bar-chart',
      navigateTo: 'TrackWorkout',
      color: '#4A6572',
    },
    {
      title: 'Goals',
      icon: 'trophy',
      navigateTo: 'MyGoalsScreen',
      color: '#4A6572',
    },
    {
      title: 'Activities',
      icon: 'list-alt',
      navigateTo: 'MyActivity',
      color: '#4A6572',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header Background */}
      <LinearGradient
        colors={['#053559', '#09355c']}
        style={styles.headerGradient}
      />

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
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
            <FontAwesome name="user-circle" size={50} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Step Tracking Progress */}
        <View style={styles.stepProgressCard}>
          <View style={styles.stepProgressHeader}>
            <View>
              <Text style={styles.stepProgressTitle}>Today's Steps</Text>
              <Text style={styles.stepCount}>
                {stepData.today.toLocaleString()} /{' '}
                {stepData.goal.toLocaleString()}
              </Text>
            </View>
            <FontAwesome name="shoe-prints" size={24} color="#09355c" />
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${stepProgressPercentage}%` },
              ]}
            />
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
                                ? '#09355c'
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
                  <TouchableOpacity style={styles.startButton}>
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
                    <FontAwesome
                      name={
                        goal.category === 'Cardio'
                          ? 'heartbeat'
                          : goal.category === 'Strength'
                          ? 'dumbbell'
                          : 'spa'
                      }
                      size={22}
                      color="#09355c"
                    />
                  </View>
                  <View style={styles.goalContent}>
                    <Text style={styles.goalTitle}>{goal.category} Goal</Text>
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
                  <FontAwesome name={item.icon} size={22} color="#fff" />
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
            <TouchableOpacity onPress={() => navigation.navigate('MyActivity')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentActivities.length > 0 ? (
            <View style={styles.activitiesList}>
              {recentActivities.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={styles.activityIconContainer}>
                    <FontAwesome
                      name={
                        activity.type === 'Cardio'
                          ? 'running'
                          : activity.type === 'Strength'
                          ? 'dumbbell'
                          : activity.type === 'Yoga'
                          ? 'spa'
                          : 'star'
                      }
                      size={20}
                      color="#fff"
                    />
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
        <View style={styles.motivationCard}>
          <Text style={styles.quoteText}>
            "The difference between try and triumph is just a little umph!"
          </Text>
          <Text style={styles.quoteAuthor}>- KEANFIT</Text>
        </View>

        {/* Bottom Padding for NavBar */}
        <View style={styles.bottomPadding} />
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
  headerGradient: {
    position: 'absolute',
    height: 220,
    left: 0,
    right: 0,
    top: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  scrollContainer: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  profileInfo: {
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepProgressCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  stepProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  stepCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#09355c',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#09355c',
    borderRadius: 4,
  },
  stepTrackingButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  stepTrackingButtonText: {
    fontSize: 14,
    color: '#09355c',
    fontWeight: '600',
  },
  todayWorkoutContainer: {
    marginTop: 25,
    paddingHorizontal: 20,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    color: '#09355c',
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
    backgroundColor: '#09355c',
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
    marginHorizontal: 20,
    marginTop: 25,
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
    color: '#09355c',
    marginBottom: 10,
  },
  noWorkoutText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  goalsSection: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 14,
    color: '#09355c',
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
    marginTop: 25,
    paddingHorizontal: 20,
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
    marginTop: 25,
    paddingHorizontal: 20,
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
    backgroundColor: '#09355c',
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
    color: '#09355c',
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
    backgroundColor: '#09355c',
    borderRadius: 18,
    padding: 25,
    marginHorizontal: 20,
    marginTop: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    color: '#fff',
    opacity: 0.8,
  },
  bottomPadding: {
    height: 100,
  },
});
