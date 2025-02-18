import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import NavBar from '../components/NavBar';


export default function DashboardScreen() {
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
            title="Progress"
            icon="bar-chart"
            onPress={() => {
              /* Navigate to progress tracking */
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

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          {/* Add your stats components here */}
        </View>
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
