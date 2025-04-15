import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ImageBackground,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { getDatabase, ref, get, set } from 'firebase/database';
import { auth } from '../services/firebaseConfig';
import NavBar from '../components/NavBar';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import Disclaimer from '../components/Disclaimer';
import { LinearGradient } from 'expo-linear-gradient';

const MyWorkoutScreen = ({ navigation }) => {
  const [userWorkouts, setUserWorkouts] = useState([]);
  const [groupedWorkouts, setGroupedWorkouts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hide the header to be consistent with dashboard
    navigation.setOptions({
      headerShown: false,
    });

    fetchUserWorkouts();
  }, [navigation]);

  const fetchUserWorkouts = async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (!user) {
      console.error('User not authenticated');
      setLoading(false);
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
      console.error('Failed to fetch user workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupWorkoutsByCategory = (workouts) => {
    const grouped = {};
    workouts.forEach((workout) => {
      const category = workout.Category || 'Uncategorized';
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
      console.error('User not authenticated');
      return;
    }

    const db = getDatabase();
    const userWorkoutsRef = ref(db, `Users/${user.uid}/MyWorkout`);

    try {
      const updatedWorkouts = userWorkouts.filter(
        (w) => w.name !== workout.name
      );
      await set(userWorkoutsRef, updatedWorkouts);
      setUserWorkouts(updatedWorkouts);
      groupWorkoutsByCategory(updatedWorkouts);
      console.log(`Workout removed: ${workout.name}`);
    } catch (error) {
      console.error('Failed to remove workout:', error);
    }
  };

  const getDifficultyLabel = (level) => {
    switch (level) {
      case 1:
        return 'Beginner';
      case 2:
        return 'Easy';
      case 3:
        return 'Moderate';
      case 4:
        return 'Advanced';
      case 5:
        return 'Expert';
      default:
        return 'Not set';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'cardio':
        return <FontAwesome5 name="running" size={24} color="#fff" />;
      case 'strength':
        return <FontAwesome5 name="dumbbell" size={24} color="#fff" />;
      case 'yoga':
      case 'flexibility':
        return <FontAwesome5 name="spa" size={22} color="#fff" />;
      case 'hiit':
        return <FontAwesome5 name="bolt" size={24} color="#fff" />;
      default:
        return <FontAwesome5 name="dumbbell" size={24} color="#fff" />;
    }
  };

  const renderWorkoutItem = ({ item }) => (
    <View style={styles.workoutCard}>
      <View style={styles.workoutHeader}>
        <View style={styles.workoutTitleSection}>
          <Text style={styles.workoutTitle}>{item.name}</Text>
          {item.Category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.Category}</Text>
            </View>
          )}
        </View>
        <View
          style={[
            styles.categoryIconContainer,
            { backgroundColor: getCategoryColor(item.Category) },
          ]}
        >
          {getCategoryIcon(item.Category || 'strength')}
        </View>
      </View>

      {item.Description && (
        <Text style={styles.workoutDescription}>{item.Description}</Text>
      )}

      <View style={styles.workoutDetailsContainer}>
        {item.Equipment && (
          <View style={styles.workoutDetail}>
            <FontAwesome5
              name="toolbox"
              size={16}
              color="#053559"
              style={styles.detailIcon}
            />
            <Text style={styles.detailLabel}>Equipment:</Text>
            <Text style={styles.detailValue}>{item.Equipment}</Text>
          </View>
        )}

        {item.difficulty && (
          <View style={styles.workoutDetail}>
            <FontAwesome5
              name="signal"
              size={16}
              color="#053559"
              style={styles.detailIcon}
            />
            <Text style={styles.detailLabel}>Difficulty:</Text>
            <View style={styles.difficultyContainer}>
              {[1, 2, 3, 4, 5].map((level) => (
                <FontAwesome
                  key={level}
                  name="circle"
                  size={10}
                  color={level <= item.difficulty ? '#053559' : '#e0e0e0'}
                  style={{ marginRight: 3 }}
                />
              ))}
              <Text style={styles.difficultyLabel}>
                {getDifficultyLabel(item.difficulty)}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() =>
            navigation.navigate('TrackWorkout', {
              workout: item,
              category: item.Category,
              subCategory: item.name,
            })
          }
        >
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveWorkout(item)}
        >
          <FontAwesome name="trash" size={16} color="#fff" />
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getCategoryColor = (category) => {
    if (!category) return '#053559';

    switch (category.toLowerCase()) {
      case 'cardio':
        return '#FF6B6B';
      case 'strength':
        return '#4D96FF';
      case 'yoga':
        return '#6BCB77';
      case 'flexibility':
        return '#6BCB77';
      case 'hiit':
        return '#FFD93D';
      default:
        return '#053559';
    }
  };

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
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome name="chevron-left" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>My Workouts</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('Workouts')}
          >
            <FontAwesome name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#053559" />
          <Text style={styles.loadingText}>Loading your workouts...</Text>
        </View>
      ) : Object.keys(groupedWorkouts).length > 0 ? (
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {Object.keys(groupedWorkouts).map((category) => (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: getCategoryColor(category) },
                  ]}
                />
                <Text style={styles.categoryTitle}>{category}</Text>
                <Text style={styles.workoutCount}>
                  {groupedWorkouts[category].length} workout
                  {groupedWorkouts[category].length !== 1 ? 's' : ''}
                </Text>
              </View>

              <FlatList
                data={groupedWorkouts[category]}
                renderItem={renderWorkoutItem}
                keyExtractor={(item, index) => `${item.name}_${index}`}
                scrollEnabled={false}
              />
            </View>
          ))}

          {/* Motivation Quote */}
          <LinearGradient
            colors={['#053559', '#09355c']}
            style={styles.motivationCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.quoteContainer}>
              <Text style={styles.quoteText}>
                "The only bad workout is the one that didn't happen."
              </Text>
              <Text style={styles.quoteAuthor}>- KEANFIT</Text>
            </View>

            <View style={styles.logoWatermark}>
              <FontAwesome name="paw" size={60} color="rgba(255,255,255,0.2)" />
            </View>
          </LinearGradient>

          <Disclaimer />

          {/* Bottom Padding for NavBar */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      ) : (
        <View style={styles.emptyStateContainer}>
          <FontAwesome5 name="dumbbell" size={60} color="#e0e0e0" />
          <Text style={styles.noWorkoutsText}>No workouts saved yet</Text>
          <Text style={styles.noWorkoutsSubtext}>
            Add workouts to your collection to start tracking your fitness
            journey
          </Text>
          <TouchableOpacity style={styles.addWorkoutButton}>
            <Text style={styles.addWorkoutButtonText}>Add Workout</Text>
          </TouchableOpacity>
        </View>
      )}

      <NavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  heroSection: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 15,
    position: 'relative',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    zIndex: 10,
    overflow: 'hidden',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#053559',
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  workoutCount: {
    fontSize: 14,
    color: '#666',
  },
  workoutCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  workoutTitleSection: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#053559',
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  workoutDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  workoutDetailsContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
  },
  workoutDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  workoutDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 5,
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
  difficultyLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  startButton: {
    backgroundColor: '#053559',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  removeButton: {
    backgroundColor: '#FF6347',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 5,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noWorkoutsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  noWorkoutsSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  addWorkoutButton: {
    backgroundColor: '#053559',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  addWorkoutButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
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

export default MyWorkoutScreen;
