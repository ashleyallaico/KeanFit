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

export default function WorkoutsScreen() {
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
          Workout Info here..
        </Text>
      </View>
      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
});