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

const TrackWorkoutScreen = () => {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('Select Workout');
  const [selectedSubCategory, setSelectedSubCategory] =
    useState('Select Option');
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
    Yoga: 'FontAwesome',
  };

  const handleSubmit = () => {
    const db = getDatabase();
    const user = auth.currentUser;

    if (user) {
      const uid = user.uid;
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      let workoutData = {
        time: now.toLocaleTimeString(),
        date: formattedDate,
        timestamp: now.getTime(),
        type: selectedCategory,
        name: selectedSubCategory,
      };

      // Include subcategory along with category-specific data
      switch (selectedCategory) {
        case 'Cardio':
          workoutData = { ...workoutData, steps, duration: cardioDuration };
          break;
        case 'Strength':
          workoutData = { ...workoutData, reps, sets, weight };
          break;
        case 'Yoga':
          workoutData = { ...workoutData, duration: yogaDuration };
          break;
      }

      // Use consistent path with DashboardScreen (Activities instead of Activity)
      const activityRef = ref(db, `Users/${uid}/Activities`);
      const newWorkoutRef = push(activityRef);

      set(newWorkoutRef, workoutData)
        .then(() => {
          console.log('Workout saved successfully!');

          // Create a more elegant success message
          alert('Great job! Your workout has been successfully saved.');

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
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Track Workout</Text>
          <Text style={styles.headerSubtitle}>Log your fitness activities</Text>
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
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  selectionCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  trackingCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  selectionSection: {
    marginBottom: 15,
  },
  selectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  selectionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    padding: 15,
  },
  selectionButtonText: {
    fontSize: 16,
    color: '#333',
  },
  selectionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
    marginTop: 10,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#053559',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  selectionTextContainer: {
    flex: 1,
  },
  selectedCategory: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#053559',
  },
  selectedSubcategory: {
    fontSize: 14,
    color: '#666',
  },
  formContainer: {
    marginBottom: 20,
  },
  mainSubmitButton: {
    backgroundColor: '#053559',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  promptCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  promptText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
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
