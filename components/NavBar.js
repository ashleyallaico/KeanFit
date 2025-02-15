
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../services/firebaseConfig'; // Adjust the path to where your firebaseConfig.js is located


const NavBar = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await auth.signOut();  // Use the 'auth' instance you exported
      // navigation.navigate('Login');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert("Logout Failed", error.message);
    }
  };

  return (
    <View style={styles.navContainer}>
      <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
        <Text>Dashboard</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
        <Text>Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleLogout}>
        <Text>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: '#ddd',
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 1
  },
});

export default NavBar;
