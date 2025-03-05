
import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import MultiSelect from 'react-native-multiple-select';
import { fetchUserProfile, updateUserPreferences } from '../services/userService';
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
      .catch((error) => alert('Failed to update preferences: ' + error.message));
  };

  
  const arraysEqual = (a, b) => {
    return a.length === b.length && a.every((val, index) => val === b[index]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        <Text style={styles.header}>Profile</Text>
        {profile ? (
          <>
            <Text style={styles.profileText}>Name: {profile.Name}</Text>
            <MultiSelect
              items={CATEGORIES.map(category => ({ id: category, name: category }))}
              uniqueKey="id"
              onSelectedItemsChange={handleSelectPreferences}
              selectedItems={selectedPreferences}
              selectText="Pick Preferences"
              searchInputPlaceholderText="Search Preferences..."
              altFontFamily="ProximaNova-Light"
              tagRemoveIconColor="#CCC"
              tagBorderColor="#CCC"
              tagTextColor="#CCC"
              selectedItemTextColor="#CCC"
              selectedItemIconColor="#CCC"
              itemTextColor="#000"
              displayKey="name"
              searchInputStyle={{ color: '#CCC' }}
              submitButtonColor="#c00502"
              submitButtonText="Close Options"
            />
            {hasChanges && <Button title="Save Preferences" onPress={savePreferences} />}
          </>
        ) : (
          <Text>Loading profile...</Text>
        )}
      </View>
      <NavBar/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profileText: {
    fontSize: 16,
    marginBottom: 10,
  }
});
