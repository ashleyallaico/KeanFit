import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import NavBar from '../components/NavBar';
import { useNavigation } from '@react-navigation/native'; 

export default function DashboardScreen() {
  const navigation = useNavigation();

  const QuickAccessCard = ({ title, icon, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <FontAwesome name={icon} size={30} color="#09355c" />
      <Text style={styles.cardTitle}>{title}</Text>
    </TouchableOpacity>
  );

  // Data for FlatList (Quick Access Cards)
  const quickAccessData = [
    // { title: 'My Workout', icon: 'heartbeat', navigateTo: 'MyWorkout' },
    // { title: 'Track Workout', icon: 'bar-chart', navigateTo: 'TrackWorkout' },
    // { title: 'My goal', icon: 'cutlery', navigateTo: 'MyGoalsScreen' },
    // { title: 'Step Tracking', icon: 'step', navigateTo: 'StepTracking' },
    { title: "My Workout", icon: "heartbeat", navigateTo: "MyWorkout" },
    { title: "Track Workout", icon: "bar-chart", navigateTo: "TrackWorkout" },
    { title: 'My goal', icon: 'cutlery', navigateTo: 'MyGoalsScreen' },
    { title: "My Activity", icon: "user", navigateTo: "MyActivity" }
  ];

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <>
            {/* Header Section */}
            <View style={[styles.header, { alignItems: 'center' }]}>
              <Text style={styles.welcomeText}>Welcome to KEANFIT</Text>
              <Text style={styles.subtitleText}>
                Your fitness journey starts here
              </Text>
            </View>

            {/* Quick Access Cards */}
            <View style={styles.cardsContainer}>
              {quickAccessData.map((item, index) => (
                <QuickAccessCard
                  key={index}
                  title={item.title}
                  icon={item.icon}
                  onPress={() => navigation.navigate(item.navigateTo)}
                />
              ))}
            </View>
          </>
        }
        data={[]} // Empty data array since content is in ListHeaderComponent
        renderItem={null} // No default rendering needed
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
      />

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
    paddingTop: 20,
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
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
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
    shadowOffset: { width: 0, height: 2 },
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginLeft: 15,
  },
  workoutsButton: {
    backgroundColor: '#09355c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 30,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  workoutsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
