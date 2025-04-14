import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  StatusBar,
  Platform,
  ImageBackground,
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
        <View style={styles.iconContainer}>
          <FontAwesome name={icon} size={16} color="#fff" />
        </View>
        <Text style={styles.settingText}>{title}</Text>
      </View>
      {children}
    </View>
  );

  // Use this to determine which option is the header
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#053559"
        translucent={true}
      />

      {/* Hero Section with Background */}
      <ImageBackground
        source={require('../assets/KeanBG.png')}
        style={styles.heroSection}
        resizeMode="cover"
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Personalize your experience</Text>
        </View>
      </ImageBackground>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/*Profile Section*/}
          <View style={styles.profileCard}>
            {profile ? (
              <>
                <View style={styles.profileImageContainer}>
                  <FontAwesome name="user-circle" size={70} color="#fff" />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{profile.Name}</Text>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigation.navigate('Profile')}
                  >
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.loadingText}>Loading profile...</Text>
            )}
          </View>

          {/*Account Section*/}
          <View style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: '#4A90E2' },
                  ]}
                >
                  <FontAwesome name="user" size={16} color="#fff" />
                </View>
                <Text style={styles.menuItemText}>Profile Information</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color="#9E9E9E" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('WorkoutPreferences')}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: '#E55934' },
                  ]}
                >
                  <FontAwesome name="heartbeat" size={16} color="#fff" />
                </View>
                <Text style={styles.menuItemText}>Workout Preferences</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color="#9E9E9E" />
            </TouchableOpacity>
          </View>

          {/*General Section*/}
          <View style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>General Settings</Text>
            <SettingItem icon="bell" title="Notifications">
              <Switch
                trackColor={{ false: '#D1D1D6', true: '#053559' }}
                thumbColor={notificationsEnabled ? '#fff' : '#fff'}
                ios_backgroundColor="#D1D1D6"
                onValueChange={handleNotificationsToggle}
                value={notificationsEnabled}
                style={styles.switch}
              />
            </SettingItem>
            <SettingItem icon="moon-o" title="Dark Mode">
              <Switch
                trackColor={{ false: '#D1D1D6', true: '#053559' }}
                thumbColor={darkModeEnabled ? '#fff' : '#fff'}
                ios_backgroundColor="#D1D1D6"
                onValueChange={handleDarkModeToggle}
                value={darkModeEnabled}
                style={styles.switch}
              />
            </SettingItem>
          </View>

          {/* Support Section */}
          <View style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>Support</Text>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: '#27AE60' },
                  ]}
                >
                  <FontAwesome name="info-circle" size={16} color="#fff" />
                </View>
                <Text style={styles.menuItemText}>Help & Support</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color="#9E9E9E" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: '#8E44AD' },
                  ]}
                >
                  <FontAwesome name="file-text-o" size={16} color="#fff" />
                </View>
                <Text style={styles.menuItemText}>Terms & Privacy</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color="#9E9E9E" />
            </TouchableOpacity>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity style={styles.signOutButton}>
            <FontAwesome name="sign-out" size={18} color="#E74C3C" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          {/* Version info */}
          <Text style={styles.versionText}>Version 1.0.0</Text>

          {/* Bottom padding for scroll */}
          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      <NavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  heroSection: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#053559',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImageContainer: {
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 15,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  settingsCard: {
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
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
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
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#053559',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  switch: {
    transform: [{ scale: 0.8 }],
  },
  signOutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E74C3C',
    marginLeft: 10,
  },
  versionText: {
    textAlign: 'center',
    color: '#9E9E9E',
    fontSize: 12,
    marginBottom: 20,
  },
  bottomPadding: {
    height: 80,
  },
});

export default SettingsScreen;
