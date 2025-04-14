import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import {
  setupActivityListener,
  deleteActivity,
} from '../services/fetchUserActivities';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
    const tabs = [
      { name: 'Cardio', icon: 'running' },
      { name: 'Strength Training', icon: 'dumbbell' },
      { name: 'Yoga', icon: 'om' },
    ];

    return (
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={[styles.tab, activeTab === tab.name && styles.activeTab]}
            onPress={() => handleTabPress(tab.name)}
          >
            <FontAwesome5
              name={tab.icon}
              size={16}
              color={activeTab === tab.name ? '#053559' : '#777'}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.name && styles.activeTabText,
              ]}
            >
              {tab.name}
            </Text>
            {activeTab === tab.name && <View style={styles.activeIndicator} />}
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
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.timeFilterTab,
              activeTimeFilter === filter && styles.activeTimeFilterTab,
            ]}
            onPress={() => setActiveTimeFilter(filter)}
          >
            <Text
              style={[
                styles.timeFilterText,
                activeTimeFilter === filter && styles.activeTimeFilterText,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Delete activity handler
  const handleDeleteActivity = (category, activityId) => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => {
            deleteActivity(category, activityId)
              .then(() => {
                Alert.alert('Success', 'Activity deleted successfully.');
              })
              .catch((error) => {
                Alert.alert(
                  'Error',
                  'Failed to delete activity. Please try again.'
                );
                console.error('Delete error:', error);
              });
          },
          style: 'destructive',
        },
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
      const categoryToMatch =
        activeTab === 'Strength Training' ? 'Strength' : activeTab;
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

  // Get the appropriate icon for the category
  const getCategoryIcon = (category, subCategory) => {
    if (category === 'Cardio') {
      if (subCategory === 'Running') return 'running';
      if (subCategory === 'Cycling') return 'bicycle';
      if (subCategory === 'Swimming') return 'swimming';
      return 'heartbeat';
    } else if (category === 'Strength') {
      if (subCategory === 'Arms') return 'hand-rock';
      if (subCategory === 'Legs') return 'shoe-prints';
      if (subCategory === 'Core') return 'dumbbell';
      return 'dumbbell';
    } else if (category === 'Yoga') {
      return 'om';
    }
    return 'star';
  };

  // Activity card component
  const ActivityCard = ({
    category,
    entryId,
    entryDetails,
    showDeleteButton,
  }) => {
    const iconName = getCategoryIcon(category, entryDetails.subCategory);

    return (
      <View key={entryId} style={styles.entryCard}>
        <View style={styles.cardHeader}>
          <View style={styles.activityIconContainer}>
            <FontAwesome5 name={iconName} size={16} color="#fff" />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>
              {entryDetails.subCategory || category}
            </Text>
            <Text style={styles.entryDate}>
              {convertTimestampToDateString(entryDetails.date)}
            </Text>
          </View>
          {showDeleteButton && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteActivity(category, entryId)}
            >
              <FontAwesome name="trash" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardContent}>
          {/* Cardio */}
          {entryDetails.cardioDuration && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <FontAwesome5
                  name="clock"
                  size={14}
                  color="#053559"
                  style={styles.statIcon}
                />
                <Text style={styles.statText}>
                  <Text style={styles.statValue}>
                    {Math.floor(entryDetails.cardioDuration / 60)} min,{' '}
                    {Math.floor(entryDetails.cardioDuration % 60)} sec
                  </Text>
                </Text>
              </View>
              {entryDetails.distance && (
                <View style={styles.statItem}>
                  <FontAwesome5
                    name="route"
                    size={14}
                    color="#053559"
                    style={styles.statIcon}
                  />
                  <Text style={styles.statText}>
                    <Text style={styles.statValue}>
                      {entryDetails.distance} km
                    </Text>
                  </Text>
                </View>
              )}
              {entryDetails.calories && (
                <View style={styles.statItem}>
                  <FontAwesome5
                    name="fire"
                    size={14}
                    color="#053559"
                    style={styles.statIcon}
                  />
                  <Text style={styles.statText}>
                    <Text style={styles.statValue}>
                      {entryDetails.calories} cal
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Strength Training */}
          {entryDetails.reps && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <FontAwesome5
                  name="weight"
                  size={14}
                  color="#053559"
                  style={styles.statIcon}
                />
                <Text style={styles.statText}>
                  <Text style={styles.statValue}>
                    {entryDetails.weight} lbs
                  </Text>
                </Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome5
                  name="redo"
                  size={14}
                  color="#053559"
                  style={styles.statIcon}
                />
                <Text style={styles.statText}>
                  <Text style={styles.statValue}>{entryDetails.sets} sets</Text>
                </Text>
              </View>
              <View style={styles.statItem}>
                <FontAwesome5
                  name="sort-numeric-up"
                  size={14}
                  color="#053559"
                  style={styles.statIcon}
                />
                <Text style={styles.statText}>
                  <Text style={styles.statValue}>{entryDetails.reps} reps</Text>
                </Text>
              </View>
            </View>
          )}

          {/* Yoga */}
          {entryDetails.yogaDuration && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <FontAwesome5
                  name="clock"
                  size={14}
                  color="#053559"
                  style={styles.statIcon}
                />
                <Text style={styles.statText}>
                  <Text style={styles.statValue}>
                    {Math.floor(entryDetails.yogaDuration / 60)} min,{' '}
                    {Math.floor(entryDetails.yogaDuration % 60)} sec
                  </Text>
                </Text>
              </View>
              {entryDetails.poses && (
                <View style={styles.statItem}>
                  <FontAwesome5
                    name="child"
                    size={14}
                    color="#053559"
                    style={styles.statIcon}
                  />
                  <Text style={styles.statText}>
                    <Text style={styles.statValue}>
                      {entryDetails.poses} poses
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Steps */}
          {entryDetails.steps && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <FontAwesome5
                  name="shoe-prints"
                  size={14}
                  color="#053559"
                  style={styles.statIcon}
                />
                <Text style={styles.statText}>
                  <Text style={styles.statValue}>
                    {entryDetails.steps} steps
                  </Text>
                </Text>
              </View>
              {entryDetails.distance && (
                <View style={styles.statItem}>
                  <FontAwesome5
                    name="route"
                    size={14}
                    color="#053559"
                    style={styles.statIcon}
                  />
                  <Text style={styles.statText}>
                    <Text style={styles.statValue}>
                      {entryDetails.distance} km
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          )}

          {entryDetails.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{entryDetails.notes}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#053559"
        translucent={true}
      />

      {/* Header */}
      <LinearGradient
        colors={['#053559', '#09355c']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>My Activities</Text>

        <TouchableOpacity
          style={[styles.editButton, isDeleting && styles.activeEditButton]}
          onPress={toggleDeleteMode}
        >
          <FontAwesome
            name={isDeleting ? 'check' : 'edit'}
            size={16}
            color="#fff"
          />
          <Text style={styles.editButtonText}>
            {isDeleting ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Tabs */}
      <CategoryTabs />
      <TimeFilterTabs />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {Object.keys(filteredActivities).length > 0 ? (
          Object.entries(filteredActivities).map(([category, entries]) => (
            <View key={category} style={styles.categoryContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.categoryTitle}>{category}</Text>
                <Text style={styles.entriesCount}>
                  {Object.keys(entries).length} entries
                </Text>
              </View>

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
            <FontAwesome5 name="running" size={60} color="#e0e0e0" />
            <Text style={styles.noActivitiesText}>
              No {activeTab} activities recorded in the{' '}
              {activeTimeFilter.toLowerCase()}.
            </Text>
            <TouchableOpacity style={styles.addActivityButton}>
              <Text style={styles.addActivityButtonText}>Add Activity</Text>
            </TouchableOpacity>
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  activeEditButton: {
    backgroundColor: '#FFCB05',
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 5,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: 'rgba(5, 53, 89, 0.05)',
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    color: '#777',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#053559',
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#053559',
  },
  timeFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timeFilterTab: {
    marginHorizontal: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeTimeFilterTab: {
    backgroundColor: '#053559',
  },
  timeFilterText: {
    fontSize: 12,
    color: '#444',
    fontWeight: '500',
  },
  activeTimeFilterText: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  entriesCount: {
    fontSize: 14,
    color: '#777',
    fontWeight: '500',
  },
  entryCard: {
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  entryDate: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  activityIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#053559',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 15,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  statIcon: {
    marginRight: 5,
  },
  statText: {
    fontSize: 14,
    color: '#444',
  },
  statValue: {
    fontWeight: '600',
    color: '#333',
  },
  notesContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#053559',
    marginBottom: 2,
  },
  notesText: {
    fontSize: 14,
    color: '#444',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noActivitiesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  noActivitiesText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  addActivityButton: {
    backgroundColor: '#053559',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  addActivityButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default UserStats;
