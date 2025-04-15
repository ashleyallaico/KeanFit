import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  ScrollView,
  StyleSheet,
  StatusBar,
  ImageBackground,
  Platform,
  TouchableOpacity,
} from 'react-native';
import MultiSelect from 'react-native-multiple-select';
import {
  fetchUserProfile,
  updateUserPreferences,
} from '../services/userService';
import { CATEGORIES } from '../constants/categories';
import NavBar from '../components/NavBar';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [initialPreferences, setInitialPreferences] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const unsubscribe = fetchUserProfile((profileData) => {
      setProfile(profileData);
      if (profileData && profileData.Preferences) {
        setSelectedPreferences(profileData.Preferences);
        setInitialPreferences(profileData.Preferences);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSelectPreferences = (selectedItems) => {
    setSelectedPreferences(selectedItems);
    setHasChanges(!arraysEqual(selectedItems, initialPreferences));
  };

  const savePreferences = () => {
    updateUserPreferences(selectedPreferences)
      .then(() => {
        alert('Preferences updated successfully!');
        setInitialPreferences([...selectedPreferences]);
        setHasChanges(false);
      })
      .catch((error) =>
        alert('Failed to update preferences: ' + error.message)
      );
  };

  const arraysEqual = (a, b) => {
    return a.length === b.length && a.every((val, index) => val === b[index]);
  };

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
          <Text style={styles.headerTitle}>Workout Preferences</Text>
          <Text style={styles.headerSubtitle}>
            Customize your fitness journey
          </Text>
        </View>
      </ImageBackground>

      <View style={styles.mainContent}>
        {profile ? (
          <View style={styles.preferencesCard}>
            <Text style={styles.label}>Select Your Preferences</Text>
            <MultiSelect
              items={CATEGORIES.map((category) => ({
                id: category,
                name: category,
              }))}
              uniqueKey="id"
              onSelectedItemsChange={handleSelectPreferences}
              selectedItems={selectedPreferences}
              selectText="Pick Preferences"
              searchInputPlaceholderText="Search preferences..."
              altFontFamily="ProximaNova-Light"
              tagRemoveIconColor="#053559"
              tagBorderColor="#053559"
              tagTextColor="#053559"
              selectedItemTextColor="#053559"
              selectedItemIconColor="#053559"
              itemTextColor="#333"
              displayKey="name"
              submitButtonColor="#053559"
              submitButtonText="Done"
              style={styles.multiSelect}
              searchInputStyle={styles.searchInput}
              tagContainerStyle={styles.tagContainer}
              tagTextStyle={styles.tagText}
              selectedItemIconStyle={styles.selectedIcon}
              selectedItemTextStyle={styles.selectedText}
              itemTextStyle={styles.itemText}
              searchInputPlaceholderTextColor="#999"
              submitButtonTextStyle={styles.submitButtonText}
            />
            {hasChanges && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={savePreferences}
              >
                <Text style={styles.saveButtonText}>Save Preferences</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        )}
      </View>
      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  heroSection: {
    height: 200,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
  preferencesCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  multiSelect: {
    marginBottom: 20,
  },
  searchInput: {
    height: 40,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  tagContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#053559',
  },
  tagText: {
    color: '#053559',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedIcon: {
    color: '#053559',
  },
  selectedText: {
    color: '#053559',
    fontWeight: '600',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#053559',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});
