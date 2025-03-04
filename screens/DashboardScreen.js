import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import NavBar from '../components/NavBar';
import { useNavigation } from '@react-navigation/native';
import { setupActivityListener } from '../services/fetchUserActivities'; // Adjust the path as necessary


export default function DashboardScreen() {
  //activities i
  const [activities, setActivities] = useState({});
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = setupActivityListener(setActivities);

    return () => {
      unsubscribe();
    };
  }, []);



  const renderActivityDetails = (category, entryDetails) => {
    switch (category) {
      case 'Cardio':
        return (
          <Text>
            {entryDetails.date}: Walked {entryDetails.steps} steps in {entryDetails.duration} minutes 
          </Text>
        );
      case 'Strength':
        return (
          <Text>
            {entryDetails.date}: Lifted {entryDetails.weight} lbs for {entryDetails.reps} reps 
          </Text>
        );
      case 'Flexibility':
        return (
          <Text>
            {entryDetails.date}: Practiced yoga for {entryDetails.duration} minutes
          </Text>
        );
      default:
        return <Text>{entryDetails.date}: Activity recorded</Text>;
    }
  };

  const QuickAccessCard = ({ title, icon, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <FontAwesome name={icon} size={30} color="#09355c" />
      <Text style={styles.cardTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { alignItems: 'center' }]}>
        <Text style={styles.welcomeText}>Welcome to KEANFIT</Text>
        <Text style={styles.subtitleText}>
          Your fitness journey starts here
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.cardsContainer}>
          <QuickAccessCard
            title="Workout Plans"
            icon="heartbeat"
            onPress={() => {
              /* Navigate to workout plans */
            }}
          />
          <QuickAccessCard
            title="Track Workout"
            icon="bar-chart"
            onPress={() => {
              navigation.navigate('TrackWorkout')
            }}
          />
          <QuickAccessCard
            title="Nutrition"
            icon="cutlery"
            onPress={() => {
              /* Navigate to nutrition */
            }}
          />
          <QuickAccessCard
            title="Profile"
            icon="user"
            onPress={() => {
              /* Navigate to profile */
            }}
          />
        </View>


        <Text style={styles.somethingidk}>Your Stats</Text>
        {/* List all individual categories inside the object*/}

        {Object.entries(activities).map(([category, entries]) => (
          <View key={category} style={styles.categoryContainer}>
            <Text style={styles.categoryTitle}>{category}</Text>

            {/* list all the activities inside each categorie */}
            {Object.entries(entries).map(([entryId, entryDetails]) => (
              <View key={entryId}>
                {renderActivityDetails(category, entryDetails)}
              </View>

            ))}
          </View>

        ))}
      </ScrollView>

      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#09355c',
    padding: 20,
    paddingTop: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitleText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#fff',
    width: '48%',
    aspectRatio: 1,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 90, // Add space for NavBar
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
});
