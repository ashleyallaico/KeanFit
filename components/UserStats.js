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
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import {
  setupActivityListener,
  deleteActivity,
} from '../services/fetchUserActivities';
import NavBar from './NavBar';
import convertTimestampToDateString from '../utils/formatHelpers';
import { useNavigation } from '@react-navigation/native';

const UserStats = ({ navigation }) => {
  const [activities, setActivities] = useState({});
  const [activeTab, setActiveTab] = useState('Cardio'); // Default active tab
  const [activeTimeFilter, setActiveTimeFilter] = useState('Last 7 Days'); // Default time filter
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalDuration: 0,
    totalSteps: 0,
    avgWeight: 0,
  });

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
  // Set header options to hide the header title
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

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

  const calculateStats = (filteredActivitiesData) => {
    let totalWorkouts = 0;
    let totalDuration = 0;
    let totalSteps = 0;
    let totalWeight = 0;
    let weightCount = 0;

    Object.entries(filteredActivitiesData).forEach(([category, entries]) => {
      totalWorkouts += Object.keys(entries).length;

      Object.values(entries).forEach((entry) => {
        // Add duration from cardio activities
        if (entry.cardioDuration) {
          totalDuration += entry.cardioDuration;
        }

        // Add duration from yoga activities
        if (entry.yogaDuration) {
          totalDuration += entry.yogaDuration;
        }

        // Add steps from cardio activities
        if (entry.steps) {
          totalSteps += parseInt(entry.steps) || 0;
        }

        // Track weights for average calculation
        if (entry.weight) {
          totalWeight += parseFloat(entry.weight) || 0;
          weightCount++;
        }
      });
    });

    setStats({
      totalWorkouts,
      totalDuration,
      totalSteps,
      avgWeight: weightCount > 0 ? (totalWeight / weightCount).toFixed(1) : 0,
    });
  };

  useEffect(() => {
    const unsubscribe = setupActivityListener((data) => {
      console.log('Received activities data:', data); // Debug log
      setActivities(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Calculate filtered activities and update stats
  useEffect(() => {
    const filteredByTime = filterActivitiesByTime(activities);
    const filteredByTab = filterActivitiesByTab(filteredByTime);
    calculateStats(filteredByTab);
  }, [activities, activeTab, activeTimeFilter]);

  const handleTabPress = (tabName) => {
    setActiveTab(tabName);
    // Turn off delete mode when switching tabs
    setIsDeleting(false);
  };

  // Get icon for workout category
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Cardio':
        return { name: 'heartbeat', type: 'FontAwesome' };
      case 'Strength':
        return { name: 'dumbbell', type: 'FontAwesome5' };
      case 'Yoga':
        return { name: 'leaf', type: 'FontAwesome5' };
      default:
        return { name: 'calendar', type: 'FontAwesome' };
    }
  };

  // Category Tabs component
  const CategoryTabs = () => {
    const tabs = [
      { name: 'Cardio', icon: 'heartbeat' },
      { name: 'Strength Training', icon: 'dumbbell' },
      { name: 'Yoga', icon: 'leaf' },
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
              size={18}
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

  // Toggle delete mode
  const toggleDeleteMode = () => {
    setIsDeleting(!isDeleting);
  };

  // Summary Stats component
  const SummaryStats = () => {
    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {Math.floor(stats.totalDuration / 60)}
            </Text>
            <Text style={styles.statLabel}>Total Minutes</Text>
          </View>

          {activeTab === 'Cardio' && (
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.totalSteps}</Text>
              <Text style={styles.statLabel}>Total Steps</Text>
            </View>
          )}

          {activeTab === 'Strength Training' && (
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.avgWeight}</Text>
              <Text style={styles.statLabel}>Avg Weight (lbs)</Text>
            </View>
          )}

          {activeTab === 'Yoga' && (
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {(
                  stats.totalDuration /
                  (stats.totalWorkouts || 1) /
                  60
                ).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>Avg Session (min)</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Activity card component
  const ActivityCard = ({
    category,
    entryId,
    entryDetails,
    showDeleteButton,
  }) => {
    const icon = getCategoryIcon(category);
    const dateString = convertTimestampToDateString(entryDetails.date);

    return (
      <View key={entryId} style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View style={styles.entryIconContainer}>
            {icon.type === 'FontAwesome5' ? (
              <FontAwesome5 name={icon.name} size={16} color="#fff" />
            ) : (
              <FontAwesome name={icon.name} size={16} color="#fff" />
            )}
          </View>
          <View style={styles.entryTitleContainer}>
            <Text style={styles.entryTitle}>
              {entryDetails.subCategory || category}
            </Text>
            <Text style={styles.entryDate}>{dateString}</Text>
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

        <View style={styles.entryDetails}>
          {/* Cardio specifics */}
          {entryDetails.steps !== undefined && (
            <View style={styles.detailRow}>
              <FontAwesome5 name="shoe-prints" size={14} color="#053559" />
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Steps: </Text>
                {entryDetails.steps}
              </Text>
            </View>
          )}

          {entryDetails.cardioDuration !== undefined && (
            <View style={styles.detailRow}>
              <FontAwesome5 name="clock" size={14} color="#053559" />
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Duration: </Text>
                {Math.floor(entryDetails.cardioDuration / 60)} min,{' '}
                {Math.floor(entryDetails.cardioDuration % 60)} sec
              </Text>
            </View>
          )}

          {/* Strength specifics */}
          {entryDetails.weight !== undefined && (
            <View style={styles.detailRow}>
              <FontAwesome5 name="weight" size={14} color="#053559" />
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Weight: </Text>
                {entryDetails.weight} lbs
              </Text>
            </View>
          )}

          {entryDetails.reps !== undefined && (
            <View style={styles.detailRow}>
              <FontAwesome5 name="redo" size={14} color="#053559" />
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Reps: </Text>
                {entryDetails.reps}
              </Text>
            </View>
          )}

          {entryDetails.sets !== undefined && (
            <View style={styles.detailRow}>
              <FontAwesome5 name="layer-group" size={14} color="#053559" />
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Sets: </Text>
                {entryDetails.sets}
              </Text>
            </View>
          )}

          {/* Yoga specifics */}
          {entryDetails.yogaDuration !== undefined && (
            <View style={styles.detailRow}>
              <FontAwesome5 name="clock" size={14} color="#053559" />
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Duration: </Text>
                {Math.floor(entryDetails.yogaDuration / 60)} min,{' '}
                {Math.floor(entryDetails.yogaDuration % 60)} sec
              </Text>
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

      {/* Hero Section with Background */}
      <ImageBackground
        source={require('../assets/KeanBG.png')}
        style={styles.heroSection}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay}>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <FontAwesome name="chevron-left" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Activity History</Text>
              <Text style={styles.headerSubtitle}>
                Track your fitness progress
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      <CategoryTabs />
      <TimeFilterTabs />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#053559" />
          <Text style={styles.loadingText}>Loading your activities...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Stats Section */}
          <SummaryStats />

          {(() => {
            const filteredByTime = filterActivitiesByTime(activities);
            const filteredByTab = filterActivitiesByTab(filteredByTime);

            return Object.keys(filteredByTab).length > 0 ? (
              Object.entries(filteredByTab).map(([category, entries]) => (
                <View key={category} style={styles.categoryContainer}>
                  <Text style={styles.categoryTitle}>
                    {category === 'Strength' ? 'Strength Training' : category}
                  </Text>

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
                <FontAwesome5 name="clipboard-list" size={60} color="#aaa" />
                <Text style={styles.noActivitiesText}>
                  No {activeTab} activities recorded in the selected time range.
                </Text>
                <TouchableOpacity
                  style={styles.addWorkoutButton}
                  onPress={() => navigation.navigate('Workouts')}
                >
                  <Text style={styles.addWorkoutButtonText}>
                    Add New Workout
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })()}

          {/* Bottom Padding */}
          <View style={styles.bottomPadding} />
        </ScrollView>
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
    height: Platform.OS === 'ios' ? 150 : 140,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 53, 92, 0.65)',
    justifyContent: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 40,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    marginTop: 40,
    marginLeft: 50,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginLeft: 40,
  },
  scrollContainer: {
    paddingHorizontal: 15,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#777',
  },
  actionContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
  },
  actionIcon: {
    marginRight: 8,
  },
  activeActionButton: {
    backgroundColor: '#053559',
  },
  actionButtonText: {
    color: '#053559',
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    position: 'relative',
  },
  tabIcon: {
    marginRight: 8,
  },
  activeTab: {
    borderBottomColor: '#053559',
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
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timeFilterTab: {
    marginHorizontal: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeTimeFilterTab: {
    backgroundColor: '#053559',
  },
  timeFilterText: {
    color: '#777',
    fontWeight: '500',
    fontSize: 14,
  },
  activeTimeFilterText: {
    color: '#fff',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginTop: 15,
    marginBottom: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#053559',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  categoryContainer: {
    marginTop: 15,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginLeft: 5,
  },
  entryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  entryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#053559',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  entryTitleContainer: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#053559',
  },
  entryDate: {
    fontSize: 12,
    color: '#777',
  },
  entryDetails: {
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 15,
    color: '#444',
    marginLeft: 10,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#333',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  noActivitiesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  noActivitiesText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  addWorkoutButton: {
    backgroundColor: '#053559',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  addWorkoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomPadding: {
    height: 100,
  },
});

export default UserStats;
