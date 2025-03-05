import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../services/firebaseConfig';
import { FontAwesome } from '@expo/vector-icons';

const NavBar = () => {
  const navigation = useNavigation();

  const confirmLogout = () => {
    Alert.alert(
      "Confirm Logout", 
      "Are you sure you want to log out?", 
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: handleLogout }
      ]
    );
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Logout Failed', error.message);
    }
  };

  return (
    <View style={styles.navContainer}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Dashboard')}
      >
        <FontAwesome name="home" size={24} color="#09355c" />
        <Text style={styles.navText}>Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Settings')}
      >
        <FontAwesome name="cog" size={24} color="#09355c" />
        <Text style={styles.navText}>Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={confirmLogout}>
        <FontAwesome name="sign-out" size={24} color="#09355c" />
        <Text style={styles.navText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    width: '100%',
    height: 70,
    position: 'absolute',
    bottom: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navText: {
    color: '#09355c',
    fontSize: 12,
    marginTop: 4,
  },
});

export default NavBar;
