import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ImageBackground,
  Modal,
} from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import CardioComponent from '../components/CardioComponent';
import StrengthComponent from '../components/StrengthComponent';
import YogaComponent from '../components/YogaComponent';
import { getDatabase, ref, push, set } from 'firebase/database';
import { auth } from '../services/firebaseConfig';
import NavBar from '../components/NavBar';
import { useNavigation } from '@react-navigation/native';

const TrackWorkoutScreen = ({ route }) => {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState(
    route.params?.category || 'Select Workout'
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState(
    route.params?.subCategory || 'Select Option'
  );
  const [isTrackingCardio, setIsTrackingCardio] = useState(false);
  const [steps, setSteps] = useState(0);
  const [cardioDuration, setCardioDuration] = useState(0);
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('');
  const [weight, setWeight] = useState('');
  const [yogaDuration, setYogaDuration] = useState(0);
  const [isTrackingYoga, setIsTrackingYoga] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [isSelectingCategory, setIsSelectingCategory] = useState(true);

  // Mapping for subcategories based on the selected category
  const subCategories = {
    Cardio: [
      { label: 'Jump Rope', value: 'Jump Rope' },
      { label: 'Running', value: 'Running' },
      { label: 'Walking', value: 'Walking' },
    ],
    Strength: [
      { label: 'Bench Press', value: 'Bench Press' },
      { label: 'DeadLift', value: 'DeadLift' },
      { label: 'Squats', value: 'Squats' },
    ],
    Yoga: [
      {
        label: 'Downward Dog (Adho Mukha Svanasana)',
        value: 'Downward Dog (Adho Mukha Svanasana)',
      },
    ],
  };

  // Category icons mapping
  const categoryIcons = {
    Cardio: 'heartbeat',
    Strength: 'dumbbell',
    Yoga: 'spa',
  };

  // Use this to determine which icon library to use
  const iconLibrary = {
    Cardio: 'FontAwesome',
    Strength: 'FontAwesome5',
    Yoga: 'FontAwesome5',
  };

  // Pre-load workout details if they exist in route params
  useEffect(() => {
    if (route.params?.workout) {
      const workout = route.params.workout;
      setSelectedCategory(workout.Category || 'Select Workout');
      setSelectedSubCategory(workout.name || 'Select Option');
    }
  }, [route.params]);

  const handleSubmit = () => {
    const db = getDatabase();
    const user = auth.currentUser;

    if (user) {
      const uid = user.uid;
      const now = new Date();

      let workoutData = {
        time: now.toLocaleTimeString(),
        date: now.getTime(),
      };

      // Include subcategory along with category-specific data
      switch (selectedCategory) {
        case 'Cardio':
          workoutData = {
            ...workoutData,
            steps,
            cardioDuration,
            subCategory: selectedSubCategory,
          };
          break;
        case 'Strength':
          workoutData = {
            ...workoutData,
            reps,
            sets,
            weight,
            subCategory: selectedSubCategory,
          };
          break;
        case 'Yoga':
          workoutData = {
            ...workoutData,
            yogaDuration,
            subCategory: selectedSubCategory,
          };
          break;
      }

      // Change the database path to match the second code
      const activityRef = ref(db, `Activity/${uid}/${selectedCategory}`);
      const newWorkoutRef = push(activityRef);

      set(newWorkoutRef, workoutData)
        .then(() => {
          console.log('Workout saved successfully!');
          alert('Workout saved successfully!');
          // Reset state
          setSteps(0);
          setCardioDuration(0);
          setReps('');
          setSets('');
          setWeight('');
          setIsTrackingCardio(false);
          setYogaDuration(0);
          setIsTrackingYoga(false);
          setSelectedSubCategory('Select Option');
          setSelectedCategory('Select Workout');
        })
        .catch((error) => {
          console.error('Failed to save workout data: ', error);
          alert('Failed to save workout. Please try again.');
        });
    } else {
      alert('No user is logged in. Please log in to track your workout.');
    }
  };

  // Helper function to render selection buttons
  const renderSelectionButton = (text, onPress) => (
    <TouchableOpacity style={styles.selectionButton} onPress={onPress}>
      <Text style={styles.selectionButtonText}>{text}</Text>
      <FontAwesome name="chevron-down" size={16} color="#053559" />
    </TouchableOpacity>
  );

  // Check if either field is still at its default value
  const isInvalidSelection =
    selectedCategory === 'Select Workout' ||
    selectedSubCategory === 'Select Option';

  // Set header options to hide the header title
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

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
              <Text style={styles.headerTitle}>Track Workout</Text>
              <Text style={styles.headerSubtitle}>
                Log your fitness activities
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* Selection Cards */}
          <View style={styles.selectionCard}>
            <Text style={styles.sectionTitle}>Choose Your Workout</Text>

            {/* Category Selection Button */}
            <View style={styles.selectionSection}>
              <Text style={styles.selectionLabel}>Activity Type</Text>
              {renderSelectionButton(selectedCategory, () => {
                setIsSelectingCategory(true);
                setModalVisible(true);
              })}
            </View>

            {/* Subcategory Selection Button */}
            <View style={styles.selectionSection}>
              <Text style={styles.selectionLabel}>Exercise</Text>
              {renderSelectionButton(selectedSubCategory, () => {
                if (selectedCategory !== 'Select Workout') {
                  setIsSelectingCategory(false);
                  setModalVisible(true);
                } else {
                  alert('Please select a workout category first');
                }
              })}
            </View>

            {/* Selection Summary */}
            {!isInvalidSelection && (
              <View style={styles.selectionSummary}>
                <View style={styles.iconContainer}>
                  {iconLibrary[selectedCategory] === 'FontAwesome5' ? (
                    <FontAwesome5
                      name={categoryIcons[selectedCategory]}
                      size={24}
                      color="#fff"
                    />
                  ) : (
                    <FontAwesome
                      name={categoryIcons[selectedCategory]}
                      size={24}
                      color="#fff"
                    />
                  )}
                </View>
                <View style={styles.selectionTextContainer}>
                  <Text style={styles.selectedCategory}>
                    {selectedCategory}
                  </Text>
                  <Text style={styles.selectedSubcategory}>
                    {selectedSubCategory}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Form Container */}
          {!isInvalidSelection ? (
            <View style={styles.trackingCard}>
              <Text style={styles.sectionTitle}>Tracking Details</Text>
              <View style={styles.formContainer}>
                {selectedCategory === 'Cardio' && (
                  <CardioComponent
                    currentSteps={steps}
                    setCurrentSteps={setSteps}
                    duration={cardioDuration}
                    setDuration={setCardioDuration}
                    isTracking={isTrackingCardio}
                    setIsTracking={setIsTrackingCardio}
                    selectedSubCategory={selectedSubCategory}
                    handleSubmit={handleSubmit}
                  />
                )}

                {selectedCategory === 'Strength' && (
                  <StrengthComponent
                    setReps={setReps}
                    reps={reps}
                    setSets={setSets}
                    sets={sets}
                    setWeight={setWeight}
                    weight={weight}
                    handleSubmit={handleSubmit}
                  />
                )}

                {selectedCategory === 'Yoga' && (
                  <YogaComponent
                    timer={yogaDuration}
                    setTimer={setYogaDuration}
                    isRunning={isTrackingYoga}
                    setIsRunning={setIsTrackingYoga}
                    handleSubmit={handleSubmit}
                  />
                )}
              </View>

              {/* Global Submit Button */}
              <TouchableOpacity
                style={styles.mainSubmitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Save Workout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.promptCard}>
              <FontAwesome5 name="hand-point-up" size={40} color="#053559" />
              <Text style={styles.promptText}>
                Please select both a workout category and specific exercise to
                start tracking
              </Text>
            </View>
          )}

          {/* Bottom Padding */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Selection Modal */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isSelectingCategory
                  ? 'Select Workout Type'
                  : 'Select Exercise'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <FontAwesome name="times" size={24} color="#053559" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              {isSelectingCategory
                ? // Category options
                  ['Select Workout', 'Cardio', 'Strength', 'Yoga'].map(
                    (item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.modalItem}
                        onPress={() => {
                          setSelectedCategory(item);
                          if (item === 'Select Workout') {
                            setSelectedSubCategory('Select Option');
                          }
                          setModalVisible(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.modalItemText,
                            selectedCategory === item &&
                              styles.selectedModalItem,
                          ]}
                        >
                          {item}
                        </Text>
                        {selectedCategory === item && (
                          <FontAwesome name="check" size={18} color="#053559" />
                        )}
                      </TouchableOpacity>
                    )
                  )
                : // Subcategory options based on selected category
                  [
                    'Select Option',
                    ...(subCategories[selectedCategory]?.map(
                      (item) => item.value
                    ) || []),
                  ].map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.modalItem}
                      onPress={() => {
                        setSelectedSubCategory(item);
                        setModalVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalItemText,
                          selectedSubCategory === item &&
                            styles.selectedModalItem,
                        ]}
                      >
                        {item}
                      </Text>
                      {selectedSubCategory === item && (
                        <FontAwesome name="check" size={18} color="#053559" />
                      )}
                    </TouchableOpacity>
                  ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

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
    height: Platform.OS === 'ios' ? 180 : 170,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20,
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
    paddingTop: Platform.OS === 'ios' ? 25 : 5,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginTop: -30,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: -30,
    marginLeft: 50,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginLeft: 50,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  selectionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  trackingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#09355c',
    marginBottom: 18,
  },
  selectionSection: {
    marginBottom: 18,
  },
  selectionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  selectionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  selectionButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: 'rgba(9, 53, 92, 0.08)',
    borderRadius: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(9, 53, 92, 0.12)',
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#09355c',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  selectionTextContainer: {
    flex: 1,
  },
  selectedCategory: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#09355c',
  },
  selectedSubcategory: {
    fontSize: 15,
    color: '#555',
    marginTop: 3,
  },
  formContainer: {
    marginBottom: 20,
  },
  mainSubmitButton: {
    backgroundColor: '#09355c',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  promptCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  promptText: {
    fontSize: 17,
    color: '#555',
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 24,
  },
  bottomPadding: {
    height: 100,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#053559',
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedModalItem: {
    color: '#053559',
    fontWeight: 'bold',
  },
});

export default TrackWorkoutScreen;
