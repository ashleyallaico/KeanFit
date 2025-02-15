import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NavBar from '../components/NavBar'; 

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <NavBar /> 
      <Text>Welcome to the Dashboard!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    
  }
});
