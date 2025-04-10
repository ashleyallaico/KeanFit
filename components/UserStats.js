
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { setupActivityListener, deleteActivity } from '../services/fetchUserActivities';
import NavBar from './NavBar';
import convertTimestampToDateString from '../utils/formatHelpers';

const UserStats = () => {
  const [activities, setActivities] = useState({});
  const [activeTab, setActiveTab] = useState('Cardio'); // Default active tab
  const [activeTimeFilter, setActiveTimeFilter] = useState('Last 7 Days'); // Default time filter
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = setupActivityListener(setActivities);
    return () => unsubscribe();
  }, []);

  const handleTabPress = (tabName) => {
    setActiveTab(tabName);
    // Turn off delete mode when switching tabs
    setIsDeleting(false);
  };

  // Category Tabs component
  const CategoryTabs = () => {
    const tabs = ['Cardio', 'Strength Training', 'Yoga'];
    return (
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => handleTabPress(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Time Filter Tabs component
  const TimeFilterTabs = () => {
    const filters = ['Last 7 Days', 'Last Month', 'Last Year'];
    return (
      <View style={styles.timeFilterContainer}>
        {filters.map(filter => (
          <TouchableOpacity
            key={filter}
            style={[styles.timeFilterTab, activeTimeFilter === filter && styles.activeTimeFilterTab]}
            onPress={() => setActiveTimeFilter(filter)}
          >
            <Text style={[styles.timeFilterText, activeTimeFilter === filter && styles.activeTimeFilterText]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Delete activity handler remains the same
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
            deleteActivity(category, activityId)
              .then(() => {
                Alert.alert("Success", "Activity deleted successfully.");
              })
              .catch(error => {
                Alert.alert("Error", "Failed to delete activity. Please try again.");
                console.error("Delete error:", error);
              });
          },
          style: "destructive"
        }
      ]
    );
  };

  // Helper: Calculate the start date based on the active time filter
  const getFilterStartDate = () => {
    const today = new Date();
    const startDate = new Date();
    if (activeTimeFilter === 'Last 7 Days') {
      startDate.setDate(today.getDate() - 7);
    } else if (activeTimeFilter === 'Last Month') {
      startDate.setMonth(today.getMonth() - 1);
    } else if (activeTimeFilter === 'Last Year') {
      startDate.setFullYear(today.getFullYear() - 1);
    }
    return startDate;
  };

  // Filter activities by the selected time range
  const filterActivitiesByTime = (activitiesObj) => {
    const startDate = getFilterStartDate();
    const filtered = {};
    Object.entries(activitiesObj).forEach(([category, entries]) => {
      const filteredEntries = {};
      Object.entries(entries).forEach(([entryId, entryDetails]) => {
        // Convert the stored date string to a Date object.
        const entryDate = new Date(entryDetails.date);
        if (entryDate >= startDate) {
          filteredEntries[entryId] = entryDetails;
        }
      });
      if (Object.keys(filteredEntries).length > 0) {
        filtered[category] = filteredEntries;
      }
    });
    return filtered;
  };

  // Filter activities by category (active tab)
  const filterActivitiesByTab = (activitiesObj) => {
    const result = {};
    Object.entries(activitiesObj).forEach(([category, entries]) => {
      // For the "Strength Training" tab, the data is under "Strength"
      const categoryToMatch = activeTab === 'Strength Training' ? 'Strength' : activeTab;
      if (category === categoryToMatch) {
        result[category] = entries;
      }
    });
    return result;
  };

  // Combine filters: apply the time filter first, then the category filter
  const filteredActivitiesByTime = filterActivitiesByTime(activities);
  const filteredActivities = filterActivitiesByTab(filteredActivitiesByTime);

  // Toggle delete mode
  const toggleDeleteMode = () => {
    setIsDeleting(!isDeleting);
  };

  // Activity card component
  const ActivityCard = ({ category, entryId, entryDetails, showDeleteButton }) => (
    <View key={entryId} style={styles.entryCard}>
      <Text style={styles.entryText}>
        {entryDetails.steps ? <Text><Text style={styles.labelText}>Steps: </Text>{entryDetails.steps}{'\n'}</Text> : ''}
        {entryDetails.reps ? (
          <>
            <Text><Text style={styles.labelText}>Sub-category: </Text>{entryDetails.subCategory}{'\n'}</Text>
            <Text><Text style={styles.labelText}>Weight: </Text>{entryDetails.weight} lbs{'\n'}</Text>
            <Text><Text style={styles.labelText}>Repetitions: </Text>{entryDetails.reps}{'\n'}</Text>
            <Text><Text style={styles.labelText}>Sets: </Text>{entryDetails.sets}</Text>
          </>
        ) : ''}
        {entryDetails.cardioDuration ? (
          <Text>
            <Text><Text style={styles.labelText}>Sub-category: </Text>{entryDetails.subCategory}{'\n'}</Text>
            <Text style={styles.labelText}>Duration: </Text>
            {Math.floor(entryDetails.cardioDuration / 60)} min, {Math.floor(entryDetails.cardioDuration % 60)} secs
          </Text>
        ) : ''}
        {entryDetails.yogaDuration ? (
          <Text>
            <Text><Text style={styles.labelText}>Sub-category: </Text>{entryDetails.subCategory}{'\n'}</Text>
            <Text style={styles.labelText}>Duration: </Text>
            {Math.floor(entryDetails.yogaDuration / 60)} min, {Math.floor(entryDetails.yogaDuration % 60)} secs
          </Text>
        ) : ''}
      </Text>
  
      <Text style={styles.entryDate}>{convertTimestampToDateString(entryDetails.date)}</Text>
  
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
      <TimeFilterTabs />
      
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
        {Object.keys(filteredActivities).length > 0 ? (
          Object.entries(filteredActivities).map(([category, entries]) => (
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
          ))
        ) : (
          <View style={styles.noActivitiesContainer}>
            <Text style={styles.noActivitiesText}>
              No {activeTab} activities recorded in the selected time range.
            </Text>
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
  timeFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
  },
  timeFilterTab: {
    marginHorizontal: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  activeTimeFilterTab: {
    backgroundColor: '#09355c',
  },
  timeFilterText: {
    color: '#444',
    fontWeight: '500',
  },
  activeTimeFilterText: {
    color: '#fff',
  },
  labelText: {
    fontWeight: 'bold',
    color: '#09355c',
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
    paddingRight: 50,
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
