import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDatabase, ref, push, set, onValue, remove } from 'firebase/database';
import { auth } from '../services/firebaseConfig';
import NavBar from '../components/NavBar';
import { setupActivityListener } from '../services/fetchUserActivities';

// Utility to parse dates in MM/DD/YYYY or ISO format
const parseActivityDate = (dateStr) => {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return new Date(parts[2], parts[0] - 1, parts[1]);
  }
  return new Date(dateStr);
};

const MyGoalsScreen = () => {
  // States
  const [selectedCategory, setSelectedCategory] = useState('Select Goal');
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
            const goalsArray = Object.entries(data).map(([id, value]) => ({ id, ...value }));
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

  // Aggregate activity entries for a given goal
  const aggregateActivityForGoal = (goal, categoryActivities) => {
    let aggregated = { steps: 0, duration: 0, sessions: 0 };

    const goalStart = new Date(goal.dateCreated);
    goalStart.setHours(0, 0, 0, 0);
    const goalEnd = new Date(goal.deadline);
    goalEnd.setHours(23, 59, 59, 999);

    Object.values(categoryActivities).forEach((entry) => {
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
            meetsTarget = aggregated.steps >= targetSteps && aggregated.duration >= targetDuration;
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

  // Validate and submit new goal to Firebase
  const handleSubmit = () => {
    const errors = [];

    if (selectedCategory === 'Select Goal') {
      errors.push("Please select a valid goal category.");
    } else {
      if (selectedCategory === 'Cardio') {
        if (cardioType === 'Steps' && cardioSteps.trim() === '') {
          errors.push("Please enter steps.");
        }
        if (cardioType === 'Duration' && cardioDuration.trim() === '') {
          errors.push("Please enter duration.");
        }
      }
      if (selectedCategory === 'Strength' && strengthSessions.trim() === '') {
        errors.push("Please specify the number of Strength sessions.");
      }
      if (selectedCategory === 'Yoga' && yogaDuration.trim() === '') {
        errors.push("Please specify the Yoga duration.");
      }
    }

    if (errors.length > 0) {
      Alert.alert("Validation Error", errors.join('\n'));
      return;
    }

    const db = getDatabase();
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      let goalData = {
        category: selectedCategory,
        deadline: goalDeadline.getTime(),
        dateCreated: new Date().getTime(),
        completed: false,
      };

      switch (selectedCategory) {
        case 'Cardio':
          if (cardioType === 'Steps') {
            goalData = { ...goalData, cardioSteps };
          } else {
            goalData = { ...goalData, cardioDuration };
          }
          break;
        case 'Strength':
          goalData = { ...goalData, strengthSessions };
          break;
        case 'Yoga':
          goalData = { ...goalData, yogaDuration };
          break;
      }

      const goalsRef = ref(db, `Users/${uid}/Goals`);
      const newGoalRef = push(goalsRef);

      set(newGoalRef, goalData)
        .then(() => {
          Alert.alert('Success', 'Goal saved successfully!');
          resetForm();
        })
        .catch((error) => {
          console.error("Failed to save goal data: ", error);
          Alert.alert('Error', 'Failed to save goal. Please try again.');
        });
    }
  };

  // Reset all form fields
  const resetForm = () => {
    setSelectedCategory('Select Goal');
    setGoalDeadline(new Date());
    setCardioSteps('');
    setCardioDuration('');
    setStrengthSessions('');
    setYogaDuration('');
    setShowGoalForm(false);
  };

  // Date picker handler
  const handleDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') return;
    setGoalDeadline(selectedDate || goalDeadline);
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
                .then(() => Alert.alert('Success', 'Goal deleted successfully!'))
                .catch((error) => {
                  console.error('Error deleting goal: ', error);
                  Alert.alert('Error', 'Error deleting goal. Please try again.');
                });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleCompleteGoal = (goal) => {
    const db = getDatabase();
    const user = auth.currentUser;
    if (user) {
      const goalRef = ref(db, `Users/${user.uid}/Goals/${goal.id}`);
      set(goalRef, { ...goal, completed: true })
        .then(() => {
          Alert.alert('Success', 'Goal marked as complete!');
          console.log('Goal marked as complete!');
        })
        .catch((error) => {
          console.error('Error updating goal: ', error);
          Alert.alert('Error', 'Error updating goal: ' + error.message);
        });
    }
  };

  // Group goals by category for display
  const groupedGoals = userGoals.reduce((acc, goal) => {
    const cat = goal.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(goal);
    return acc;
  }, {});

  // Compute goal status based on deadline and completion
  const computeGoalStatus = (goal) => {
    if (goal.completed) return 'Complete';
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const goalDate = new Date(goal.deadline);
    goalDate.setHours(0, 0, 0, 0);
    if (goalDate > currentDate) return 'To Do';
    if (goalDate.getTime() === currentDate.getTime()) return 'Due Today';
    return 'Past Due';
  };

  // Render Cardio input tabs (Steps vs Duration)
  const renderCardioTabs = () => (
    <View style={styles.tabContainer}>
      {['Steps', 'Duration'].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, cardioType === tab && styles.activeTab]}
          onPress={() => setCardioType(tab)}
        >
          <Text style={[styles.tabText, cardioType === tab && styles.activeTabText]}>{tab}</Text>
          {cardioType === tab && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <TouchableOpacity
          style={styles.createGoalButton}
          onPress={() => setShowGoalForm(!showGoalForm)}
        >
          <Text style={styles.createGoalButtonText}>
            {showGoalForm ? 'Cancel' : 'Create a New Goal'}
          </Text>
        </TouchableOpacity>

        {showGoalForm && (
          <View style={styles.goalContainer}>
            <Text style={styles.header}>Set Your Goal</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCategory}
                onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select Goal" value="Select Goal" />
                <Picker.Item label="Cardio" value="Cardio" />
                <Picker.Item label="Strength Training" value="Strength" />
                <Picker.Item label="Yoga" value="Yoga" />
              </Picker>
            </View>

            <View style={styles.formContainer}>
              {selectedCategory === 'Cardio' && (
                <View>
                  {renderCardioTabs()}
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

              <View style={styles.dateFieldContainer}>
                <Text style={styles.dateLabel}>Select a Due Date</Text>
                <DateTimePicker
                  value={goalDeadline}
                  mode="date"
                  display="default"
                  minimumDate={todayDate}
                  onChange={handleDateChange}
                />
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Save Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.existingGoalsContainer}>
          {Object.keys(groupedGoals).length === 0 ? (
            <Text style={styles.noGoalsText}>No goals set yet.</Text>
          ) : (
            Object.entries(groupedGoals).map(([category, goals]) => (
              <View key={category}>
                <Text style={styles.header}>{category} Goals</Text>
                {goals.map((goal) => {
                  const aggregated = aggregateActivityForGoal(goal, activities[goal.category] || {});
                  return (
                    <View key={goal.id} style={styles.goalItem}>
                      <Text style={styles.goalText}>{goal.category} Goal</Text>
                      <Text style={styles.goalStatus}>{computeGoalStatus(goal)}</Text>
                      <Text style={styles.deadlineText}>
                        Deadline: {new Date(goal.deadline).toLocaleDateString()}
                      </Text>
                      {goal.category === 'Cardio' && (
                        <Text style={styles.progressText}>
                        {goal.cardioSteps 
                          ? `Steps: ${aggregated.steps} / ${goal.cardioSteps}` 
                          : `Duration: ${aggregated.duration.toFixed(1)} / ${goal.cardioDuration} mins`
                        }
                      </Text>
                      )}
                      {goal.category === 'Strength' && (
                        <Text style={styles.progressText}>
                          Sessions: {aggregated.sessions} / {goal.strengthSessions}
                        </Text>
                      )}
                      {goal.category === 'Yoga' && (
                        <Text style={styles.progressText}>
                          Duration: {aggregated.duration.toFixed(1)} / {goal.yogaDuration} mins
                        </Text>
                      )}
                      {!goal.completed && (
                        <TouchableOpacity style={styles.completeButton} onPress={() => handleCompleteGoal(goal)}>
                          <Text style={styles.buttonText}>Mark as Complete</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteGoal(goal.id)}>
                        <Text style={styles.buttonText}>Delete Goal</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </View>
      </ScrollView>
      <NavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollContainer: {
    paddingBottom: 90,
    paddingHorizontal: 15,
  },
  createGoalButton: {
    backgroundColor: '#09355c',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    marginBottom: 25,
    alignItems: 'center',
  },
  createGoalButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  goalContainer: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#09355c',
    marginBottom: 15,
  },
  pickerContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginBottom: 15,
  },
  picker: {
    width: '100%',
  },
  formContainer: {
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  dateFieldContainer: {
    marginBottom: 15,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09355c',
    marginBottom: 5,
  },
  saveButton: {
    backgroundColor: '#09355c',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  existingGoalsContainer: {
    marginBottom: 30,
  },
  noGoalsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 15,
  },
  goalItem: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 6,
    borderLeftColor: '#09355c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  goalText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#09355c',
    marginBottom: 4,
  },
  goalStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  deadlineText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 15,
    color: '#0c4f8a',
    fontWeight: '600',
    marginBottom: 8,
  },
  completeButton: {
    backgroundColor: '#4caf50',
    marginTop: 5,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
    marginTop: 5,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'space-around',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#e5e5e5',
  },
  activeTab: {
    backgroundColor: '#09355c',
  },
  tabText: {
    color: '#09355c',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  activeIndicator: {
    marginTop: 4,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
});

export default MyGoalsScreen;
