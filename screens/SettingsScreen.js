import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import NavBar from '../components/NavBar';
import { useNavigation } from '@react-navigation/native';
import { getDatabase, ref, set } from 'firebase/database';
import { auth } from '../services/firebaseConfig';
import { fetchUserProfile } from '../services/userService';
import { CATEGORIES } from '../constants/categories';

const SettingsScreen = () => {
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = fetchUserProfile((profileData) => {
      setProfile(profileData);
    });
    return () => unsubscribe(); 
  }, []);

  const handleDarkModeToggle = () => {
    setDarkModeEnabled((prevState) => !prevState);
  };

  const handleNotificationsToggle = () => {
    setNotificationsEnabled((prevState) => !prevState);
  };

  const SettingItem = ({ icon, title, children }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <FontAwesome name={icon} size={20} color="#09355c" />
        <Text style={styles.settingText}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <View style={styles.container}>
      {/*Profile Section*/}
      <View style={styles.profileContainer}>
        {profile ? (
          <>
          <FontAwesome name="user-circle" size={80} color="#09355c" />
          <Text style={styles.profileText}>{profile.Name}</Text>
          </>
          ) : (
            <Text>Loading profile...</Text>
        )}     
      </View>

      <View style={styles.content}>
        {/*Account Section*/}
        <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity
              style={styles.buttonGeneral}
              onPress={() => navigation.navigate('Profile')}
            >
              <FontAwesome name="user" size={20} color="#09355c" />
              <Text style={styles.buttonGeneralText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
              style={styles.buttonGeneral}
              onPress={() => navigation.navigate('WorkoutPreferences')}
            >
              <FontAwesome name="heartbeat" size={20} color="#09355c" />
              <Text style={styles.buttonGeneralText}>Workout Preferences</Text>
          </TouchableOpacity>
        </View>
        </View>

        {/*General Section*/}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.card}>
            <SettingItem icon="bell" title="Enable Notifications">
              <Switch
                trackColor={{ false: '#767577', true: '#09355c' }}
                thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={handleNotificationsToggle}
                value={notificationsEnabled}
              />
            </SettingItem>
            <SettingItem icon="moon-o" title="Enable Dark Mode">
              <Switch
                trackColor={{ false: '#767577', true: '#09355c' }}
                thumbColor={darkModeEnabled ? '#fff' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={handleDarkModeToggle}
                value={darkModeEnabled}
              />
            </SettingItem>
          </View>
        </View>
      </View>

      <NavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  profileContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileText: {
    fontSize: 18,
    color: '#09355c',
    marginTop: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#09355c',
    marginBottom: 10,
    marginLeft: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  buttonGeneral: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  buttonGeneralText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 20,
  }
});

export default SettingsScreen;