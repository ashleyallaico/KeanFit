

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDatabase, ref, push, set, onValue, remove } from 'firebase/database';
import { auth } from '../services/firebaseConfig';
import NavBar from '../components/NavBar';
import { setupActivityListener } from '../services/fetchUserActivities';

const parseActivityDate = (dateStr) => {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return new Date(parts[2], parts[0] - 1, parts[1]);
  }
  return new Date(dateStr);
};

const MyGoalsScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('Select Goal');
  const [goalDeadline, setGoalDeadline] = useState(new Date());
  const [cardioSteps, setCardioSteps] = useState('');
  const [cardioDuration, setCardioDuration] = useState('');
  const [yogaDuration, setYogaDuration] = useState('');
  const [strengthSessions, setStrengthSessions] = useState('');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [userGoals, setUserGoals] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sortOption, setSortOption] = useState('deadline');
  const [activities, setActivities] = useState({});
  const todayDate = new Date();

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

  useEffect(() => {
    const unsubscribe = setupActivityListener(setActivities);
    return () => unsubscribe();
  }, []);

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
          aggregated.sessions += 1; // Count each log as a session
        } else if (goal.category === 'Yoga') {
          aggregated.duration += (Number(entry.yogaDuration) || 0) / 60;
        }
      }
    });
    return aggregated;
  };

  useEffect(() => {
    if (!activities || userGoals.length === 0) return;

    userGoals.forEach((goal) => {
      if (!goal.completed) {
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

        if (meetsTarget) handleCompleteGoal(goal);
      }
    });
  }, [userGoals, activities]);

  const handleSubmit = () => {
    if (selectedCategory === 'Select Goal') return alert("Please select a valid goal category.");
    if (selectedCategory === 'Cardio') {
      const hasSteps = cardioSteps.trim() !== '';
      const hasDuration = cardioDuration.trim() !== '';
      if ((hasSteps && hasDuration) || (!hasSteps && !hasDuration)) {
        return alert("Please provide either steps OR duration for Cardio — not both.");
      }
      return alert("Please provide either steps or duration for Cardio.");
    }
    if (selectedCategory === 'Strength' && strengthSessions.trim() === '')
      return alert("Please specify the number of Strength sessions.");
    if (selectedCategory === 'Yoga' && yogaDuration.trim() === '')
      return alert("Please specify the Yoga duration.");

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
          goalData = { ...goalData, cardioSteps, cardioDuration };
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
          alert('Goal saved successfully!');
          resetForm();
        })
        .catch((error) => {
          console.error("Failed to save goal data: ", error);
          alert('Failed to save goal. Please try again.');
        });
    }
  };

  const resetForm = () => {
    setSelectedCategory('Select Goal');
    setGoalDeadline(new Date());
    setCardioSteps('');
    setCardioDuration('');
    setStrengthSessions('');
    setYogaDuration('');
    setShowGoalForm(false);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setGoalDeadline(selectedDate);
  };

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
                .then(() => alert('Goal deleted successfully!'))
                .catch((error) => {
                  console.error('Error deleting goal: ', error);
                  alert('Error deleting goal. Please try again.');
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
        .then(() => console.log('Goal marked as complete!'))
        .catch((error) => {
          console.error('Error updating goal: ', error);
        });
    }
  };

  const groupedGoals = userGoals.reduce((acc, goal) => {
    const cat = goal.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(goal);
    return acc;
  }, {});

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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <TouchableOpacity
          style={styles.createGoalButton}
          onPress={() => setShowGoalForm(!showGoalForm)}>
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
                onValueChange={setSelectedCategory}
                style={styles.picker}>
                <Picker.Item label="Select Goal" value="Select Goal" />
                <Picker.Item label="Cardio" value="Cardio" />
                <Picker.Item label="Strength Training" value="Strength" />
                <Picker.Item label="Yoga" value="Yoga" />
              </Picker>
            </View>

            <View style={styles.formContainer}>
              {selectedCategory === 'Cardio' && (
                <View>
                  <TextInput
                    style={styles.input}
                    placeholder="Steps (optional)"
                    value={cardioSteps}
                    onChangeText={(text) => {
                      setCardioSteps(text);
                      if (text) setCardioDuration('');
                    }}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Duration in minutes (optional)"
                    value={cardioDuration}
                    onChangeText={(text) => {
                      setCardioDuration(text);
                      if (text) setCardioSteps('');
                    }}
                    keyboardType="numeric"
                  />
                  <Text style={{ color: '#777', marginBottom: 10 }}>
                    * Enter either steps OR duration, not both.
                  </Text>
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
              <Button title="Save Goal" onPress={handleSubmit} />
            </View>
          </View>
        )}

        <View style={styles.existingGoalsContainer}>
          {Object.keys(groupedGoals).length === 0 ? (
            <Text>No goals set yet.</Text>
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
                      <Text>Deadline: {new Date(goal.deadline).toLocaleDateString()}</Text>

                      {goal.category === 'Cardio' && (
                        <Text style={styles.progressText}>
                          Steps: {aggregated.steps} / {goal.cardioSteps || '—'} | Duration: {aggregated.duration.toFixed(1)} / {goal.cardioDuration || '—'} mins
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
                        <Button title="Mark as Complete" onPress={() => handleCompleteGoal(goal)} />
                      )}
                      <Button title="Delete Goal" onPress={() => handleDeleteGoal(goal.id)} />
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
  container: { flex: 1 },
  scrollContainer: { paddingBottom: 70 },
  createGoalButton: {
    backgroundColor: '#09355c',
    padding: 10,
    borderRadius: 5,
    margin: 10,
  },
  createGoalButtonText: { color: 'white', textAlign: 'center', fontSize: 18 },
  goalContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 5,
  },
  header: { fontSize: 22, fontWeight: 'bold', color: '#09355c', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  pickerContainer: { marginBottom: 20 },
  formContainer: { marginBottom: 20 },
  dateFieldContainer: { marginBottom: 15 },
  dateLabel: { fontSize: 16 },
  goalItem: {
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginVertical: 5,
  },
  goalText: { fontSize: 18, fontWeight: 'bold' },
  goalStatus: { fontSize: 14, fontStyle: 'italic' },
  progressText: { marginTop: 5, fontSize: 16, color: '#09355c' },
  existingGoalsContainer: { margin: 10 },
});

export default MyGoalsScreen;

