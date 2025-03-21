// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, TextInput, Button, ScrollView, TouchableOpacity } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import { getDatabase, ref, push, set, onValue, remove } from 'firebase/database';
// import { auth } from '../services/firebaseConfig';
// import NavBar from '../components/NavBar';

// const MyGoalsScreen = () => {
//     const [selectedCategory, setSelectedCategory] = useState('Select Goal');
//     const [goalDeadline, setGoalDeadline] = useState(new Date());
//     const [reps, setReps] = useState('');
//     const [sets, setSets] = useState('');
//     const [weight, setWeight] = useState('');
//     const [cardioSteps, setCardioSteps] = useState('');
//     const [cardioDuration, setCardioDuration] = useState('');
//     const [yogaDuration, setYogaDuration] = useState('');
//     const [showGoalForm, setShowGoalForm] = useState(false);
//     const [userGoals, setUserGoals] = useState([]);
//     const [showDatePicker, setShowDatePicker] = useState(false);

//     // New state to choose sort option ("deadline" or "status")
//     const [sortOption, setSortOption] = useState('deadline');

//     const todayDate = new Date();

//     // Helper function to compute goal status based on deadline and completion
//     const computeGoalStatus = (goal) => {
//         if (goal.completed) return 'Complete';
//         const currentDate = new Date();
//         currentDate.setHours(0, 0, 0, 0);
//         const goalDate = new Date(goal.deadline);
//         goalDate.setHours(0, 0, 0, 0);
//         if (goalDate > currentDate) return 'To Do';
//         if (goalDate.getTime() === currentDate.getTime()) return 'Due Today';
//         return 'Past Due';
//     };

//     // Fetch goals from Firebase
//     useEffect(() => {
//         const fetchGoals = async () => {
//             const db = getDatabase();
//             const user = auth.currentUser;
//             if (user) {
//                 const goalsRef = ref(db, `Users/${user.uid}/Goals`);
//                 onValue(goalsRef, (snapshot) => {
//                     if (snapshot.exists()) {
//                         const data = snapshot.val();
//                         const goalsArray = [];
//                         for (const goalId in data) {
//                             goalsArray.push({ id: goalId, ...data[goalId] });
//                         }
//                         setUserGoals(goalsArray);
//                     } else {
//                         setUserGoals([]);
//                     }
//                 });
//             }
//         };
//         fetchGoals();
//     }, []);

//     const handleSubmit = () => {
//         // Validate required fields based on selected category
//         if (selectedCategory === 'Select Goal') {
//             alert("Please select a valid goal category.");
//             return;
//         }
//         if (selectedCategory === 'Cardio') {
//             if (cardioSteps.trim() === "" || cardioDuration.trim() === "") {
//                 alert("Please fill out all required fields for a Cardio goal.");
//                 return;
//             }
//         }
//         if (selectedCategory === 'Strength') {
//             if (reps.trim() === "" || sets.trim() === "" || weight.trim() === "") {
//                 alert("Please fill out all required fields for a Strength goal.");
//                 return;
//             }
//         }
//         if (selectedCategory === 'Yoga') {
//             if (yogaDuration.trim() === "") {
//                 alert("Please fill out the required field for a Yoga goal.");
//                 return;
//             }
//         }

//         const db = getDatabase();
//         const user = auth.currentUser;

//         if (user) {
//             const uid = user.uid;
//             // Save deadline and creation date as numeric timestamps; add a "completed" flag
//             let goalData = {
//                 category: selectedCategory,
//                 deadline: goalDeadline.getTime(),
//                 dateCreated: new Date().getTime(),
//                 completed: false,  // new field to track if the goal is complete
//             };

//             // Add extra fields based on the selected category
//             switch (selectedCategory) {
//                 case 'Cardio':
//                     goalData = { ...goalData, cardioSteps, cardioDuration };
//                     break;
//                 case 'Strength':
//                     goalData = { ...goalData, reps, sets, weight };
//                     break;
//                 case 'Yoga':
//                     goalData = { ...goalData, yogaDuration };
//                     break;
//                 default:
//                     break;
//             }

//             const goalsRef = ref(db, `Users/${uid}/Goals`);
//             const newGoalRef = push(goalsRef);

//             set(newGoalRef, goalData)
//                 .then(() => {
//                     console.log("Goal saved successfully!");
//                     alert('Goal saved successfully!');
//                     resetForm();
//                 })
//                 .catch((error) => {
//                     console.error("Failed to save goal data: ", error);
//                     alert('Failed to save goal. Please try again.');
//                 });
//         } else {
//             alert('No user is logged in. Please log in to set your goal.');
//         }
//     };

//     const resetForm = () => {
//         setSelectedCategory('Select Goal');
//         setGoalDeadline(new Date());
//         setReps('');
//         setSets('');
//         setWeight('');
//         setCardioSteps('');
//         setCardioDuration('');
//         setYogaDuration('');
//         setShowGoalForm(false);
//     };

//     const handleDateChange = (event, selectedDate) => {
//         setShowDatePicker(false);
//         if (selectedDate) {
//             setGoalDeadline(selectedDate);
//         }
//     };

//     const showDatepicker = () => {
//         setShowDatePicker(true);
//     };

//     // Use the same renderGoalStatus function to display deadline info visually
//     const renderGoalStatus = (deadlineTimestamp, completed) => {
//         // If the goal is marked complete, display that
//         if (completed) {
//             return <Text style={[styles.goalStatus, { color: 'blue' }]}>Complete</Text>;
//         }
//         const currentDate = new Date();
//         currentDate.setHours(0, 0, 0, 0);
//         const goalDate = new Date(deadlineTimestamp);
//         goalDate.setHours(0, 0, 0, 0);
//         const timeDiff = goalDate - currentDate;
//         const daysRemaining = Math.round(timeDiff / (1000 * 3600 * 24));

//         let statusText = '';
//         let statusColor = 'green';
//         if (daysRemaining > 0) {
//             statusText = `${daysRemaining} days remaining`;
//         } else if (daysRemaining === 0) {
//             statusText = 'Goal deadline is today';
//             statusColor = 'orange';
//         } else {
//             statusText = 'Goal deadline has passed';
//             statusColor = 'red';
//         }
//         return <Text style={[styles.goalStatus, { color: statusColor }]}>{statusText}</Text>;
//     };

//     // New function to update a goal as complete
//     const handleCompleteGoal = (goal) => {
//         const db = getDatabase();
//         const user = auth.currentUser;
//         if (user) {
//             const goalRef = ref(db, `Users/${user.uid}/Goals/${goal.id}`);
//             // Update the goal object to set completed to true
//             set(goalRef, { ...goal, completed: true })
//                 .then(() => {
//                     console.log('Goal marked as complete!');
//                     alert('Goal marked as complete!');
//                 })
//                 .catch((error) => {
//                     console.error('Error updating goal: ', error);
//                     alert('Failed to update goal. Please try again.');
//                 });
//         }
//     };

//     // Group goals by category
//     const groupedGoals = userGoals.reduce((acc, goal) => {
//         const cat = goal.category;
//         if (!acc[cat]) acc[cat] = [];
//         acc[cat].push(goal);
//         return acc;
//     }, {});

//     // Define an order for status grouping when sorting by status
//     const statusOrder = {
//         'To Do': 0,
//         'Due Today': 1,
//         'Past Due': 2,
//         'Complete': 3,
//     };

//     return (
//         <View style={styles.container}>
//             <ScrollView style={styles.scrollContainer}>
//                 <TouchableOpacity
//                     style={styles.createGoalButton}
//                     onPress={() => setShowGoalForm(!showGoalForm)}>
//                     <Text style={styles.createGoalButtonText}>
//                         {showGoalForm ? 'Cancel' : 'Create a New Goal'}
//                     </Text>
//                 </TouchableOpacity>

//                 {showGoalForm && (
//                     <View style={styles.goalContainer}>
//                         <Text style={styles.header}>Set Your Goal</Text>
//                         <View style={styles.pickerContainer}>
//                             <Picker
//                                 selectedValue={selectedCategory}
//                                 onValueChange={(itemValue) => setSelectedCategory(itemValue)}
//                                 style={styles.picker}>
//                                 <Picker.Item label="Select Goal" value="Select Goal" />
//                                 <Picker.Item label="Cardio" value="Cardio" />
//                                 <Picker.Item label="Strength Training" value="Strength" />
//                                 <Picker.Item label="Yoga" value="Yoga" />
//                             </Picker>
//                         </View>

//                         <View style={styles.formContainer}>
//                             {selectedCategory === 'Select Goal' && (
//                                 <Text style={styles.header}>Please Select a Goal Category</Text>
//                             )}
//                             {selectedCategory === 'Cardio' && (
//                                 <View>
//                                     <TextInput
//                                         style={styles.input}
//                                         placeholder="Enter the number of steps"
//                                         value={cardioSteps}
//                                         onChangeText={setCardioSteps}
//                                         keyboardType="numeric"
//                                     />
//                                     <TextInput
//                                         style={styles.input}
//                                         placeholder="Enter duration in minutes"
//                                         value={cardioDuration}
//                                         onChangeText={setCardioDuration}
//                                         keyboardType="numeric"
//                                     />
//                                     <View style={styles.dateFieldContainer}>
//                                         <Text style={styles.dateLabel}>Select a Due Date (Future Date Only)</Text>
//                                         <DateTimePicker
//                                             value={goalDeadline}
//                                             mode="date"
//                                             display="default"
//                                             minimumDate={todayDate}
//                                             onChange={handleDateChange}
//                                         />
//                                     </View>
//                                     <Button title="Save Goal" onPress={handleSubmit} />
//                                 </View>
//                             )}

//                             {selectedCategory === 'Strength' && (
//                                 <View>
//                                     <TextInput
//                                         style={styles.input}
//                                         placeholder="Enter repetitions"
//                                         value={reps}
//                                         onChangeText={setReps}
//                                         keyboardType="numeric"
//                                     />
//                                     <TextInput
//                                         style={styles.input}
//                                         placeholder="Enter sets"
//                                         value={sets}
//                                         onChangeText={setSets}
//                                         keyboardType="numeric"
//                                     />
//                                     <TextInput
//                                         style={styles.input}
//                                         placeholder="Enter weight (kg)"
//                                         value={weight}
//                                         onChangeText={setWeight}
//                                         keyboardType="numeric"
//                                     />
//                                     <View style={styles.dateFieldContainer}>
//                                         <Text style={styles.dateLabel}>Select a Due Date (Future Date Only)</Text>
//                                         <DateTimePicker
//                                             value={goalDeadline}
//                                             mode="date"
//                                             display="default"
//                                             minimumDate={todayDate}
//                                             onChange={handleDateChange}
//                                         />
//                                     </View>
//                                     <Button title="Save Goal" onPress={handleSubmit} />
//                                 </View>
//                             )}

//                             {selectedCategory === 'Yoga' && (
//                                 <View>
//                                     <TextInput
//                                         style={styles.input}
//                                         placeholder="Enter duration in minutes"
//                                         value={yogaDuration}
//                                         onChangeText={setYogaDuration}
//                                         keyboardType="numeric"
//                                     />
//                                     <View style={styles.dateFieldContainer}>
//                                         <Text style={styles.dateLabel}>Select a Due Date (Future Date Only)</Text>
//                                         <DateTimePicker
//                                             value={goalDeadline}
//                                             mode="date"
//                                             display="default"
//                                             minimumDate={todayDate}
//                                             onChange={handleDateChange}
//                                         />
//                                     </View>
//                                     <Button title="Save Goal" onPress={handleSubmit} />
//                                 </View>
//                             )}
//                         </View>
//                     </View>
//                 )}

//                 {/* New Sort Option UI */}
//                 <View style={styles.sortOptionsContainer}>
//                     <Text style={styles.sortLabel}>Sort Goals By:</Text>
//                     <Picker
//                         selectedValue={sortOption}
//                         onValueChange={(itemValue) => setSortOption(itemValue)}
//                         style={styles.picker}>
//                         <Picker.Item label="Deadline" value="deadline" />
//                         <Picker.Item label="Status" value="status" />
//                     </Picker>
//                 </View>

//                 {/* Display grouped goals by category */}
//                 <View style={styles.existingGoalsContainer}>
//                     {Object.keys(groupedGoals).length === 0 ? (
//                         <Text>No goals set yet.</Text>
//                     ) : (
//                         Object.keys(groupedGoals).map((category) => {
//                             // Sort goals based on the chosen option
//                             let sortedGoals = [];
//                             if (sortOption === 'deadline') {
//                                 sortedGoals = groupedGoals[category].sort((a, b) => a.deadline - b.deadline);
//                             } else if (sortOption === 'status') {
//                                 sortedGoals = groupedGoals[category].sort((a, b) =>
//                                     statusOrder[computeGoalStatus(a)] - statusOrder[computeGoalStatus(b)] ||
//                                     (a.deadline - b.deadline)
//                                 );
//                             }
//                             return (
//                                 <View key={category}>
//                                     <Text style={styles.header}>{category} Goals</Text>
//                                     {sortedGoals.map((goal) => (
//                                         <View key={goal.id} style={styles.goalItem}>
//                                             <Text style={styles.goalText}>{goal.category} Goal</Text>
//                                             {renderGoalStatus(goal.deadline, goal.completed)}
//                                             <Text>Deadline: {new Date(goal.deadline).toLocaleDateString()}</Text>
//                                             {/* If the goal is not complete, offer a button to mark it complete */}
//                                             {!goal.completed && (
//                                                 <Button title="Mark as Complete" onPress={() => handleCompleteGoal(goal)} />
//                                             )}
//                                             <Button title="Delete Goal" onPress={() => handleDeleteGoal(goal.id)} />
//                                         </View>
//                                     ))}
//                                 </View>
//                             );
//                         })
//                     )}
//                 </View>
//             </ScrollView>

//             <NavBar />
//         </View>
//     );
// };

// // Existing styles are kept intact and new ones are added without affecting existing layout too much
// const styles = StyleSheet.create({
//     container: { flex: 1 },
//     scrollContainer: { flexGrow: 1, paddingBottom: 70 },
//     createGoalButton: {
//         backgroundColor: '#09355c',
//         padding: 10,
//         borderRadius: 5,
//         margin: 10,
//     },
//     createGoalButtonText: { color: 'white', textAlign: 'center', fontSize: 18 },
//     goalContainer: {
//         marginTop: 20,
//         padding: 10,
//         backgroundColor: '#fff',
//         borderRadius: 10,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.25,
//         shadowRadius: 3.84,
//         elevation: 5,
//     },
//     header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#09355c' },
//     input: {
//         height: 40,
//         marginBottom: 12,
//         borderWidth: 1,
//         padding: 10,
//         borderRadius: 5,
//         borderColor: '#ccc',
//         backgroundColor: '#fff',
//     },
//     pickerContainer: { marginBottom: 20 },
//     formContainer: { marginBottom: 20 },
//     dateFieldContainer: { marginVertical: 10 },
//     dateLabel: { fontSize: 16, marginBottom: 5 },
//     dateText: { fontSize: 16, color: '#09355c' },
//     existingGoalsContainer: {
//         marginTop: 30,
//         padding: 10,
//         backgroundColor: '#f4f4f4',
//         borderRadius: 10,
//     },
//     goalItem: {
//         marginBottom: 15,
//         padding: 10,
//         backgroundColor: '#e0e0e0',
//         borderRadius: 5,
//     },
//     goalText: { fontSize: 18, fontWeight: 'bold' },
//     goalStatus: { fontSize: 14, fontStyle: 'italic' },
//     // New styles for sort options
//     sortOptionsContainer: { margin: 10 },
//     sortLabel: { fontSize: 16, fontWeight: 'bold' },
// });

// export default MyGoalsScreen;
// ///////////////////////////////////////////////////

// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, TextInput, Button, ScrollView, TouchableOpacity } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import { getDatabase, ref, push, set, onValue, remove } from 'firebase/database';
// import { auth } from '../services/firebaseConfig';
// import NavBar from '../components/NavBar';
// // Import the activity listener function
// import { setupActivityListener } from '../services/fetchUserActivities';

// // Helper: Parse an activity date stored as a locale string (e.g., "3/21/2025")
// const parseActivityDate = (dateStr) => {
//   // Attempt to split assuming MM/DD/YYYY
//   const parts = dateStr.split('/');
//   if (parts.length === 3) {
//     // Note: new Date(year, monthIndex, day)
//     return new Date(parts[2], parts[0] - 1, parts[1]);
//   }
//   return new Date(dateStr);
// };

// const MyGoalsScreen = () => {
//   const [selectedCategory, setSelectedCategory] = useState('Select Goal');
//   const [goalDeadline, setGoalDeadline] = useState(new Date());
//   const [reps, setReps] = useState('');
//   const [sets, setSets] = useState('');
//   const [weight, setWeight] = useState('');
//   const [cardioSteps, setCardioSteps] = useState('');
//   const [cardioDuration, setCardioDuration] = useState('');
//   const [yogaDuration, setYogaDuration] = useState('');
//   const [showGoalForm, setShowGoalForm] = useState(false);
//   const [userGoals, setUserGoals] = useState([]);
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   // New state for sort option ("deadline" or "status")
//   const [sortOption, setSortOption] = useState('deadline');
//   // New state for user activities retrieved from the activity listener
//   const [activities, setActivities] = useState({});

//   const todayDate = new Date();

//   // -------------------------------
//   // Fetch goals from Firebase
//   // -------------------------------
//   useEffect(() => {
//     const fetchGoals = async () => {
//       const db = getDatabase();
//       const user = auth.currentUser;
//       if (user) {
//         const goalsRef = ref(db, `Users/${user.uid}/Goals`);
//         onValue(goalsRef, (snapshot) => {
//           if (snapshot.exists()) {
//             const data = snapshot.val();
//             const goalsArray = [];
//             for (const goalId in data) {
//               goalsArray.push({ id: goalId, ...data[goalId] });
//             }
//             setUserGoals(goalsArray);
//           } else {
//             setUserGoals([]);
//           }
//         });
//       }
//     };
//     fetchGoals();
//   }, []);

//   // -------------------------------
//   // Set up listener for user activities
//   // -------------------------------
//   useEffect(() => {
//     const unsubscribe = setupActivityListener(setActivities);
//     return () => unsubscribe();
//   }, []);

//   // -------------------------------
//   // Helper: Aggregate activity for a given goal over its active period
//   // -------------------------------
//   const aggregateActivityForGoal = (goal, categoryActivities) => {
//     let aggregated = { steps: 0, duration: 0, reps: 0 };

//     // Normalize the goal start (dateCreated) and goal end (deadline) to cover the full days.
//     const goalStart = new Date(goal.dateCreated);
//     goalStart.setHours(0, 0, 0, 0);
//     const goalEnd = new Date(goal.deadline);
//     goalEnd.setHours(23, 59, 59, 999);

//     Object.values(categoryActivities).forEach((entry) => {
//       // Use our helper to parse the stored locale date string
//       const entryDate = parseActivityDate(entry.date);
//       entryDate.setHours(0, 0, 0, 0);

//       // Check if the entry falls within the goal period
//       if (entryDate.getTime() >= goalStart.getTime() && entryDate.getTime() <= goalEnd.getTime()) {
//         if (goal.category === 'Cardio') {
//           aggregated.steps += Number(entry.steps) || 0;
//           aggregated.duration += Number(entry.cardioDuration) || 0;
//         } else if (goal.category === 'Strength') {
//           aggregated.reps += Number(entry.reps) || 0;
//         } else if (goal.category === 'Yoga') {
//           aggregated.duration += Number(entry.yogaDuration) || 0;
//         }
//       }
//     });
//     return aggregated;
//   };

//   // -------------------------------
//   // Auto-update goals based on user activity aggregation
//   // -------------------------------
//   useEffect(() => {
//     // Only run if both goals and activities have been loaded
//     if (!activities || userGoals.length === 0) return;

//     userGoals.forEach((goal) => {
//       // Only process goals that are not already complete
//       if (!goal.completed) {
//         // Get the activities for this goal's category; if none, use an empty object
//         const categoryActivities = activities[goal.category] || {};
//         const aggregated = aggregateActivityForGoal(goal, categoryActivities);

//         let meetsTarget = false;
//         if (goal.category === 'Cardio') {
//           const targetSteps = Number(goal.cardioSteps) || 0;
//           const targetDuration = Number(goal.cardioDuration) || 0;
//           if (targetSteps > 0 && targetDuration > 0) {
//             if (aggregated.steps >= targetSteps && aggregated.duration >= targetDuration) {
//               meetsTarget = true;
//             }
//           } else if (targetSteps > 0) {
//             if (aggregated.steps >= targetSteps) {
//               meetsTarget = true;
//             }
//           } else if (targetDuration > 0) {
//             if (aggregated.duration >= targetDuration) {
//               meetsTarget = true;
//             }
//           }
//         } else if (goal.category === 'Strength') {
//           const targetReps = Number(goal.reps) || 0;
//           if (targetReps > 0 && aggregated.reps >= targetReps) {
//             meetsTarget = true;
//           }
//         } else if (goal.category === 'Yoga') {
//           const targetDuration = Number(goal.yogaDuration) || 0;
//           if (targetDuration > 0 && aggregated.duration >= targetDuration) {
//             meetsTarget = true;
//           }
//         }
//         // If the aggregated activity meets or exceeds the target, mark the goal as complete
//         if (meetsTarget) {
//           handleCompleteGoal(goal);
//         }
//       }
//     });
//   }, [userGoals, activities]);

//   // -------------------------------
//   // Save new goal to Firebase
//   // -------------------------------
//   const handleSubmit = () => {
//     if (selectedCategory === 'Select Goal') {
//       alert("Please select a valid goal category.");
//       return;
//     }
//     if (selectedCategory === 'Cardio') {
//       if (cardioSteps.trim() === "" || cardioDuration.trim() === "") {
//         alert("Please fill out all required fields for a Cardio goal.");
//         return;
//       }
//     }
//     if (selectedCategory === 'Strength') {
//       if (reps.trim() === "" || sets.trim() === "" || weight.trim() === "") {
//         alert("Please fill out all required fields for a Strength goal.");
//         return;
//       }
//     }
//     if (selectedCategory === 'Yoga') {
//       if (yogaDuration.trim() === "") {
//         alert("Please fill out the required field for a Yoga goal.");
//         return;
//       }
//     }

//     const db = getDatabase();
//     const user = auth.currentUser;
//     if (user) {
//       const uid = user.uid;
//       // Save deadline and creation date as numeric timestamps; add a "completed" flag
//       let goalData = {
//         category: selectedCategory,
//         deadline: goalDeadline.getTime(),
//         dateCreated: new Date().getTime(),
//         completed: false,
//       };

//       // Add extra fields based on the selected category
//       switch (selectedCategory) {
//         case 'Cardio':
//           goalData = { ...goalData, cardioSteps, cardioDuration };
//           break;
//         case 'Strength':
//           goalData = { ...goalData, reps, sets, weight };
//           break;
//         case 'Yoga':
//           goalData = { ...goalData, yogaDuration };
//           break;
//         default:
//           break;
//       }

//       const goalsRef = ref(db, `Users/${uid}/Goals`);
//       const newGoalRef = push(goalsRef);

//       set(newGoalRef, goalData)
//         .then(() => {
//           console.log("Goal saved successfully!");
//           alert('Goal saved successfully!');
//           resetForm();
//         })
//         .catch((error) => {
//           console.error("Failed to save goal data: ", error);
//           alert('Failed to save goal. Please try again.');
//         });
//     } else {
//       alert('No user is logged in. Please log in to set your goal.');
//     }
//   };

//   // -------------------------------
//   // Reset the form
//   // -------------------------------
//   const resetForm = () => {
//     setSelectedCategory('Select Goal');
//     setGoalDeadline(new Date());
//     setReps('');
//     setSets('');
//     setWeight('');
//     setCardioSteps('');
//     setCardioDuration('');
//     setYogaDuration('');
//     setShowGoalForm(false);
//   };

//   // -------------------------------
//   // Handle date change for deadline
//   // -------------------------------
//   const handleDateChange = (event, selectedDate) => {
//     setShowDatePicker(false);
//     if (selectedDate) {
//       setGoalDeadline(selectedDate);
//     }
//   };

//   const showDatepicker = () => {
//     setShowDatePicker(true);
//   };

//   // -------------------------------
//   // Render the goal's status display (deadline info or completion)
//   // -------------------------------
//   const renderGoalStatus = (deadlineTimestamp, completed) => {
//     if (completed) {
//       return <Text style={[styles.goalStatus, { color: 'blue' }]}>Complete</Text>;
//     }
//     const currentDate = new Date();
//     currentDate.setHours(0, 0, 0, 0);
//     const goalDate = new Date(deadlineTimestamp);
//     goalDate.setHours(0, 0, 0, 0);
//     const timeDiff = goalDate - currentDate;
//     const daysRemaining = Math.round(timeDiff / (1000 * 3600 * 24));

//     let statusText = '';
//     let statusColor = 'green';
//     if (daysRemaining > 0) {
//       statusText = `${daysRemaining} days remaining`;
//     } else if (daysRemaining === 0) {
//       statusText = 'Goal deadline is today';
//       statusColor = 'orange';
//     } else {
//       statusText = 'Goal deadline has passed';
//       statusColor = 'red';
//     }
//     return <Text style={[styles.goalStatus, { color: statusColor }]}>{statusText}</Text>;
//   };

//   // -------------------------------
//   // Mark a goal as complete (updates Firebase)
//   // -------------------------------
//   const handleCompleteGoal = (goal) => {
//     const db = getDatabase();
//     const user = auth.currentUser;
//     if (user) {
//       const goalRef = ref(db, `Users/${user.uid}/Goals/${goal.id}`);
//       set(goalRef, { ...goal, completed: true })
//         .then(() => {
//           console.log('Goal marked as complete!');
//           alert('Goal marked as complete!');
//         })
//         .catch((error) => {
//           console.error('Error updating goal: ', error);
//           alert('Failed to update goal. Please try again.');
//         });
//     }
//   };

//   // -------------------------------
//   // Group goals by category
//   // -------------------------------
//   const groupedGoals = userGoals.reduce((acc, goal) => {
//     const cat = goal.category;
//     if (!acc[cat]) acc[cat] = [];
//     acc[cat].push(goal);
//     return acc;
//   }, {});

//   // Define an order for status grouping when sorting by status
//   const statusOrder = {
//     'To Do': 0,
//     'Due Today': 1,
//     'Past Due': 2,
//     'Complete': 3,
//   };

//   // A helper to compute a simple status for sorting if needed.
//   const computeGoalStatus = (goal) => {
//     if (goal.completed) return 'Complete';
//     const currentDate = new Date();
//     currentDate.setHours(0, 0, 0, 0);
//     const goalDate = new Date(goal.deadline);
//     goalDate.setHours(0, 0, 0, 0);
//     if (goalDate > currentDate) return 'To Do';
//     if (goalDate.getTime() === currentDate.getTime()) return 'Due Today';
//     return 'Past Due';
//   };

//   return (
//     <View style={styles.container}>
//       <ScrollView style={styles.scrollContainer}>
//         <TouchableOpacity
//           style={styles.createGoalButton}
//           onPress={() => setShowGoalForm(!showGoalForm)}>
//           <Text style={styles.createGoalButtonText}>
//             {showGoalForm ? 'Cancel' : 'Create a New Goal'}
//           </Text>
//         </TouchableOpacity>

//         {showGoalForm && (
//           <View style={styles.goalContainer}>
//             <Text style={styles.header}>Set Your Goal</Text>
//             <View style={styles.pickerContainer}>
//               <Picker
//                 selectedValue={selectedCategory}
//                 onValueChange={(itemValue) => setSelectedCategory(itemValue)}
//                 style={styles.picker}>
//                 <Picker.Item label="Select Goal" value="Select Goal" />
//                 <Picker.Item label="Cardio" value="Cardio" />
//                 <Picker.Item label="Strength Training" value="Strength" />
//                 <Picker.Item label="Yoga" value="Yoga" />
//               </Picker>
//             </View>

//             <View style={styles.formContainer}>
//               {selectedCategory === 'Select Goal' && (
//                 <Text style={styles.header}>Please Select a Goal Category</Text>
//               )}
//               {selectedCategory === 'Cardio' && (
//                 <View>
//                   <TextInput
//                     style={styles.input}
//                     placeholder="Enter the number of steps"
//                     value={cardioSteps}
//                     onChangeText={setCardioSteps}
//                     keyboardType="numeric"
//                   />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="Enter duration in minutes"
//                     value={cardioDuration}
//                     onChangeText={setCardioDuration}
//                     keyboardType="numeric"
//                   />
//                   <View style={styles.dateFieldContainer}>
//                     <Text style={styles.dateLabel}>Select a Due Date (Future Date Only)</Text>
//                     <DateTimePicker
//                       value={goalDeadline}
//                       mode="date"
//                       display="default"
//                       minimumDate={todayDate}
//                       onChange={handleDateChange}
//                     />
//                   </View>
//                   <Button title="Save Goal" onPress={handleSubmit} />
//                 </View>
//               )}

//               {selectedCategory === 'Strength' && (
//                 <View>
//                   <TextInput
//                     style={styles.input}
//                     placeholder="Enter repetitions"
//                     value={reps}
//                     onChangeText={setReps}
//                     keyboardType="numeric"
//                   />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="Enter sets"
//                     value={sets}
//                     onChangeText={setSets}
//                     keyboardType="numeric"
//                   />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="Enter weight (kg)"
//                     value={weight}
//                     onChangeText={setWeight}
//                     keyboardType="numeric"
//                   />
//                   <View style={styles.dateFieldContainer}>
//                     <Text style={styles.dateLabel}>Select a Due Date (Future Date Only)</Text>
//                     <DateTimePicker
//                       value={goalDeadline}
//                       mode="date"
//                       display="default"
//                       minimumDate={todayDate}
//                       onChange={handleDateChange}
//                     />
//                   </View>
//                   <Button title="Save Goal" onPress={handleSubmit} />
//                 </View>
//               )}

//               {selectedCategory === 'Yoga' && (
//                 <View>
//                   <TextInput
//                     style={styles.input}
//                     placeholder="Enter duration in minutes"
//                     value={yogaDuration}
//                     onChangeText={setYogaDuration}
//                     keyboardType="numeric"
//                   />
//                   <View style={styles.dateFieldContainer}>
//                     <Text style={styles.dateLabel}>Select a Due Date (Future Date Only)</Text>
//                     <DateTimePicker
//                       value={goalDeadline}
//                       mode="date"
//                       display="default"
//                       minimumDate={todayDate}
//                       onChange={handleDateChange}
//                     />
//                   </View>
//                   <Button title="Save Goal" onPress={handleSubmit} />
//                 </View>
//               )}
//             </View>
//           </View>
//         )}

//         {/* New Sort Option UI */}
//         <View style={styles.sortOptionsContainer}>
//           <Text style={styles.sortLabel}>Sort Goals By:</Text>
//           <Picker
//             selectedValue={sortOption}
//             onValueChange={(itemValue) => setSortOption(itemValue)}
//             style={styles.picker}>
//             <Picker.Item label="Deadline" value="deadline" />
//             <Picker.Item label="Status" value="status" />
//           </Picker>
//         </View>

//         {/* Display grouped goals by category */}
//         <View style={styles.existingGoalsContainer}>
//           {Object.keys(groupedGoals).length === 0 ? (
//             <Text>No goals set yet.</Text>
//           ) : (
//             Object.keys(groupedGoals).map((category) => {
//               // Sort goals based on the chosen option
//               let sortedGoals = [];
//               if (sortOption === 'deadline') {
//                 sortedGoals = groupedGoals[category].sort((a, b) => a.deadline - b.deadline);
//               } else if (sortOption === 'status') {
//                 sortedGoals = groupedGoals[category].sort((a, b) =>
//                   statusOrder[computeGoalStatus(a)] - statusOrder[computeGoalStatus(b)] ||
//                   (a.deadline - b.deadline)
//                 );
//               }
//               return (
//                 <View key={category}>
//                   <Text style={styles.header}>{category} Goals</Text>
//                   {sortedGoals.map((goal) => {
//                     // Compute aggregated activity for displaying progress
//                     const categoryActivities = activities[goal.category] || {};
//                     const aggregated = aggregateActivityForGoal(goal, categoryActivities);
//                     return (
//                       <View key={goal.id} style={styles.goalItem}>
//                         <Text style={styles.goalText}>{goal.category} Goal</Text>
//                         {renderGoalStatus(goal.deadline, goal.completed)}
//                         <Text>Deadline: {new Date(goal.deadline).toLocaleDateString()}</Text>
//                         {/* Display progress details for each goal */}
//                         {goal.category === 'Cardio' && (
//                           <Text style={styles.progressText}>
//                             Progress - Steps: {aggregated.steps} / {goal.cardioSteps} | Duration: {aggregated.duration} / {goal.cardioDuration} minutes
//                           </Text>
//                         )}
//                         {goal.category === 'Strength' && (
//                           <Text style={styles.progressText}>
//                             Progress - Reps: {aggregated.reps} / {goal.reps}
//                           </Text>
//                         )}
//                         {goal.category === 'Yoga' && (
//                           <Text style={styles.progressText}>
//                             Progress - Duration: {aggregated.duration} / {goal.yogaDuration} minutes
//                           </Text>
//                         )}
//                         {/* If the goal is not complete, offer a button to mark it complete manually */}
//                         {!goal.completed && (
//                           <Button title="Mark as Complete" onPress={() => handleCompleteGoal(goal)} />
//                         )}
//                         <Button title="Delete Goal" onPress={() => handleDeleteGoal(goal.id)} />
//                       </View>
//                     );
//                   })}
//                 </View>
//               );
//             })
//           )}
//         </View>
//       </ScrollView>
//       <NavBar />
//     </View>
//   );
// };

// // -------------------------------
// // Delete goal from Firebase by its id
// // -------------------------------
// const handleDeleteGoal = (goalId) => {
//   const db = getDatabase();
//   const user = auth.currentUser;
//   if (user) {
//     const goalRef = ref(db, `Users/${user.uid}/Goals/${goalId}`);
//     remove(goalRef)
//       .then(() => {
//         console.log('Goal deleted successfully!');
//         alert('Goal deleted successfully!');
//       })
//       .catch((error) => {
//         console.error('Error deleting goal: ', error);
//         alert('Error deleting goal. Please try again.');
//       });
//   }
// };

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   scrollContainer: { flexGrow: 1, paddingBottom: 70 },
//   createGoalButton: {
//     backgroundColor: '#09355c',
//     padding: 10,
//     borderRadius: 5,
//     margin: 10,
//   },
//   createGoalButtonText: { color: 'white', textAlign: 'center', fontSize: 18 },
//   goalContainer: {
//     marginTop: 20,
//     padding: 10,
//     backgroundColor: '#fff',
//     borderRadius: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#09355c' },
//   input: {
//     height: 40,
//     marginBottom: 12,
//     borderWidth: 1,
//     padding: 10,
//     borderRadius: 5,
//     borderColor: '#ccc',
//     backgroundColor: '#fff',
//   },
//   pickerContainer: { marginBottom: 20 },
//   formContainer: { marginBottom: 20 },
//   dateFieldContainer: { marginVertical: 10 },
//   dateLabel: { fontSize: 16, marginBottom: 5 },
//   dateText: { fontSize: 16, color: '#09355c' },
//   existingGoalsContainer: {
//     marginTop: 30,
//     padding: 10,
//     backgroundColor: '#f4f4f4',
//     borderRadius: 10,
//   },
//   goalItem: {
//     marginBottom: 15,
//     padding: 10,
//     backgroundColor: '#e0e0e0',
//     borderRadius: 5,
//   },
//   goalText: { fontSize: 18, fontWeight: 'bold' },
//   goalStatus: { fontSize: 14, fontStyle: 'italic' },
//   progressText: { fontSize: 16, color: '#09355c', marginTop: 5 },
//   // New styles for sort options
//   sortOptionsContainer: { margin: 10 },
//   sortLabel: { fontSize: 16, fontWeight: 'bold' },
// });

// export default MyGoalsScreen;
//////////////////////////////////////////////////
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, ScrollView, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDatabase, ref, push, set, onValue, remove } from 'firebase/database';
import { auth } from '../services/firebaseConfig';
import NavBar from '../components/NavBar';
// Import the activity listener function
import { setupActivityListener } from '../services/fetchUserActivities';

// Helper: Parse an activity date stored as a locale string (e.g., "3/21/2025")
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
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('');
  const [weight, setWeight] = useState('');
  const [cardioSteps, setCardioSteps] = useState('');
  const [cardioDuration, setCardioDuration] = useState('');
  const [yogaDuration, setYogaDuration] = useState('');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [userGoals, setUserGoals] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sortOption, setSortOption] = useState('deadline');
  const [activities, setActivities] = useState({});

  const todayDate = new Date();

  // -------------------------------
  // Fetch goals from Firebase
  // -------------------------------
  useEffect(() => {
    const fetchGoals = async () => {
      const db = getDatabase();
      const user = auth.currentUser;
      if (user) {
        const goalsRef = ref(db, `Users/${user.uid}/Goals`);
        onValue(goalsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const goalsArray = [];
            for (const goalId in data) {
              goalsArray.push({ id: goalId, ...data[goalId] });
            }
            setUserGoals(goalsArray);
          } else {
            setUserGoals([]);
          }
        });
      }
    };
    fetchGoals();
  }, []);

  // -------------------------------
  // Set up listener for user activities
  // -------------------------------
  useEffect(() => {
    const unsubscribe = setupActivityListener(setActivities);
    return () => unsubscribe();
  }, []);

  // -------------------------------
  // Helper: Aggregate activity for a given goal over its active period
  // -------------------------------
  const aggregateActivityForGoal = (goal, categoryActivities) => {
    let aggregated = { steps: 0, duration: 0, reps: 0 };

    // Normalize the goal start (dateCreated) and goal end (deadline) to cover the full days.
    const goalStart = new Date(goal.dateCreated);
    goalStart.setHours(0, 0, 0, 0);
    const goalEnd = new Date(goal.deadline);
    goalEnd.setHours(23, 59, 59, 999);

    Object.values(categoryActivities).forEach((entry) => {
      // Parse the activity date (assumed as locale string, e.g., "3/21/2025")
      const entryDate = parseActivityDate(entry.date);
      entryDate.setHours(0, 0, 0, 0);

      if (entryDate.getTime() >= goalStart.getTime() && entryDate.getTime() <= goalEnd.getTime()) {
        if (goal.category === 'Cardio') {
          aggregated.steps += Number(entry.steps) || 0;
          // Convert seconds to minutes before adding
          aggregated.duration += (Number(entry.cardioDuration) || 0) / 60;
        } else if (goal.category === 'Strength') {
          aggregated.reps += Number(entry.reps) || 0;
        } else if (goal.category === 'Yoga') {
          // Convert seconds to minutes before adding
          aggregated.duration += (Number(entry.yogaDuration) || 0) / 60;
        }
      }
    });
    return aggregated;
  };

  // -------------------------------
  // Auto-update goals based on user activity aggregation
  // -------------------------------
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
            if (aggregated.steps >= targetSteps && aggregated.duration >= targetDuration) {
              meetsTarget = true;
            }
          } else if (targetSteps > 0) {
            if (aggregated.steps >= targetSteps) {
              meetsTarget = true;
            }
          } else if (targetDuration > 0) {
            if (aggregated.duration >= targetDuration) {
              meetsTarget = true;
            }
          }
        } else if (goal.category === 'Strength') {
          const targetReps = Number(goal.reps) || 0;
          if (targetReps > 0 && aggregated.reps >= targetReps) {
            meetsTarget = true;
          }
        } else if (goal.category === 'Yoga') {
          const targetDuration = Number(goal.yogaDuration) || 0;
          if (targetDuration > 0 && aggregated.duration >= targetDuration) {
            meetsTarget = true;
          }
        }
        if (meetsTarget) {
          handleCompleteGoal(goal);
        }
      }
    });
  }, [userGoals, activities]);

  // -------------------------------
  // Save new goal to Firebase
  // -------------------------------
  const handleSubmit = () => {
    if (selectedCategory === 'Select Goal') {
      alert("Please select a valid goal category.");
      return;
    }
    if (selectedCategory === 'Cardio') {
      if (cardioSteps.trim() === "" || cardioDuration.trim() === "") {
        alert("Please fill out all required fields for a Cardio goal.");
        return;
      }
    }
    if (selectedCategory === 'Strength') {
      if (reps.trim() === "" || sets.trim() === "" || weight.trim() === "") {
        alert("Please fill out all required fields for a Strength goal.");
        return;
      }
    }
    if (selectedCategory === 'Yoga') {
      if (yogaDuration.trim() === "") {
        alert("Please fill out the required field for a Yoga goal.");
        return;
      }
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
          goalData = { ...goalData, cardioSteps, cardioDuration };
          break;
        case 'Strength':
          goalData = { ...goalData, reps, sets, weight };
          break;
        case 'Yoga':
          goalData = { ...goalData, yogaDuration };
          break;
        default:
          break;
      }

      const goalsRef = ref(db, `Users/${uid}/Goals`);
      const newGoalRef = push(goalsRef);

      set(newGoalRef, goalData)
        .then(() => {
          console.log("Goal saved successfully!");
          alert('Goal saved successfully!');
          resetForm();
        })
        .catch((error) => {
          console.error("Failed to save goal data: ", error);
          alert('Failed to save goal. Please try again.');
        });
    } else {
      alert('No user is logged in. Please log in to set your goal.');
    }
  };

  // -------------------------------
  // Reset the form
  // -------------------------------
  const resetForm = () => {
    setSelectedCategory('Select Goal');
    setGoalDeadline(new Date());
    setReps('');
    setSets('');
    setWeight('');
    setCardioSteps('');
    setCardioDuration('');
    setYogaDuration('');
    setShowGoalForm(false);
  };

  // -------------------------------
  // Handle date change for deadline
  // -------------------------------
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setGoalDeadline(selectedDate);
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  // -------------------------------
  // Render the goal's status display (deadline info or completion)
  // -------------------------------
  const renderGoalStatus = (deadlineTimestamp, completed) => {
    if (completed) {
      return <Text style={[styles.goalStatus, { color: 'blue' }]}>Complete</Text>;
    }
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const goalDate = new Date(deadlineTimestamp);
    goalDate.setHours(0, 0, 0, 0);
    const timeDiff = goalDate - currentDate;
    const daysRemaining = Math.round(timeDiff / (1000 * 3600 * 24));

    let statusText = '';
    let statusColor = 'green';
    if (daysRemaining > 0) {
      statusText = `${daysRemaining} days remaining`;
    } else if (daysRemaining === 0) {
      statusText = 'Goal deadline is today';
      statusColor = 'orange';
    } else {
      statusText = 'Goal deadline has passed';
      statusColor = 'red';
    }
    return <Text style={[styles.goalStatus, { color: statusColor }]}>{statusText}</Text>;
  };

  // -------------------------------
  // Mark a goal as complete (updates Firebase)
  // -------------------------------
  const handleCompleteGoal = (goal) => {
    const db = getDatabase();
    const user = auth.currentUser;
    if (user) {
      const goalRef = ref(db, `Users/${user.uid}/Goals/${goal.id}`);
      set(goalRef, { ...goal, completed: true })
        .then(() => {
          console.log('Goal marked as complete!');
          alert('Goal marked as complete!');
        })
        .catch((error) => {
          console.error('Error updating goal: ', error);
          alert('Failed to update goal. Please try again.');
        });
    }
  };

  // -------------------------------
  // Group goals by category
  // -------------------------------
  const groupedGoals = userGoals.reduce((acc, goal) => {
    const cat = goal.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(goal);
    return acc;
  }, {});

  const statusOrder = {
    'To Do': 0,
    'Due Today': 1,
    'Past Due': 2,
    'Complete': 3,
  };

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
                onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                style={styles.picker}>
                <Picker.Item label="Select Goal" value="Select Goal" />
                <Picker.Item label="Cardio" value="Cardio" />
                <Picker.Item label="Strength Training" value="Strength" />
                <Picker.Item label="Yoga" value="Yoga" />
              </Picker>
            </View>

            <View style={styles.formContainer}>
              {selectedCategory === 'Select Goal' && (
                <Text style={styles.header}>Please Select a Goal Category</Text>
              )}
              {selectedCategory === 'Cardio' && (
                <View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter the number of steps"
                    value={cardioSteps}
                    onChangeText={setCardioSteps}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter duration in minutes"
                    value={cardioDuration}
                    onChangeText={setCardioDuration}
                    keyboardType="numeric"
                  />
                  <View style={styles.dateFieldContainer}>
                    <Text style={styles.dateLabel}>Select a Due Date (Future Date Only)</Text>
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
              )}

              {selectedCategory === 'Strength' && (
                <View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter repetitions"
                    value={reps}
                    onChangeText={setReps}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter sets"
                    value={sets}
                    onChangeText={setSets}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter weight (kg)"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                  />
                  <View style={styles.dateFieldContainer}>
                    <Text style={styles.dateLabel}>Select a Due Date (Future Date Only)</Text>
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
              )}

              {selectedCategory === 'Yoga' && (
                <View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter duration in minutes"
                    value={yogaDuration}
                    onChangeText={setYogaDuration}
                    keyboardType="numeric"
                  />
                  <View style={styles.dateFieldContainer}>
                    <Text style={styles.dateLabel}>Select a Due Date (Future Date Only)</Text>
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
              )}
            </View>
          </View>
        )}

        <View style={styles.sortOptionsContainer}>
          <Text style={styles.sortLabel}>Sort Goals By:</Text>
          <Picker
            selectedValue={sortOption}
            onValueChange={(itemValue) => setSortOption(itemValue)}
            style={styles.picker}>
            <Picker.Item label="Deadline" value="deadline" />
            <Picker.Item label="Status" value="status" />
          </Picker>
        </View>

        <View style={styles.existingGoalsContainer}>
          {Object.keys(groupedGoals).length === 0 ? (
            <Text>No goals set yet.</Text>
          ) : (
            Object.keys(groupedGoals).map((category) => {
              let sortedGoals = [];
              if (sortOption === 'deadline') {
                sortedGoals = groupedGoals[category].sort((a, b) => a.deadline - b.deadline);
              } else if (sortOption === 'status') {
                sortedGoals = groupedGoals[category].sort((a, b) =>
                  statusOrder[computeGoalStatus(a)] - statusOrder[computeGoalStatus(b)] ||
                  (a.deadline - b.deadline)
                );
              }
              return (
                <View key={category}>
                  <Text style={styles.header}>{category} Goals</Text>
                  {sortedGoals.map((goal) => {
                    const categoryActivities = activities[goal.category] || {};
                    const aggregated = aggregateActivityForGoal(goal, categoryActivities);
                    return (
                      <View key={goal.id} style={styles.goalItem}>
                        <Text style={styles.goalText}>{goal.category} Goal</Text>
                        {renderGoalStatus(goal.deadline, goal.completed)}
                        <Text>Deadline: {new Date(goal.deadline).toLocaleDateString()}</Text>
                        {goal.category === 'Cardio' && (
                          <Text style={styles.progressText}>
                            Progress - Steps: {aggregated.steps} / {goal.cardioSteps} | Duration: {aggregated.duration.toFixed(2)} / {goal.cardioDuration} minutes
                          </Text>
                        )}
                        {goal.category === 'Strength' && (
                          <Text style={styles.progressText}>
                            Progress - Reps: {aggregated.reps} / {goal.reps}
                          </Text>
                        )}
                        {goal.category === 'Yoga' && (
                          <Text style={styles.progressText}>
                            Progress - Duration: {aggregated.duration.toFixed(2)} / {goal.yogaDuration} minutes
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
              );
            })
          )}
        </View>
      </ScrollView>
      <NavBar />
    </View>
  );
};

// -------------------------------
// Delete goal from Firebase by its id
// -------------------------------
const handleDeleteGoal = (goalId) => {
  const db = getDatabase();
  const user = auth.currentUser;
  if (user) {
    const goalRef = ref(db, `Users/${user.uid}/Goals/${goalId}`);
    remove(goalRef)
      .then(() => {
        console.log('Goal deleted successfully!');
        alert('Goal deleted successfully!');
      })
      .catch((error) => {
        console.error('Error deleting goal: ', error);
        alert('Error deleting goal. Please try again.');
      });
  }
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingBottom: 70 },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#09355c' },
  input: {
    height: 40,
    marginBottom: 12,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  pickerContainer: { marginBottom: 20 },
  formContainer: { marginBottom: 20 },
  dateFieldContainer: { marginVertical: 10 },
  dateLabel: { fontSize: 16, marginBottom: 5 },
  dateText: { fontSize: 16, color: '#09355c' },
  existingGoalsContainer: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
  },
  goalItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  goalText: { fontSize: 18, fontWeight: 'bold' },
  goalStatus: { fontSize: 14, fontStyle: 'italic' },
  progressText: { fontSize: 16, color: '#09355c', marginTop: 5 },
  sortOptionsContainer: { margin: 10 },
  sortLabel: { fontSize: 16, fontWeight: 'bold' },
});

export default MyGoalsScreen;

