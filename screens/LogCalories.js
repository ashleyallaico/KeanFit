import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  SafeAreaView,
  Image,
} from 'react-native';
import { Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import NavBar from '../components/NavBar';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../services/firebaseConfig';
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  remove,
} from 'firebase/database';

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = `0${today.getMonth() + 1}`.slice(-2); // months are 0-based
  const day = `0${today.getDate()}`.slice(-2);
  return `${year}-${month}-${day}`; // Format: YYYY-MM-DD
};

export default function LogCaloriesScreen() {
  const [foodTitle, setFoodTitle] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [caloriesPerServing, setCaloriesPerServing] = useState('');
  const navigation = useNavigation();
  const [entries, setEntries] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const scrollY = new Animated.Value(0);

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

  const today = getTodayDateString();

  const handleSubmit = () => {
    const db = getDatabase();
    const user = auth.currentUser;

    if (!foodTitle || !servingSize || !caloriesPerServing) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }

    const calories = parseFloat(servingSize) * parseFloat(caloriesPerServing);

    if (isNaN(calories)) {
      Alert.alert(
        'Invalid Input',
        'Please enter valid numbers for servings and calories.'
      );
      return;
    }

    if (user) {
      const now = new Date();
      const calorieData = {
        title: foodTitle,
        servingSize: parseFloat(servingSize),
        caloriesPerServing: parseFloat(caloriesPerServing),
        calories,
        date: getTodayDateString(),
      };

      const caloriesRef = ref(db, `Calories/${user.uid}`);

      if (editIndex !== null) {
        const entryToEdit = entries[editIndex];
        const entryRef = ref(db, `Calories/${user.uid}/${entryToEdit.key}`);
        set(entryRef, { ...calorieData, key: entryToEdit.key })
          .then(() => {
            console.log('Entry updated successfully!');
            Alert.alert('Updated', 'Entry updated!');
            setFoodTitle('');
            setServingSize('');
            setCaloriesPerServing('');
            setEditIndex(null);
          })

          .catch((error) => {
            console.error('Update failed:', error);
            Alert.alert('Error', 'Failed to update entry.');
          });
      } else {
        const newCalorieRef = push(caloriesRef);

        set(newCalorieRef, calorieData)
          .then(() => {
            console.log('Calories logged successfully!');
            Alert.alert('Success', 'Calories logged successfullt!');
            setFoodTitle('');
            setServingSize('');
            setCaloriesPerServing('');
            setEditIndex(null);
          })
          .catch((error) => {
            console.error('Failed to log calories:', error);
            Alert.alert('Error', 'Failed to save. Please try again.');
          });
      }
    } else {
      Alert.alert(
        'Authentication Required',
        'Please log in to track your food.'
      );
    }
  };

  const handleEdit = (index) => {
    const entry = entries[index];
    setFoodTitle(entry.title);
    setServingSize(entry.servingSize.toString());
    setCaloriesPerServing(entry.caloriesPerServing.toString());
    setEditIndex(index);
  };

  const handleRemove = (index) => {
    const db = getDatabase();
    const user = auth.currentUser;

    if (!user) {
      Alert.alert(
        'Authentication Required',
        'Please log in to remove entries.'
      );
      return;
    }

    const entryToRemove = entries[index];
    const entryRef = ref(db, `Calories/${user.uid}/${entryToRemove.key}`);

    remove(entryRef)
      .then(() => {
        console.log('Entry removed successfully.');
        const filtered = entries.filter((_, i) => i !== index);
        setEntries(filtered);
      })
      .catch((error) => {
        console.error('Error removing entry:', error);
        Alert.alert('Error', 'Failed to remove entry. Please try again.');
      });
  };

  const groupByDate = () => {
    const grouped = {};
    entries.forEach((entry) => {
      if (!grouped[entry.date]) grouped[entry.date] = [];
      grouped[entry.date].push(entry);
    });
    return grouped;
  };

  const dailyGroups = groupByDate();

  const CalorieVisualBar = ({ total }) => {
    const maxCalories = 3000;
    const percentage = Math.min((total / maxCalories) * 100, 100);

    return (
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${percentage}%` }]} />
      </View>
    );
  };

  useEffect(() => {
    const db = getDatabase();
    const userId = auth.currentUser?.uid;
    const caloriesRef = ref(db, `Calories/${userId}`);
    const unsubscribe = onValue(caloriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedEntries = Object.entries(data).map(([key, value]) => ({
          ...value,
          key,
        }));
        setEntries(loadedEntries);
      } else {
        setEntries([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Use this to determine which option is the header
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const dailyGroup = groupByDate();

  const totalCaloriesToday = entries
    .filter((e) => e.date === today)
    .reduce((sum, e) => sum + e.calories, 0);

  const renderTodayEntries = () => (
    <View style={styles.entriesCard}>
      <Text style={styles.sectionTitle}>Today's Entries</Text>
      {entries.filter((e) => e.date === today).length > 0 ? (
        entries
          .filter((e) => e.date === today)
          .map((item, index) => (
            <View key={index} style={styles.entryItem}>
              <View style={styles.entryContent}>
                <Text style={styles.entryTitle}>{item.title}</Text>
                <Text style={styles.entryCalories}>{item.calories} cal</Text>
              </View>
              <View style={styles.entryActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(index)}
                >
                  <FontAwesome name="edit" size={16} color="#053559" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleRemove(index)}
                >
                  <FontAwesome name="trash" size={16} color="#E74C3C" />
                </TouchableOpacity>
              </View>
            </View>
          ))
      ) : (
        <Text style={styles.emptyText}>No entries for today</Text>
      )}
    </View>
  );

  const renderHistory = () => (
    <View style={styles.historyCard}>
      <Text style={styles.sectionTitle}>History</Text>
      {Object.entries(dailyGroups).length > 0 ? (
        Object.entries(dailyGroups).map(([date, dayEntries]) => {
          const total = dayEntries.reduce((sum, e) => sum + e.calories, 0);
          return (
            <View key={date} style={styles.historyItem}>
              <Text style={styles.historyDate}>{date}</Text>
              <Text style={styles.historyTotal}>{total} cal</Text>
              <CalorieVisualBar total={total} />
            </View>
          );
        })
      ) : (
        <Text style={styles.emptyText}>No history available</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <Image
          source={require('../assets/KeanBG.png')}
          style={styles.headerImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <Animated.Text
            style={[styles.headerTitle, { opacity: headerSubtitleOpacity }]}
          >
            Track Calories
          </Animated.Text>
          <Animated.Text
            style={[styles.headerSubtitle, { opacity: headerSubtitleOpacity }]}
          >
            Monitor your daily intake
          </Animated.Text>

          <Animated.Text
            style={[styles.compactHeaderTitle, { opacity: headerTitleOpacity }]}
          >
            Track Calories
          </Animated.Text>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.inputCard}>
          <TextInput
            placeholder="Title of Food"
            value={foodTitle}
            onChangeText={setFoodTitle}
            style={styles.input}
            placeholderTextColor="#666"
          />
          <TextInput
            placeholder="Serving Size"
            value={servingSize}
            onChangeText={setServingSize}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor="#666"
          />
          <TextInput
            placeholder="Calories per Serving"
            value={caloriesPerServing}
            onChangeText={setCaloriesPerServing}
            keyboardType="numeric"
            style={styles.input}
            placeholderTextColor="#666"
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>
              {editIndex !== null ? 'Update Entry' : 'Add Calories'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Summary</Text>
          <Text style={styles.total}>Total Calories: {totalCaloriesToday}</Text>
          <CalorieVisualBar total={totalCaloriesToday} />
        </View>

        {renderTodayEntries()}
        {renderHistory()}

        {/* Bottom Padding for NavBar */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      <NavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  headerGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  compactHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: 180, // Adjust based on header height
    paddingHorizontal: 20,
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  submitButton: {
    backgroundColor: '#053559',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#053559',
    marginBottom: 10,
  },
  total: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginVertical: 10,
  },
  entriesCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#053559',
    marginBottom: 15,
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  entryContent: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 16,
    color: '#333',
  },
  entryCalories: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  entryActions: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    padding: 8,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  historyTotal: {
    fontSize: 14,
    color: '#666',
    marginVertical: 5,
  },
  barBackground: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginTop: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
  },
});
