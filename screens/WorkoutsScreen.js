import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import NavBar from '../components/NavBar';
import WorkoutRecommendations from '../components/WorkoutRecommendations';

export default function WorkoutsScreen() {
  const [workoutSections, setWorkoutSections] = useState({
    Cardio: [],
    'Strength Training': [],
    Yoga: [],
  });
  const [activeSection, setActiveSection] = useState('Cardio');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const [userWorkouts, setUserWorkouts] = useState([]);

  useEffect(() => {
    const db = getDatabase();
    const workoutsRef = ref(db, 'Workouts');

    onValue(workoutsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const sections = {
          Cardio: [],
          'Strength Training': [],
          Yoga: [],
        };

        // Process the data to match our structure
        Object.keys(data).forEach((sectionKey) => {
          const sectionData = data[sectionKey];
          let sectionName;
          if (sectionKey.toLowerCase() === 'cardio') {
            sectionName = 'Cardio';
          } else if (
            sectionKey.toLowerCase() === 'strength training' ||
            sectionKey.toLowerCase() === 'strengthtraining'
          ) {
            sectionName = 'Strength Training';
          } else if (sectionKey.toLowerCase() === 'yoga') {
            sectionName = 'Yoga';
          } else {
            return;
          }
          Object.keys(sectionData).forEach((workoutKey) => {
            const workout = sectionData[workoutKey];
            sections[sectionName].push({
              name: workoutKey,
              Category: sectionName,
              Description:
                workout.Description ||
                workout.description ||
                'No description available',
              Equipment:
                workout.Equipment || workout.equipment || 'None required',
              difficulty: workout.difficulty || 1,
            });
          });
        });
        setWorkoutSections(sections);
      }
    });
  }, []);

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
      alert("Failed to add workout:", error);
    }
  };

  const renderWorkoutCard = ({ item }) => {
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

        <Text style={styles.workoutDescription}>{item.Description}</Text>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.workoutDetail}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{item.Category}</Text>
            </View>

            <View style={styles.workoutDetail}>
              <Text style={styles.detailLabel}>Equipment:</Text>
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

  const renderSectionTabs = () => {
    return (
      <View style={styles.tabsContainer}>
        {Object.keys(workoutSections).map((section) => (
          <TouchableOpacity
            key={section}
            style={[styles.tab, activeSection === section && styles.activeTab]}
            onPress={() => setActiveSection(section)}
          >
            <Text style={[styles.tabText, activeSection === section && styles.activeTabText]}>
              {section}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // New: Render header component for the FlatList
  const renderHeader = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>View Workouts</Text>
        <Text style={styles.headerSubtitle}>
          Find the perfect workout for you
        </Text>
      </View>

      {/* Recommendation Card */}
      <TouchableOpacity
        style={styles.recommendationCard}
        onPress={() => setShowRecommendations(!showRecommendations)}
      >
        <View style={styles.recommendationContent}>
          <FontAwesome name="star" size={24} color="#FFD700" />
          <View style={styles.recommendationTextContainer}>
            <Text style={styles.recommendationTitle}>Personalized Recommendations</Text>
            <Text style={styles.recommendationSubtitle}>
              Workouts tailored to your preferences
            </Text>
          </View>
        </View>
        <FontAwesome
          name={showRecommendations ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#09355c"
        />
      </TouchableOpacity>

      {/* Recommendations Section */}
      {showRecommendations && (
        <View style={styles.recommendationsContainer}>
          <WorkoutRecommendations />
        </View>
      )}

      {/* Workout Categories */}
      {renderSectionTabs()}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={workoutSections[activeSection]}
        renderItem={renderWorkoutCard}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.workoutList}
        showsVerticalScrollIndicator={false}
      />
      <NavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#09355c',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
  },
  recommendationCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  recommendationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationTextContainer: {
    marginLeft: 15,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#09355c',
  },
  recommendationSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  recommendationsContainer: {
    marginTop: 10,
    marginHorizontal: 15,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  activeTab: {
    borderBottomColor: '#09355c',
  },
  tabText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#09355c',
  },
  workoutList: {
    paddingHorizontal: 15,
    paddingBottom: 80,
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
