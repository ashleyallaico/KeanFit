import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { Pedometer } from 'expo-sensors';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For saving step count data

const MyStepsScreen = () => {
  const [dailySteps, setDailySteps] = useState({});
  const [currentSteps, setCurrentSteps] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const lastStepCount = useRef(0);
  const timerInterval = useRef(null);
  const currentDate = useRef(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // Load previous step data from AsyncStorage on first render
    const loadData = async () => {
      const savedData = await AsyncStorage.getItem('dailySteps');
      if (savedData) {
        setDailySteps(JSON.parse(savedData));
      }
    };

    loadData();

    // Start pedometer and timer if tracking is on
    if (isTracking) {
      timerInterval.current = setInterval(() => {
        setDuration((prevDuration) => prevDuration + 1);
      }, 1000);

      const subscribe = Pedometer.watchStepCount((result) => {
        const newSteps = result.steps - lastStepCount.current;
        if (newSteps > 0) {
          setCurrentSteps((prevSteps) => prevSteps + newSteps);
          lastStepCount.current = result.steps;
        }
      });

      return () => {
        clearInterval(timerInterval.current);
        subscribe.remove();
      };
    } else {
      clearInterval(timerInterval.current);
    }
  }, [isTracking]);

  // Save daily step count to AsyncStorage
  useEffect(() => {
    const saveData = async () => {
      const updatedSteps = {
        ...dailySteps,
        [currentDate.current]: currentSteps,
      };
      await AsyncStorage.setItem('dailySteps', JSON.stringify(updatedSteps));
    };

    if (currentSteps > 0) {
      saveData();
    }
  }, [currentSteps]);

  const toggleTracking = () => {
    setIsTracking(!isTracking);
  };

  const handleReset = () => {
    Alert.alert(
      'Restart Workout',
      'Are you sure you want to restart?',
      [
        {
          text: 'Yes',
          onPress: () => {
            setCurrentSteps(0);
            setDuration(0);
            setIsTracking(false);
            lastStepCount.current = 0;
          },
        },
        { text: 'No', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.stepItem}>
        <Text style={styles.dateText}>{item.date}</Text>
        <Text style={styles.stepText}>{item.steps} steps</Text>
      </View>
    );
  };

  const data = Object.keys(dailySteps).map((date) => ({
    date,
    steps: dailySteps[date],
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Daily Steps</Text>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.date}
        style={styles.stepList}
      />

      <Text style={styles.currentSteps}>Current Steps: {currentSteps}</Text>
      <Text style={styles.timerText}>Time: {formatTime(duration)}</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isTracking ? '#FFA500' : '#4CAF50' },
          ]}
          onPress={toggleTracking}
        >
          <FontAwesome5
            name={isTracking ? 'pause' : 'play'}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#FF6347' }]}
          onPress={handleReset}
        >
          <FontAwesome5 name="redo" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  currentSteps: {
    fontSize: 18,
    color: '#76EEC6',
    marginBottom: 10,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFA500',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginTop: 15,
  },
  button: {
    padding: 15,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
    elevation: 5,
  },
  stepList: {
    width: '100%',
    marginBottom: 20,
  },
  stepItem: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
    width: '100%',
    alignItems: 'center',
  },
  dateText: {
    color: '#fff',
    fontSize: 18,
  },
  stepText: {
    color: '#76EEC6',
    fontSize: 16,
  },
});

export default MyStepsScreen;
