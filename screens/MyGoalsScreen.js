import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  ImageBackground,
  SafeAreaView,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  remove,
} from 'firebase/database';
import { auth } from '../services/firebaseConfig';
import NavBar from '../components/NavBar';
import { setupActivityListener } from '../services/fetchUserActivities';

const { width } = Dimensions.get('window');

// Define sub-categories for each main goal category
export const subCategories = {
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

// Utility to handle timestamps and string dates
const parseActivityDate = (dateValue) => {
  if (!dateValue) return new Date();
  if (typeof dateValue === 'number') return new Date(dateValue);
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'string') {
    if (dateValue.includes('/')) {
      const parts = dateValue.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[0] - 1, parts[1]);
      }
    }
    return new Date(dateValue);
  }
  return new Date();
};

const getStatusStyle = (status) => {
  switch (status) {
    case 'Complete':
      return {
        backgroundColor: '#4CAF50',
      };
    case 'Due Today':
      return {
        backgroundColor: '#FF9800',
      };
    case 'Past Due':
      return {
        backgroundColor: '#F44336',
      };
    default:
      return {
        backgroundColor: '#ffc107',
      };
  }
};

const MyGoalsScreen = () => {
  // Form & goal list states
  const [selectedCategory, setSelectedCategory] = useState('Select Goal');
  const [subCategory, setSubCategory] = useState('');
  const [goalDeadline, setGoalDeadline] = useState(new Date());
  const [cardioType, setCardioType] = useState('Steps');
  const [cardioSteps, setCardioSteps] = useState('');
  const [cardioDuration, setCardioDuration] = useState('');
  const [yogaDuration, setYogaDuration] = useState('');
  const [strengthSessions, setStrengthSessions] = useState('');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [userGoals, setUserGoals] = useState([]);
  const [activities, setActivities] = useState({});
  const todayDate = new Date();
  const navigation = useNavigation();

  // States for editing
  const [editingGoal, setEditingGoal] = useState(null);
  const [editSubCategory, setEditSubCategory] = useState('');
  const [editDeadline, setEditDeadline] = useState(new Date());
  const [editCardioSteps, setEditCardioSteps] = useState('');
  const [editCardioDuration, setEditCardioDuration] = useState('');
  const [editStrengthSessions, setEditStrengthSessions] = useState('');
  const [editYogaDuration, setEditYogaDuration] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Add these new states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false);
  const [showEditDropdown, setShowEditDropdown] = useState(false);

  // Fetch goals from Firebase
  useEffect(() => {
    const fetchGoals = async () => {
      const db = getDatabase();
      const user = auth.currentUser;
      if (user) {
        const goalsRef = ref(db, `Users/${user.uid}/Goals`);
        onValue(goalsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const goalsArray = Object.entries(data).map(([id, value]) => ({
              id,
              ...value,
            }));
            setUserGoals(goalsArray);
          } else {
            setUserGoals([]);
          }
        });
      }
    };
    fetchGoals();
  }, []);

  // Set up activity listener
  useEffect(() => {
    const unsubscribe = setupActivityListener(setActivities);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  });

  const aggregateActivityForGoal = (goal, categoryActivities) => {
    let aggregated = { steps: 0, duration: 0, sessions: 0 };

    const goalStart = new Date(goal.dateCreated);
    goalStart.setHours(0, 0, 0, 0);
    const goalEnd = new Date(goal.deadline);
    goalEnd.setHours(23, 59, 59, 999);

    Object.values(categoryActivities).forEach((entry) => {
      if (goal.subCategory) {
        if (!entry.subCategory || entry.subCategory !== goal.subCategory) {
          return;
        }
      }

      const entryDate = parseActivityDate(entry.date);
      entryDate.setHours(0, 0, 0, 0);

      if (entryDate >= goalStart && entryDate <= goalEnd) {
        if (goal.category === 'Cardio') {
          aggregated.steps += Number(entry.steps) || 0;
          aggregated.duration += (Number(entry.cardioDuration) || 0) / 60;
        } else if (goal.category === 'Strength') {
          aggregated.sessions += 1;
        } else if (goal.category === 'Yoga') {
          aggregated.duration += (Number(entry.yogaDuration) || 0) / 60;
        }
      }
    });
    return aggregated;
  };

  // Check each goal's progress and mark complete if target is met
  useEffect(() => {
    if (!activities || userGoals.length === 0) return;

    userGoals
      .filter((goal) => !goal.completed)
      .forEach((goal) => {
        const categoryActivities = activities[goal.category] || {};
        const aggregated = aggregateActivityForGoal(goal, categoryActivities);

        let meetsTarget = false;
        if (goal.category === 'Cardio') {
          const targetSteps = Number(goal.cardioSteps) || 0;
          const targetDuration = Number(goal.cardioDuration) || 0;
          if (targetSteps > 0 && targetDuration > 0) {
            meetsTarget =
              aggregated.steps >= targetSteps &&
              aggregated.duration >= targetDuration;
          } else if (targetSteps > 0) {
            meetsTarget = aggregated.steps >= targetSteps;
          } else if (targetDuration > 0) {
            meetsTarget = aggregated.duration >= targetDuration;
          }
        } else if (goal.category === 'Strength') {
          const targetSessions = Number(goal.strengthSessions) || 0;
          meetsTarget = aggregated.sessions >= targetSessions;
        } else if (goal.category === 'Yoga') {
          const targetDuration = Number(goal.yogaDuration) || 0;
          meetsTarget = aggregated.duration >= targetDuration;
        }

        if (meetsTarget) {
          handleCompleteGoal(goal);
        }
      });
  }, [userGoals, activities]);

  // Add this new function to handle target validation
  const validateTarget = (category, targetValue) => {
    if (!targetValue || targetValue.trim() === '') {
      return false;
    }
    const numValue = Number(targetValue);
    if (isNaN(numValue) || numValue <= 0) {
      return false;
    }
    return true;
  };

  // Update the handleSubmit function
  const handleSubmit = () => {
    const errors = [];

    if (selectedCategory === 'Select Goal' || subCategory === '') {
      errors.push('Please select a valid goal category and sub-category.');
    } else {
      switch (selectedCategory) {
        case 'Cardio':
          if (cardioType === 'Steps' && !validateTarget('Steps', cardioSteps)) {
            errors.push('Please enter a valid number of steps.');
          } else if (
            cardioType === 'Duration' &&
            !validateTarget('Duration', cardioDuration)
          ) {
            errors.push('Please enter a valid duration in minutes.');
          }
          break;
        case 'Strength':
          if (!validateTarget('Sessions', strengthSessions)) {
            errors.push('Please enter a valid number of sessions.');
          }
          break;
        case 'Yoga':
          if (!validateTarget('Duration', yogaDuration)) {
            errors.push('Please enter a valid duration in minutes.');
          }
          break;
      }
    }

    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    const db = getDatabase();
    const user = auth.currentUser;
    if (user) {
      let goalData = {
        category: selectedCategory,
        subCategory: subCategory,
        deadline: goalDeadline.getTime(), // This should be the selected deadline
        dateCreated: new Date().getTime(),
        completed: false,
      };

      // Add specific target data based on category
      switch (selectedCategory) {
        case 'Cardio':
          if (cardioType === 'Steps') {
            goalData = { ...goalData, cardioSteps: Number(cardioSteps) };
          } else {
            goalData = { ...goalData, cardioDuration: Number(cardioDuration) };
          }
          break;
        case 'Strength':
          goalData = {
            ...goalData,
            strengthSessions: Number(strengthSessions),
          };
          break;
        case 'Yoga':
          goalData = { ...goalData, yogaDuration: Number(yogaDuration) };
          break;
      }

      const goalsRef = ref(db, `Users/${user.uid}/Goals`);
      const newGoalRef = push(goalsRef);

      set(newGoalRef, goalData)
        .then(() => {
          Alert.alert('Success', 'Goal saved successfully!');
          resetForm();
        })
        .catch((error) => {
          console.error('Failed to save goal data: ', error);
          Alert.alert('Error', 'Failed to save goal. Please try again.');
        });
    }
  };

  // Update the date picker handling
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setGoalDeadline(selectedDate); // This should update the goalDeadline state
    }
  };

  // Modify the resetForm function
  const resetForm = () => {
    setSelectedCategory('Select Goal');
    setSubCategory('');
    setGoalDeadline(new Date());
    setShowGoalForm(false);
  };

  // Delete goal with confirmation
  const handleDeleteGoal = (goalId) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const db = getDatabase();
            const user = auth.currentUser;
            if (user) {
              const goalRef = ref(db, `Users/${user.uid}/Goals/${goalId}`);
              remove(goalRef)
                .then(() =>
                  Alert.alert('Success', 'Goal deleted successfully!')
                )
                .catch((error) => {
                  console.error('Error deleting goal: ', error);
                  Alert.alert(
                    'Error',
                    'Error deleting goal. Please try again.'
                  );
                });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Mark goal as complete
  const handleCompleteGoal = (goal) => {
    const db = getDatabase();
    const user = auth.currentUser;
    if (user) {
      const goalRef = ref(db, `Users/${user.uid}/Goals/${goal.id}`);
      set(goalRef, { ...goal, completed: true })
        .then(() => {
          Alert.alert('Success', 'Goal marked as complete!');
        })
        .catch((error) => {
          console.error('Error updating goal: ', error);
          Alert.alert('Error', 'Error updating goal: ' + error.message);
        });
    }
  };

  const handleEditPress = (goal) => {
    setIsEditing(true);
    setEditingGoal(goal);
    setEditSubCategory(goal.subCategory || '');
    setEditDeadline(new Date(goal.deadline));
    if (goal.category === 'Cardio') {
      if (goal.cardioSteps !== undefined) {
        setEditCardioSteps(goal.cardioSteps.toString());
      } else if (goal.cardioDuration !== undefined) {
        setEditCardioDuration(goal.cardioDuration.toString());
      }
    } else if (goal.category === 'Strength') {
      setEditStrengthSessions(goal.strengthSessions.toString());
    } else if (goal.category === 'Yoga') {
      setEditYogaDuration(goal.yogaDuration.toString());
    }
  };

  const handleSaveEdit = async () => {
    if (!editingGoal) return;

    try {
      const db = getDatabase();
      const user = auth.currentUser;
      if (!user) return;

      const goalRef = ref(db, `Users/${user.uid}/Goals/${editingGoal.id}`);

      const updatedFields = {
        subCategory: editSubCategory,
        deadline: editDeadline.getTime(),
      };

      if (editingGoal.category === 'Cardio') {
        if (editingGoal.cardioSteps !== undefined) {
          updatedFields.cardioSteps = Number(editCardioSteps);
        } else if (editingGoal.cardioDuration !== undefined) {
          updatedFields.cardioDuration = Number(editCardioDuration);
        }
      } else if (editingGoal.category === 'Strength') {
        updatedFields.strengthSessions = Number(editStrengthSessions);
      } else if (editingGoal.category === 'Yoga') {
        updatedFields.yogaDuration = Number(editYogaDuration);
      }

      await set(goalRef, { ...editingGoal, ...updatedFields });
      setEditingGoal(null);
      Alert.alert('Success', 'Goal updated successfully!');
    } catch (error) {
      console.error('Error updating goal: ', error);
      Alert.alert('Error', 'Failed to update goal. Please try again.');
    }
    setIsEditing(false);
  };

  const handleSubCategorySelect = (value) => {
    if (isEditing) {
      setEditSubCategory(value);
    } else {
      setSubCategory(value);
    }
    setShowSubCategoryModal(false);
  };

  // Group goals by category for display
  const groupedGoals = userGoals.reduce((acc, goal) => {
    const cat = goal.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(goal);
    return acc;
  }, {});

  // Update the computeGoalStatus function
  const computeGoalStatus = (goal) => {
    if (goal.completed) return 'Complete';

    const currentDate = new Date();
    const goalDate = new Date(goal.deadline);

    // Set both dates to start of day for comparison
    currentDate.setHours(0, 0, 0, 0);
    goalDate.setHours(0, 0, 0, 0);

    // Calculate the difference in days
    const diffTime = goalDate - currentDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return 'To Do';
    } else if (diffDays === 0) {
      return 'Due Today';
    } else {
      return 'Past Due';
    }
  };

  // Add this function to render cardio type selection
  const renderCardioTabs = () => (
    <View style={styles.tabContainer}>
      {['Steps', 'Duration'].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, cardioType === tab && styles.activeTab]}
          onPress={() => setCardioType(tab)}
        >
          <Text
            style={[styles.tabText, cardioType === tab && styles.activeTabText]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Add these new components
  const CategoryModal = () => (
    <Modal visible={showCategoryModal} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Goal Type</Text>
          <ScrollView style={styles.modalScrollView}>
            {['Cardio', 'Strength', 'Yoga'].map((category) => (
              <TouchableOpacity
                key={category}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedCategory(category);
                  setShowCategoryModal(false);
                }}
              >
                <Text style={styles.modalItemText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowCategoryModal(false)}
          >
            <Text style={styles.modalCloseButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const SubCategoryModal = () => {
    if (!showSubCategoryModal) return null;

    const currentCategory = isEditing
      ? editingGoal?.category
      : selectedCategory;
    const currentSubCategory = isEditing ? editSubCategory : subCategory;

    return (
      <Modal visible={true} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Sub-Category</Text>
            <ScrollView style={styles.modalScrollView}>
              {subCategories[currentCategory]?.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.modalItem}
                  onPress={() => handleSubCategorySelect(item.value)}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowSubCategoryModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Update the checkGoalProgress function
  const checkGoalProgress = (goal, activities) => {
    const categoryActivities = activities[goal.category] || {};
    const aggregated = aggregateActivityForGoal(goal, categoryActivities);

    let progress = 0;
    let target = 0;

    if (goal.category === 'Cardio') {
      if (goal.cardioSteps) {
        progress = aggregated.steps;
        target = Number(goal.cardioSteps);
      } else if (goal.cardioDuration) {
        progress = aggregated.duration;
        target = Number(goal.cardioDuration);
      }
    } else if (goal.category === 'Strength') {
      progress = aggregated.sessions;
      target = Number(goal.strengthSessions);
    } else if (goal.category === 'Yoga') {
      progress = aggregated.duration;
      target = Number(goal.yogaDuration);
    }

    return {
      progress,
      target,
      percentage: Math.min(100, (progress / target) * 100),
    };
  };

  const renderGoalCard = (goal) => (
    <View style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <View style={styles.goalTitleContainer}>
          <Text style={styles.goalTitle} numberOfLines={2}>
            {goal.subCategory || goal.category}
          </Text>
          <Text style={styles.goalCategory}>{goal.category}</Text>
        </View>
        <View style={styles.goalStatusContainer}>
          <View style={[styles.statusBadge, getStatusStyle(goal.status)]}>
            <Text style={styles.statusText}>{goal.status}</Text>
          </View>
        </View>
      </View>
      <View style={styles.goalProgress}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(goal.current / goal.target) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {goal.current} / {goal.target}
        </Text>
      </View>
      <View style={styles.goalFooter}>
        <Text style={styles.deadlineText}>
          Due:{' '}
          {goal.deadline ? goal.deadline.toLocaleDateString() : 'No deadline'}
        </Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditPress(goal)}
          >
            <FontAwesome5 name="edit" size={16} color="#053559" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteGoal(goal.id)}
          >
            <FontAwesome5 name="trash" size={16} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Hero Section */}
        <ImageBackground
          source={require('../assets/KeanBG.png')}
          style={styles.heroSection}
          resizeMode="cover"
        >
          <View style={styles.heroContent}>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>My Goals</Text>
              <Text style={styles.heroSubtitle}>
                Track your fitness journey
              </Text>
            </View>
          </View>
        </ImageBackground>

        {/* Create Goal Button */}
        <TouchableOpacity
          style={styles.createGoalButton}
          onPress={() => setShowGoalForm(!showGoalForm)}
        >
          <FontAwesome5
            name={showGoalForm ? 'times' : 'plus'}
            size={16}
            color="#fff"
          />
          <Text style={styles.createGoalButtonText}>
            {showGoalForm ? 'Cancel' : 'Create New Goal'}
          </Text>
        </TouchableOpacity>

        {/* Goal Form */}
        {showGoalForm && (
          <View style={styles.goalContainer}>
            <Text style={styles.header}>Set Your Goal</Text>
            <View style={styles.formContainer}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Category</Text>
                <TouchableOpacity
                  style={styles.pickerContainer}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <Text style={styles.pickerText}>
                    {selectedCategory || 'Select Goal Type'}
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedCategory && (
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>Sub-Category</Text>
                  <TouchableOpacity
                    style={styles.pickerContainer}
                    onPress={() => {
                      if (selectedCategory !== 'Select Goal') {
                        setIsEditing(false);
                        setShowSubCategoryModal(true);
                      }
                    }}
                  >
                    <Text style={styles.pickerText}>
                      {subCategory || 'Select Sub-Category'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {selectedCategory === 'Cardio' && (
                <View>
                  <View style={styles.tabContainer}>
                    {['Steps', 'Duration'].map((tab) => (
                      <TouchableOpacity
                        key={tab}
                        style={[
                          styles.tab,
                          cardioType === tab && styles.activeTab,
                        ]}
                        onPress={() => setCardioType(tab)}
                      >
                        <Text
                          style={[
                            styles.tabText,
                            cardioType === tab && styles.activeTabText,
                          ]}
                        >
                          {tab}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {cardioType === 'Steps' ? (
                    <TextInput
                      style={styles.input}
                      placeholder="Enter steps"
                      value={cardioSteps}
                      onChangeText={setCardioSteps}
                      keyboardType="numeric"
                    />
                  ) : (
                    <TextInput
                      style={styles.input}
                      placeholder="Enter duration in minutes"
                      value={cardioDuration}
                      onChangeText={setCardioDuration}
                      keyboardType="numeric"
                    />
                  )}
                </View>
              )}

              {selectedCategory === 'Strength' && (
                <TextInput
                  style={styles.input}
                  placeholder="Number of sessions"
                  value={strengthSessions}
                  onChangeText={setStrengthSessions}
                  keyboardType="numeric"
                />
              )}

              {selectedCategory === 'Yoga' && (
                <TextInput
                  style={styles.input}
                  placeholder="Duration in minutes"
                  value={yogaDuration}
                  onChangeText={setYogaDuration}
                  keyboardType="numeric"
                />
              )}

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Deadline</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <FontAwesome5 name="calendar" size={16} color="#666" />
                  <Text style={styles.dateText}>
                    {goalDeadline
                      ? goalDeadline.toLocaleDateString()
                      : 'Select deadline'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={goalDeadline}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSubmit}
              >
                <View style={styles.saveButtonContent}>
                  <FontAwesome5 name="save" size={18} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Goal</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Goals List */}
        <View style={styles.goalsContainer}>
          {Object.keys(groupedGoals).length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="target" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No goals set yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Create your first goal to get started
              </Text>
            </View>
          ) : (
            Object.entries(groupedGoals).map(([category, goals]) => (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <Text style={styles.goalCount}>{goals.length} goals</Text>
                </View>
                {goals.map((goal) => {
                  const { progress, target, percentage } = checkGoalProgress(
                    goal,
                    activities
                  );
                  const status = computeGoalStatus(goal);
                  const deadline = new Date(goal.deadline);
                  const formattedDeadline = deadline.toLocaleDateString(
                    'en-US',
                    {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }
                  );
                  return (
                    <View key={goal.id} style={styles.goalCard}>
                      <View style={styles.goalHeader}>
                        <View style={styles.goalTitleContainer}>
                          <Text style={styles.goalTitle} numberOfLines={2}>
                            {goal.subCategory || goal.category}
                          </Text>
                          <Text style={styles.goalCategory}>
                            {goal.category}
                          </Text>
                        </View>
                        <View style={styles.goalStatusContainer}>
                          <View
                            style={[styles.statusBadge, getStatusStyle(status)]}
                          >
                            <Text style={styles.statusText}>{status}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.goalProgress}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${percentage}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressText}>
                          {progress} / {target}
                        </Text>
                      </View>
                      <View style={styles.goalFooter}>
                        <Text style={styles.deadlineText}>
                          Due: {formattedDeadline}
                        </Text>
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleEditPress(goal)}
                          >
                            <FontAwesome5
                              name="edit"
                              size={16}
                              color="#053559"
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleDeleteGoal(goal.id)}
                          >
                            <FontAwesome5
                              name="trash"
                              size={16}
                              color="#E74C3C"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add padding to prevent content from being hidden behind the navbar */}
      <View style={styles.navBarContainer}>
        <NavBar />
      </View>

      <CategoryModal />
      <SubCategoryModal />
      {/* Edit Modal */}
      <Modal
        visible={editingGoal !== null}
        transparent={true}
        animationType="slide"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Goal</Text>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Sub-Category</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowEditDropdown(!showEditDropdown)}
                  >
                    <Text style={styles.dropdownButtonText}>
                      {editSubCategory || 'Select Sub-Category'}
                    </Text>
                    <FontAwesome5
                      name={showEditDropdown ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#666"
                    />
                  </TouchableOpacity>

                  {showEditDropdown && (
                    <View style={styles.dropdownList}>
                      {subCategories[editingGoal?.category]?.map((item) => (
                        <TouchableOpacity
                          key={item.value}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setEditSubCategory(item.value);
                            setShowEditDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Target</Text>
                {editingGoal?.category === 'Cardio' && (
                  <View>
                    {editingGoal.cardioSteps !== undefined ? (
                      <TextInput
                        style={styles.input}
                        placeholder="Enter steps"
                        value={editCardioSteps}
                        onChangeText={setEditCardioSteps}
                        keyboardType="numeric"
                        returnKeyType="done"
                        blurOnSubmit={true}
                      />
                    ) : (
                      <TextInput
                        style={styles.input}
                        placeholder="Enter duration in minutes"
                        value={editCardioDuration}
                        onChangeText={setEditCardioDuration}
                        keyboardType="numeric"
                        returnKeyType="done"
                        blurOnSubmit={true}
                      />
                    )}
                  </View>
                )}

                {editingGoal?.category === 'Strength' && (
                  <TextInput
                    style={styles.input}
                    placeholder="Number of sessions"
                    value={editStrengthSessions}
                    onChangeText={setEditStrengthSessions}
                    keyboardType="numeric"
                    returnKeyType="done"
                    blurOnSubmit={true}
                  />
                )}

                {editingGoal?.category === 'Yoga' && (
                  <TextInput
                    style={styles.input}
                    placeholder="Duration in minutes"
                    value={editYogaDuration}
                    onChangeText={setEditYogaDuration}
                    keyboardType="numeric"
                    returnKeyType="done"
                  />
                )}
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Deadline</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <FontAwesome5 name="calendar" size={16} color="#666" />
                  <Text style={styles.dateText}>
                    {editDeadline.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={editDeadline}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setEditDeadline(selectedDate);
                      }
                    }}
                    minimumDate={new Date()}
                  />
                )}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditingGoal(null)}
                >
                  <View style={styles.cancelButtonContent}>
                    <FontAwesome5 name="times" size={18} color="#333" />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveEdit}
                >
                  <View style={styles.saveButtonContent}>
                    <FontAwesome5 name="save" size={18} color="#fff" />
                    <Text style={styles.saveButtonText}>Save</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  heroSection: {
    height: Platform.OS === 'ios' ? 200 : 180,
    marginBottom: 20,
    justifyContent: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20,
    justifyContent: 'center',
  },
  heroTextContainer: {
    maxWidth: '60%',
  },
  heroTitle: {
    fontSize: Platform.OS === 'ios' ? 34 : 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  heroSubtitle: {
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  createGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09355c',
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    borderRadius: 25,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  createGoalButtonText: {
    color: '#fff',
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  goalsContainer: {
    padding: Platform.OS === 'ios' ? 25 : 20,
  },
  categorySection: {
    marginBottom: Platform.OS === 'ios' ? 30 : 25,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryTitle: {
    fontSize: Platform.OS === 'ios' ? 22 : 20,
    fontWeight: 'bold',
    color: '#333',
  },
  goalCount: {
    fontSize: Platform.OS === 'ios' ? 15 : 14,
    color: '#666',
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: Platform.OS === 'ios' ? 20 : 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  goalTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  goalTitle: {
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  goalCategory: {
    fontSize: Platform.OS === 'ios' ? 15 : 14,
    color: '#666',
  },
  goalStatusContainer: {
    flexShrink: 0,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  statusText: {
    fontSize: Platform.OS === 'ios' ? 13 : 12,
    fontWeight: '600',
    color: '#fff',
  },
  goalProgress: {
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginVertical: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 5,
  },
  progressText: {
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    color: '#333',
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineText: {
    fontSize: Platform.OS === 'ios' ? 15 : 14,
    color: '#666',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: 200,
  },
  modalItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
  },
  modalCloseButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#09355c',
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  dropdownContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  navBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  goalContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#09355c',
    marginBottom: 20,
  },
  formContainer: {
    marginBottom: 20,
  },
  formSection: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
  },
  pickerText: {
    fontSize: 16,
    padding: 12,
    color: '#333',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 12,
    fontSize: 16,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#09355c',
    borderRadius: 30,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
  },
  activeTab: {
    backgroundColor: '#09355c',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
  },
});

export default MyGoalsScreen;
