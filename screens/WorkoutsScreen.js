import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Image,
  ScrollView,
  Dimensions,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../services/firebaseConfig';
import NavBar from '../components/NavBar';

const { width, height } = Dimensions.get('window');
const cardWidth = width * 0.42;

export default function WorkoutsScreen() {
  // State variables remain the same...
  const [workoutSections, setWorkoutSections] = useState({
    Cardio: [],
    'Strength Training': [],
    Yoga: [],
  });
  const navigation = useNavigation();
  const [activeSection, setActiveSection] = useState('All');
  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const [userWorkouts, setUserWorkouts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [popularWorkouts, setPopularWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = new Animated.Value(0);
  const [quickFilters, setQuickFilters] = useState([
    { name: 'All', active: true, icon: 'grid' },
    { name: 'Cardio', active: false, icon: 'run' },
    { name: 'Strength', active: false, icon: 'dumbbell' },
    { name: 'Yoga', active: false, icon: 'yoga' },
    { name: 'Quick', active: false, icon: 'timer-sand' },
    { name: 'No Equip', active: false, icon: 'home' },
  ]);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [160, 80],
    extrapolate: 'clamp',
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [80, 120],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerSubtitleOpacity = scrollY.interpolate({
    inputRange: [40, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const fetchWorkouts = async () => {
      // Existing fetch logic...
      setIsLoading(true);
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
          let allWorkouts = [];

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
              const formattedWorkout = {
                id: `${sectionName}-${workoutKey}`,
                name: workoutKey,
                Category: sectionName,
                Description:
                  workout.Description ||
                  workout.description ||
                  'No description available',
                Equipment:
                  workout.Equipment || workout.equipment || 'None required',
                difficulty:
                  workout.difficulty || Math.floor(Math.random() * 5) + 1,
                duration:
                  workout.duration || Math.floor(Math.random() * 45) + 10,
                calories:
                  workout.calories || Math.floor(Math.random() * 300) + 100,
                imageUrl: getWorkoutImage(sectionName, workoutKey),
                favorite: Math.random() > 0.7,
              };
              sections[sectionName].push(formattedWorkout);
              allWorkouts.push(formattedWorkout);
            });
          });

          setWorkoutSections(sections);
          setFilteredWorkouts(allWorkouts);

          // Set some random workouts as popular but prioritize higher difficulty ones
          const prioritized = [...allWorkouts].sort((a, b) => {
            // Prioritize higher difficulty and shorter workouts for variety
            return (
              b.difficulty * 0.6 +
              (45 - b.duration) * 0.4 -
              (a.difficulty * 0.6 + (45 - a.duration) * 0.4)
            );
          });
          setPopularWorkouts(prioritized.slice(0, 5));

          // Fetch user workouts
          fetchUserWorkouts();
          setIsLoading(false);
          setRefreshing(false);
        }
      });
    };

    fetchWorkouts();
  }, []);

  useEffect(() => {
    handleFilterChange(activeSection);
  }, [workoutSections, activeSection, searchQuery]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  });

  const fetchUserWorkouts = () => {
    const user = auth.currentUser;
    if (!user) return;

    const db = getDatabase();
    const userWorkoutsRef = ref(db, `Users/${user.uid}/MyWorkout`);

    onValue(userWorkoutsRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserWorkouts(snapshot.val() || []);
      } else {
        setUserWorkouts([]);
      }
    });
  };

  // Image selection logic based on workout category and name
  const getWorkoutImage = (category, name) => {
    // Placeholder logic to assign images
    if (category === 'Cardio') {
      if (name.toLowerCase().includes('run'))
        return require('../assets/workout-cardio-running.png');
      if (name.toLowerCase().includes('swim'))
        return require('../assets/workout-cardio-swimming.png');
      return require('../assets/workout-cardio-default.png');
    } else if (category === 'Strength Training') {
      if (name.toLowerCase().includes('chest'))
        return require('../assets/workout-strength-chest.png');
      if (name.toLowerCase().includes('leg'))
        return require('../assets/workout-strength-legs.png');
      return require('../assets/workout-strength-default.png');
    } else {
      return require('../assets/workout-yoga-default.png');
    }
  };

  const handleAddWorkout = async (workout) => {
    const user = auth.currentUser;
    if (!user) {
      showToast('Please sign in to add workouts');
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
        showToast(`Added ${workout.name} to your workouts!`);
      } else {
        showToast(`${workout.name} is already in your workouts`);
      }
    } catch (error) {
      showToast('Failed to add workout');
      console.error(error);
    }
  };

  // Show a toast message (this would need a toast component in a real app)
  const showToast = (message) => {
    // In a real implementation, you'd use a toast library or component
    alert(message);
  };

  const handleFilterChange = (filterName) => {
    const updatedFilters = quickFilters.map((filter) => ({
      ...filter,
      active: filter.name === filterName,
    }));
    setQuickFilters(updatedFilters);
    setActiveSection(filterName);

    let filtered = [];
    const allWorkouts = [
      ...workoutSections.Cardio,
      ...workoutSections['Strength Training'],
      ...workoutSections.Yoga,
    ];

    if (filterName === 'All') {
      filtered = allWorkouts;
    } else if (filterName === 'Quick (< 15 min)') {
      filtered = allWorkouts.filter((workout) => workout.duration < 15);
    } else if (filterName === 'No Equipment') {
      filtered = allWorkouts.filter(
        (workout) =>
          workout.Equipment === 'None required' ||
          workout.Equipment === 'None' ||
          workout.Equipment.toLowerCase().includes('no equipment')
      );
    } else {
      filtered = allWorkouts.filter(
        (workout) => workout.Category === filterName
      );
    }

    // Apply search query if any
    if (searchQuery) {
      filtered = filtered.filter(
        (workout) =>
          workout.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          workout.Description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredWorkouts(filtered);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Refresh logic would go here - currently we're just resetting the state
    // which will trigger the useEffects
    setActiveSection('All');
    setSearchQuery('');
    setQuickFilters(
      quickFilters.map((filter) => ({
        ...filter,
        active: filter.name === 'All',
      }))
    );
  };

  const toggleFavorite = (workoutId) => {
    const updatedFilteredWorkouts = filteredWorkouts.map((workout) => {
      if (workout.id === workoutId) {
        return { ...workout, favorite: !workout.favorite };
      }
      return workout;
    });
    setFilteredWorkouts(updatedFilteredWorkouts);

    const updatedPopularWorkouts = popularWorkouts.map((workout) => {
      if (workout.id === workoutId) {
        return { ...workout, favorite: !workout.favorite };
      }
      return workout;
    });
    setPopularWorkouts(updatedPopularWorkouts);
  };

  // Get icon for category
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Cardio':
        return 'running';
      case 'Strength Training':
        return 'dumbbell';
      case 'Yoga':
        return 'praying-hands';
      default:
        return 'heartbeat';
    }
  };

  // Difficulty level text
  const getDifficultyText = (level) => {
    if (level <= 2) return 'Beginner';
    if (level <= 4) return 'Intermediate';
    return 'Advanced';
  };

  // Render the featured workout cards
  const renderFeaturedWorkout = ({ item }) => (
    <TouchableOpacity
      style={styles.featuredWorkoutCard}
      onPress={() => setExpandedWorkout(item)}
      activeOpacity={0.9}
    >
      <Image source={item.imageUrl} style={styles.featuredWorkoutImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.85)']}
        style={styles.featuredGradient}
      >
        <View style={styles.featuredWorkoutBadge}>
          <FontAwesome5
            name={getCategoryIcon(item.Category)}
            size={14}
            color="#fff"
          />
          <Text style={styles.featuredWorkoutBadgeText}>{item.Category}</Text>
        </View>

        <View style={styles.featuredWorkoutInfo}>
          <Text style={styles.featuredWorkoutTitle}>{item.name}</Text>
          <View style={styles.featuredWorkoutMeta}>
            <View style={styles.featuredMetaItem}>
              <FontAwesome5 name="clock" size={14} color="#fff" />
              <Text style={styles.featuredMetaText}>{item.duration} min</Text>
            </View>
            <View style={styles.featuredMetaItem}>
              <FontAwesome5 name="fire" size={14} color="#fff" />
              <Text style={styles.featuredMetaText}>{item.calories} cal</Text>
            </View>
            <View style={styles.featuredMetaItem}>
              <FontAwesome5 name="signal" size={14} color="#fff" />
              <Text style={styles.featuredMetaText}>
                {getDifficultyText(item.difficulty)}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <TouchableOpacity
        style={styles.favoriteButtonFeatured}
        onPress={() => toggleFavorite(item.id)}
      >
        <FontAwesome5
          name={item.favorite ? 'heart' : 'heart'}
          solid={item.favorite}
          size={20}
          color={item.favorite ? '#FF385C' : '#fff'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render the workout grid cards
  const renderWorkoutCard = ({ item }) => {
    const isAlreadySaved =
      Array.isArray(userWorkouts) &&
      userWorkouts.some((w) => w.name === item.name);

    return (
      <TouchableOpacity
        style={styles.workoutCard}
        onPress={() => setExpandedWorkout(item)}
        activeOpacity={0.9}
      >
        <Image source={item.imageUrl} style={styles.workoutCardImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)']}
          style={styles.cardGradient}
        />

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item.id)}
        >
          <FontAwesome5
            name="heart"
            solid={item.favorite}
            size={18}
            color={item.favorite ? '#FF385C' : '#fff'}
          />
        </TouchableOpacity>

        <View style={styles.workoutCardContent}>
          <Text style={styles.workoutCardTitle} numberOfLines={1}>
            {item.name}
          </Text>

          <View style={styles.workoutCardMeta}>
            <View style={styles.categoryPill}>
              <FontAwesome5
                name={getCategoryIcon(item.Category)}
                size={10}
                color="#09355c"
                style={styles.categoryIcon}
              />
              <Text style={styles.categoryPillText}>{item.Category}</Text>
            </View>

            <View style={styles.minutesPill}>
              <FontAwesome5 name="clock" size={12} color="#09355c" />
              <Text style={styles.minutesPillText}>{item.duration} min</Text>
            </View>
          </View>

          <View style={styles.difficultyContainer}>
            {[1, 2, 3, 4, 5].map((level) => (
              <View
                key={level}
                style={[
                  styles.difficultyDot,
                  {
                    backgroundColor:
                      level <= item.difficulty ? '#09355c' : '#e0e0e0',
                  },
                ]}
              />
            ))}
            <Text style={styles.difficultyText}>
              {getDifficultyText(item.difficulty)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render the filter category buttons
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryPillButton,
        item.active && styles.activeCategoryPill,
      ]}
      onPress={() => handleFilterChange(item.name)}
    >
      <MaterialCommunityIcons
        name={item.icon}
        size={14}
        color={item.active ? '#fff' : '#555'}
      />
      {item.name.length <= 6 && (
        <Text
          style={[
            styles.categoryPillButtonText,
            item.active && styles.activeCategoryPillText,
          ]}
        >
          {item.name}
        </Text>
      )}
      {item.name.length > 6 && (
        <Text
          style={[
            styles.categoryPillButtonText,
            item.active && styles.activeCategoryPillText,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.name}
        </Text>
      )}
    </TouchableOpacity>
  );

  // Empty state component
  const EmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <MaterialCommunityIcons name="dumbbell" size={60} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No workouts found</Text>
      <Text style={styles.emptyStateText}>
        Try adjusting your filters or search terms
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Expanded Workout Modal */}
      {expandedWorkout && (
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} bounces={false}>
            <Image
              source={expandedWorkout.imageUrl}
              style={styles.modalImage}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.7)', 'transparent']}
              style={styles.modalImageOverlay}
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setExpandedWorkout(null)}
            >
              <FontAwesome5 name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>

            <View style={styles.modalBody}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{expandedWorkout.name}</Text>
                <TouchableOpacity
                  style={styles.favoriteButtonLarge}
                  onPress={() => toggleFavorite(expandedWorkout.id)}
                >
                  <FontAwesome5
                    name="heart"
                    solid={expandedWorkout.favorite}
                    size={22}
                    color={expandedWorkout.favorite ? '#FF385C' : '#09355c'}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.modalMetaContainer}>
                <View style={styles.modalMetaItem}>
                  <FontAwesome5
                    name={getCategoryIcon(expandedWorkout.Category)}
                    size={18}
                    color="#09355c"
                  />
                  <Text style={styles.modalMetaText}>
                    {expandedWorkout.Category}
                  </Text>
                </View>
                <View style={styles.modalMetaItem}>
                  <FontAwesome5 name="clock" size={18} color="#09355c" />
                  <Text style={styles.modalMetaText}>
                    {expandedWorkout.duration} min
                  </Text>
                </View>
                <View style={styles.modalMetaItem}>
                  <FontAwesome5 name="fire" size={18} color="#09355c" />
                  <Text style={styles.modalMetaText}>
                    {expandedWorkout.calories} cal
                  </Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Difficulty</Text>
                <View style={styles.modalDifficultyContainer}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.difficultyDotLarge,
                        {
                          backgroundColor:
                            level <= expandedWorkout.difficulty
                              ? '#09355c'
                              : '#e0e0e0',
                        },
                      ]}
                    />
                  ))}
                  <Text style={styles.difficultyTextLarge}>
                    {getDifficultyText(expandedWorkout.difficulty)}
                  </Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Description</Text>
                <Text style={styles.modalDescription}>
                  {expandedWorkout.Description}
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Equipment</Text>
                <View style={styles.equipmentContainer}>
                  <MaterialCommunityIcons
                    name={
                      expandedWorkout.Equipment.toLowerCase().includes('none')
                        ? 'home'
                        : 'dumbbell'
                    }
                    size={24}
                    color="#09355c"
                    style={styles.equipmentIcon}
                  />
                  <Text style={styles.modalText}>
                    {expandedWorkout.Equipment}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  handleAddWorkout(expandedWorkout);
                }}
              >
                <FontAwesome5
                  name="plus"
                  size={18}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.modalButtonText}>Add To My Workouts</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.startButton]}
                onPress={() => {
                  // Handle start workout
                  showToast(`Starting ${expandedWorkout.name} workout!`);
                  setExpandedWorkout(null);
                }}
              >
                <FontAwesome5
                  name="play"
                  size={18}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.startButtonText}>Start Workout</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={['#053559', '#09355c']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.Text
            style={[styles.headerTitle, { opacity: headerSubtitleOpacity }]}
          >
            Explore Workouts
          </Animated.Text>
          <Animated.Text
            style={[styles.headerSubtitle, { opacity: headerSubtitleOpacity }]}
          >
            Discover and start your fitness journey
          </Animated.Text>

          <Animated.Text
            style={[styles.compactHeaderTitle, { opacity: headerTitleOpacity }]}
          >
            Explore Workouts
          </Animated.Text>
        </LinearGradient>
      </Animated.View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search workouts..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Categories */}
      <View style={styles.filterCategoriesWrapper}>
        <FlatList
          data={quickFilters}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.categoriesContainer}
        />
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#09355c" />
          <Text style={styles.loaderText}>Loading workouts...</Text>
        </View>
      ) : (
        <Animated.ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Featured Workouts */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <FontAwesome5
                  name="star"
                  size={18}
                  color="#FF8C00"
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitle}>Featured Workouts</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {popularWorkouts.length > 0 ? (
              <FlatList
                data={popularWorkouts}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={renderFeaturedWorkout}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.featuredContainer}
              />
            ) : (
              <View style={styles.noFeaturedContainer}>
                <Text style={styles.noFeaturedText}>
                  No featured workouts available
                </Text>
              </View>
            )}
          </View>

          {/* Workout Grid */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <FontAwesome5
                  name={
                    activeSection === 'All'
                      ? 'th-large'
                      : activeSection === 'Cardio'
                      ? 'running'
                      : activeSection === 'Strength Training'
                      ? 'dumbbell'
                      : activeSection === 'Yoga'
                      ? 'praying-hands'
                      : activeSection === 'Quick (< 15 min)'
                      ? 'stopwatch'
                      : 'home'
                  }
                  size={18}
                  color="#09355c"
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitle}>
                  {activeSection === 'All' ? 'All Workouts' : activeSection}
                </Text>
              </View>
              <Text style={styles.workoutCount}>
                {filteredWorkouts.length} workouts
              </Text>
            </View>

            {filteredWorkouts.length > 0 ? (
              <View style={styles.workoutGrid}>
                {filteredWorkouts.map((item) => (
                  <View key={item.id} style={styles.gridItem}>
                    {renderWorkoutCard({ item })}
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState />
            )}
          </View>

          {/* Bottom Padding for NavBar */}
          <View style={{ height: 100 }} />
        </Animated.ScrollView>
      )}

      <NavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // Header styles
  header: {
    width: '100%',
    overflow: 'hidden',
  },
  headerGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  compactHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  // Search bar styles
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: -25,
    marginBottom: 10,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  // Category filter styles
  filterCategoriesWrapper: {
    height: 40, // Fixed height container for categories
    marginBottom: 5, // Add some margin at the bottom
  },
  categoriesContainer: {
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  categoryPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14, // Increased horizontal padding
    paddingVertical: 8, // Increased vertical padding
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    marginRight: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 0,
    height: 32, // Fixed height for all pills
  },
  activeCategoryPill: {
    backgroundColor: '#09355c',
  },
  filterIcon: {
    marginRight: 3,
    fontSize: 12,
  },
  categoryPillButtonText: {
    fontSize: 13, // Slightly larger font
    fontWeight: '500',
    color: '#555',
    marginLeft: 4, // Added space between icon and text
  },
  activeCategoryPillText: {
    color: '#fff',
  },
  // Content section styles
  content: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  workoutCount: {
    fontSize: 14,
    color: '#666',
  },
  featuredContainer: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  featuredWorkoutCard: {
    width: width - 80,
    height: 200,
    marginRight: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  featuredWorkoutImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 15,
  },
  featuredWorkoutInfo: {
    width: '100%',
  },
  featuredWorkoutTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  featuredWorkoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  featuredMetaText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 6,
  },
  workoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
  },
  gridItem: {
    width: '50%',
    padding: 5,
  },
  workoutCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  workoutCardImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutCardContent: {
    padding: 12,
  },
  workoutCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#09355c',
    marginBottom: 5,
  },
  workoutCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryPill: {
    backgroundColor: 'rgba(9, 53, 92, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryPillText: {
    fontSize: 12,
    color: '#09355c',
    fontWeight: '500',
  },
  minutesPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minutesPillText: {
    fontSize: 12,
    color: '#09355c',
    marginLeft: 4,
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 3,
  },
  difficultyText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalBody: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#09355c',
    flex: 1,
  },
  favoriteButtonLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalMetaContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  modalMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  modalMetaText: {
    fontSize: 16,
    color: '#09355c',
    marginLeft: 8,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalDifficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyDotLarge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  difficultyTextLarge: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  modalDescription: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  modalText: {
    fontSize: 16,
    color: '#555',
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: '#09355c',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollViewContent: {
    paddingTop: 5, // Small padding at the top of content
  },
});
