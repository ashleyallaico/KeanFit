import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ImageBackground,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  setupActivityListener,
  deleteActivity,
} from '../services/fetchUserActivities';
import NavBar from './NavBar';
import convertTimestampToDateString from '../utils/formatHelpers';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const UserStats = () => {
  const [activities, setActivities] = useState({});
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Cardio'); // Default active tab
  const [activeTimeFilter, setActiveTimeFilter] = useState('Last 7 Days'); // Default time filter
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = setupActivityListener((activitiesData) => {
      setActivities(activitiesData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  });

  const handleTabPress = (tabName) => {
    setActiveTab(tabName);
    // Turn off delete mode when switching tabs
    setIsDeleting(false);
  };

  // Category Tabs component with updated styling
  const CategoryTabs = () => {
    const tabs = ['Cardio', 'Strength Training', 'Yoga'];
    return (
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => handleTabPress(tab)}
          >
            <View style={styles.tabContent}>
              {getTabIcon(tab)}
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </View>
            {activeTab === tab && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Get appropriate icon for each tab
  const getTabIcon = (tab) => {
    switch (tab) {
      case 'Cardio':
        return (
          <FontAwesome5
            name="running"
            size={18}
            color={activeTab === tab ? '#09355c' : '#777'}
            style={styles.tabIcon}
          />
        );
      case 'Strength Training':
        return (
          <FontAwesome5
            name="dumbbell"
            size={18}
            color={activeTab === tab ? '#09355c' : '#777'}
            style={styles.tabIcon}
          />
        );
      case 'Yoga':
        return (
          <FontAwesome5
            name="spa"
            size={18}
            color={activeTab === tab ? '#09355c' : '#777'}
            style={styles.tabIcon}
          />
        );
      default:
        return null;
    }
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

  // Delete activity handler remains the same
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

  // Get color based on category
  const getCategoryColor = (category) => {
    if (!category) return '#09355c';

    switch (category) {
      case 'Cardio':
        return '#FF6B6B';
      case 'Strength':
        return '#4D96FF';
      case 'Yoga':
        return '#6BCB77';
      default:
        return '#09355c';
    }
  };

  // Get icon based on sub-category
  const getSubCategoryIcon = (category, subCategory) => {
    if (category === 'Cardio') {
      switch (subCategory?.toLowerCase()) {
        case 'running':
          return <FontAwesome5 name="running" size={16} color="#FF6B6B" />;
        case 'cycling':
          return <FontAwesome5 name="biking" size={16} color="#FF6B6B" />;
        case 'swimming':
          return <FontAwesome5 name="swimmer" size={16} color="#FF6B6B" />;
        default:
          return <FontAwesome5 name="heartbeat" size={16} color="#FF6B6B" />;
      }
    } else if (category === 'Strength') {
      switch (subCategory?.toLowerCase()) {
        case 'arms':
          return <FontAwesome5 name="hand-rock" size={16} color="#4D96FF" />;
        case 'legs':
          return <FontAwesome5 name="shoe-prints" size={16} color="#4D96FF" />;
        case 'chest':
          return <FontAwesome5 name="user" size={16} color="#4D96FF" />;
        case 'back':
          return <FontAwesome5 name="user" size={16} color="#4D96FF" />;
        default:
          return <FontAwesome5 name="dumbbell" size={16} color="#4D96FF" />;
      }
    } else if (category === 'Yoga') {
      return <FontAwesome5 name="spa" size={16} color="#6BCB77" />;
    }
    return <FontAwesome5 name="dot-circle" size={16} color="#09355c" />;
  };

  // Activity card component with updated styling
  const ActivityCard = ({
    category,
    entryId,
    entryDetails,
    showDeleteButton,
  }) => (
    <View key={entryId} style={styles.entryCard}>
      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'rgba(249,249,249,0.9)']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.subCategoryContainer}>
            {getSubCategoryIcon(category, entryDetails.subCategory)}
            {entryDetails.subCategory && (
              <Text style={styles.subCategoryText}>
                {entryDetails.subCategory}
              </Text>
            )}
          </View>

          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: getCategoryColor(category) },
            ]}
          >
            <Text style={styles.categoryBadgeText}>{category}</Text>
          </View>
        </View>

        <View style={styles.entryDetailsContainer}>
          {entryDetails.steps && (
            <View style={styles.detailRow}>
              <FontAwesome5
                name="shoe-prints"
                size={14}
                color="#09355c"
                style={styles.detailIcon}
              />
              <Text style={styles.detailLabel}>Steps:</Text>
              <Text style={styles.detailValue}>{entryDetails.steps}</Text>
            </View>
          )}

          {entryDetails.weight && (
            <View style={styles.detailRow}>
              <FontAwesome5
                name="weight"
                size={14}
                color="#09355c"
                style={styles.detailIcon}
              />
              <Text style={styles.detailLabel}>Weight:</Text>
              <Text style={styles.detailValue}>{entryDetails.weight} lbs</Text>
            </View>
          )}

          {entryDetails.reps && (
            <View style={styles.detailRow}>
              <FontAwesome5
                name="redo"
                size={14}
                color="#09355c"
                style={styles.detailIcon}
              />
              <Text style={styles.detailLabel}>Repetitions:</Text>
              <Text style={styles.detailValue}>{entryDetails.reps}</Text>
            </View>
          )}

          {entryDetails.sets && (
            <View style={styles.detailRow}>
              <FontAwesome5
                name="layer-group"
                size={14}
                color="#09355c"
                style={styles.detailIcon}
              />
              <Text style={styles.detailLabel}>Sets:</Text>
              <Text style={styles.detailValue}>{entryDetails.sets}</Text>
            </View>
          )}

          {entryDetails.cardioDuration && (
            <View style={styles.detailRow}>
              <FontAwesome5
                name="clock"
                size={14}
                color="#09355c"
                style={styles.detailIcon}
              />
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>
                {Math.floor(entryDetails.cardioDuration / 60)} min,{' '}
                {Math.floor(entryDetails.cardioDuration % 60)} secs
              </Text>
            </View>
          )}

          {entryDetails.yogaDuration && (
            <View style={styles.detailRow}>
              <FontAwesome5
                name="clock"
                size={14}
                color="#09355c"
                style={styles.detailIcon}
              />
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>
                {Math.floor(entryDetails.yogaDuration / 60)} min,{' '}
                {Math.floor(entryDetails.yogaDuration % 60)} secs
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.dateContainer}>
            <FontAwesome5
              name="calendar-alt"
              size={12}
              color="#777"
              style={styles.dateIcon}
            />
            <Text style={styles.entryDate}>
              {convertTimestampToDateString(entryDetails.date)}
            </Text>
          </View>

          {showDeleteButton && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteActivity(category, entryId)}
            >
              <FontAwesome name="trash" size={14} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#09355c"
        translucent={true}
      />

      {/* Header Section */}
      <ImageBackground
        source={require('../assets/KeanBG.png')}
        style={styles.heroSection}
        resizeMode="cover"
      >
        <View style={styles.headerContainer}>
          <Text style={styles.screenTitle}>Activity Stats</Text>
          <TouchableOpacity style={styles.filterButton}>
            <FontAwesome name="sliders" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      <CategoryTabs />
      <TimeFilterTabs />

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, isDeleting && styles.activeActionButton]}
          onPress={toggleDeleteMode}
        >
          <FontAwesome
            name={isDeleting ? 'check' : 'edit'}
            size={16}
            color={isDeleting ? '#fff' : '#444'}
            style={styles.actionIcon}
          />
          <Text
            style={[
              styles.actionButtonText,
              isDeleting && styles.activeActionButtonText,
            ]}
          >
            {isDeleting ? 'Done' : 'Edit Activities'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#09355c" />
          <Text style={styles.loadingText}>Loading your activities...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {Object.keys(filteredActivities).length > 0 ? (
            Object.entries(filteredActivities).map(([category, entries]) => (
              <View key={category} style={styles.categoryContainer}>
                <View style={styles.categoryHeader}>
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: getCategoryColor(category) },
                    ]}
                  />
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <Text style={styles.activityCount}>
                    {Object.keys(entries).length}{' '}
                    {Object.keys(entries).length === 1
                      ? 'activity'
                      : 'activities'}
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
              <FontAwesome5
                name={
                  activeTab === 'Cardio'
                    ? 'running'
                    : activeTab === 'Strength Training'
                    ? 'dumbbell'
                    : 'spa'
                }
                size={60}
                color="#e0e0e0"
              />
              <Text style={styles.noActivitiesText}>
                No {activeTab} activities recorded
              </Text>
              <Text style={styles.noActivitiesSubtext}>
                in the selected time range.
              </Text>
              <TouchableOpacity style={styles.addActivityButton}>
                <FontAwesome
                  name="plus"
                  size={16}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.addActivityButtonText}>Add Activity</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Motivation Card */}
          {Object.keys(filteredActivities).length > 0 && (
            <LinearGradient
              colors={['#09355c', '#09355c']}
              style={styles.motivationCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.quoteContainer}>
                <Text style={styles.quoteText}>
                  "Track your progress, celebrate your victories, no matter how
                  small."
                </Text>
                <Text style={styles.quoteAuthor}>- KEANFIT</Text>
              </View>

              <View style={styles.logoWatermark}>
                <FontAwesome
                  name="paw"
                  size={60}
                  color="rgba(255,255,255,0.2)"
                />
              </View>
            </LinearGradient>
          )}

          {/* Bottom Padding for NavBar */}
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
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    position: 'relative',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    marginRight: 8,
  },
  activeTab: {
    borderBottomColor: '#09355c',
  },
  tabText: {
    fontSize: 14,
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
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#efefef',
  },
  timeFilterTab: {
    marginHorizontal: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  activeTimeFilterTab: {
    backgroundColor: '#09355c',
  },
  timeFilterText: {
    color: '#444',
    fontWeight: '500',
    fontSize: 12,
  },
  activeTimeFilterText: {
    color: '#fff',
  },
  actionContainer: {
    padding: 15,
    backgroundColor: '#ffffff',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#efefef',
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 5,
  },
  activeActionButton: {
    backgroundColor: '#09355c',
  },
  actionButtonText: {
    color: '#444',
    fontWeight: '500',
    fontSize: 13,
  },
  activeActionButtonText: {
    color: '#ffffff',
  },
  scrollContainer: {
    paddingBottom: 80,
    paddingHorizontal: 15,
    paddingTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#09355c',
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 5,
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
  activityCount: {
    fontSize: 14,
    color: '#666',
  },
  entryCard: {
    marginBottom: 15,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardGradient: {
    padding: 18,
    borderRadius: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subCategoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  entryDetailsContainer: {
    backgroundColor: 'rgba(249, 249, 249, 0.7)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  detailIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#09355c',
    marginRight: 5,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 5,
  },
  entryDate: {
    fontSize: 12,
    color: '#777',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 5,
  },
  noActivitiesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  noActivitiesText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 5,
  },
  noActivitiesSubtext: {
    fontSize: 16,
    color: '#777',
    marginBottom: 25,
  },
  addActivityButton: {
    backgroundColor: '#09355c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addActivityButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  motivationCard: {
    borderRadius: 18,
    padding: 25,
    marginVertical: 20,
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
    color: '#FFCB05',
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

export default UserStats;
