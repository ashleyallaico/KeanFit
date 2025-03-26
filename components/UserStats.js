import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { setupActivityListener, deleteActivity } from '../services/fetchUserActivities';
import NavBar from './NavBar';

const UserStats = () => {
  const [activities, setActivities] = useState({});
  const [activeTab, setActiveTab] = useState('Cardio'); // Default active tab
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = setupActivityListener(setActivities);
    return () => unsubscribe();
  }, []);

  const getCurrentDate = () => {
    return new Date().toLocaleDateString();
  };

  const handleTabPress = (tabName) => {
    setActiveTab(tabName);
    // Turn off delete mode when switching tabs
    setIsDeleting(false);
  };

  // Tab navigation component
  const CategoryTabs = () => {
    const tabs = ['Cardio', 'Strength Training', 'Yoga'];
    
    return (
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab
            ]}
            onPress={() => handleTabPress(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Handle delete activity
  const handleDeleteActivity = (category, activityId) => {
    Alert.alert(
      "Delete Activity",
      "Are you sure you want to delete this activity? This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          onPress: () => {
            // Call the delete function (implement this in fetchUserActivities.js)
            deleteActivity(category, activityId)
              .then(() => {
                // Success message
                Alert.alert("Success", "Activity deleted successfully.");
              })
              .catch(error => {
                // Error message
                Alert.alert("Error", "Failed to delete activity. Please try again.");
                console.error("Delete error:", error);
              });
          },
          style: "destructive"
        }
      ]
    );
  };

  const todayDate = getCurrentDate();
  const todayActivities = {};
  const pastActivities = {};

  const todaySummary = {
    Cardio: { totalSteps: 0, totalDuration: 0 },
    Strength: { totalReps: 0, totalWeight: 0, totalSets: 0 },
    Yoga: { totalDuration: 0 },
  };

  Object.entries(activities).forEach(([category, entries]) => {
    Object.entries(entries).forEach(([entryId, entryDetails]) => {
      if (entryDetails.date === todayDate) {
        if (!todayActivities[category]) todayActivities[category] = {};
        todayActivities[category][entryId] = entryDetails;

        if (category === 'Cardio') {
          todaySummary.Cardio.totalSteps += Number(entryDetails.steps) || 0;
          todaySummary.Cardio.totalDuration += Number(entryDetails.cardioDuration) || 0;
        } else if (category === 'Yoga') {
          todaySummary.Yoga.totalDuration += Number(entryDetails.yogaDuration) || 0;
        }
      } else {
        if (!pastActivities[category]) pastActivities[category] = {};
        pastActivities[category][entryId] = entryDetails;
      }
    });
  });

  // Filter activities based on the active tab
  const filterActivitiesByTab = (activitiesObj) => {
    const result = {};
    
    Object.entries(activitiesObj).forEach(([category, entries]) => {
      // For "Strength Training" tab, we need to match with "Strength" from your data
      const categoryToMatch = activeTab === 'Strength Training' ? 'Strength' : activeTab;
      
      if (category === categoryToMatch) {
        result[category] = entries;
      }
    });
    
    return result;
  };

  const filteredTodayActivities = filterActivitiesByTab(todayActivities);
  const filteredPastActivities = filterActivitiesByTab(pastActivities);

  // Toggle delete mode
  const toggleDeleteMode = () => {
    setIsDeleting(!isDeleting);
  };

  const ActivityCard = ({ category, entryId, entryDetails, showDeleteButton }) => (
    <View key={entryId} style={styles.entryCard}>
      <Text style={styles.entryText}>
        {entryDetails.steps ? <Text><Text style={styles.labelText}>Steps: </Text>{entryDetails.steps}{'\n'}</Text> : ''}
        {entryDetails.reps ? (
          <>
            <Text><Text style={styles.labelText}>Weight: </Text>{entryDetails.weight} lbs{'\n'}</Text>
            <Text><Text style={styles.labelText}>Repetitions: </Text>{entryDetails.reps}{'\n'}</Text>
            <Text><Text style={styles.labelText}>Sets: </Text>{entryDetails.sets}</Text>
          </>
        ) : ''}
        {entryDetails.cardioDuration ? <Text><Text style={styles.labelText}>Duration: </Text>{Math.floor(entryDetails.cardioDuration / 60)} min</Text> : ''}
        {entryDetails.yogaDuration ? <Text><Text style={styles.labelText}>Duration: </Text>{Math.floor(entryDetails.yogaDuration / 60)} min</Text> : ''}
      </Text>
  
      {/* Date positioned to the bottom right */}
      <Text style={styles.entryDate}>{entryDetails.date}</Text>
  
      {/* Delete button */}
      {showDeleteButton && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteActivity(category, entryId)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <CategoryTabs />
      
      {/* Delete mode toggle button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, isDeleting && styles.activeActionButton]}
          onPress={toggleDeleteMode}
        >
          <Text style={[styles.actionButtonText, isDeleting && styles.activeActionButtonText]}>
            {isDeleting ? 'Done' : 'Edit Activities'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Today's Exercises */}
        {Object.keys(filteredTodayActivities).length > 0 && (
          <View style={styles.todayContainer}>
            <Text style={styles.todayTitle}>Today's Exercises</Text>
            {Object.entries(filteredTodayActivities).map(([category, entries]) => (
              <View key={category} style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>{category}</Text>

                {Object.entries(entries).map(([entryId, entryDetails]) => (
                  <ActivityCard
                    key={entryId}
                    category={category}
                    entryId={entryId}
                    entryDetails={entryDetails}
                    showDeleteButton={isDeleting}
                  />
                ))}

                {/* Display Today total at the bottom of each category
                {category === 'Cardio' && todaySummary.Cardio.totalSteps > 0 && (
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryText}>
                      Total: Walked {todaySummary.Cardio.totalSteps} steps in {Math.floor(todaySummary.Cardio.totalDuration / 60)} min {todaySummary.Cardio.totalDuration % 60} sec
                    </Text>
                  </View>
                )}*/}

                {/*{category === 'Yoga' && todaySummary.Yoga.totalDuration > 0 && (
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryText}>
                      Total: Practiced for {Math.floor(todaySummary.Yoga.totalDuration / 60)} min {todaySummary.Yoga.totalDuration % 60} sec
                    </Text>
                  </View>
                )} */}
              </View>
            ))}
          </View>
        )}

        {/* Past Exercises */}
        {Object.keys(filteredPastActivities).length > 0 && (
          <View style={styles.pastContainer}>
            <Text style={styles.pastTitle}>Previous Exercises</Text>

            {Object.entries(filteredPastActivities).map(([category, entries]) => (
              <View key={category} style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>{category}</Text>

                {Object.entries(entries).map(([entryId, entryDetails]) => (
                  <ActivityCard
                    key={entryId}
                    category={category}
                    entryId={entryId}
                    entryDetails={entryDetails}
                    showDeleteButton={isDeleting}
                  />
                ))}
              </View>
            ))}
          </View>
        )}
        
        {/* No Activities Message */}
        {Object.keys(filteredTodayActivities).length === 0 && Object.keys(filteredPastActivities).length === 0 && (
          <View style={styles.noActivitiesContainer}>
            <Text style={styles.noActivitiesText}>No {activeTab} activities recorded yet.</Text>
          </View>
        )}
      </ScrollView>

      <NavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 70,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    paddingBottom: 80,
    paddingHorizontal: 15,
  },
  actionContainer: {
    padding: 15,
    backgroundColor: '#ffffff',
    alignItems: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  activeActionButton: {
    backgroundColor: '#09355c',
  },
  actionButtonText: {
    color: '#444',
    fontWeight: '500',
  },
  activeActionButtonText: {
    color: '#ffffff',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    position: 'relative',
  },
  activeTab: {
    borderBottomColor: '#09355c',
  },
  tabText: {
    fontSize: 18,
    color: '#777',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#09355c',
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#09355c',
  },
  labelText: {
    fontWeight: 'bold',
    color: '#09355c', // Using your app's main color for consistency
  },
  todayContainer: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 10,
  },
  todayTitle: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#09355c',
    marginBottom: 10,
  },
  pastContainer: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 10,
  },
  pastTitle: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#09355c',
    marginBottom: 10,
  },
  summaryCard: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#b3e5fc',
    borderRadius: 8,
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#09355c',
  },
  entryCard: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    position: 'relative',
  },
  entryText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    paddingRight: 50, // Make room for delete button
  },
  entryDate: {
    fontSize: 12,
    color: '#777',
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ff3b30',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#09355c',
    marginBottom: 10,
  },
  noActivitiesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  noActivitiesText: {
    fontSize: 18,
    color: '#777',
    textAlign: 'center',
  },
});

export default UserStats;