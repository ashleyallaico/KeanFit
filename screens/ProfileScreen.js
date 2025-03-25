
import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { fetchUserProfile, updateUserPreferences } from '../services/userService';
import { FontAwesome } from '@expo/vector-icons';
import NavBar from '../components/NavBar';
import { useNavigation } from '@react-navigation/native';
import { getDatabase, ref, set } from 'firebase/database';
import { auth } from '../services/firebaseConfig';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = fetchUserProfile((profileData) => {
      setProfile(profileData);
    });
    return () => unsubscribe(); 
  }, []);

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

  const disableAccount = () => {
    Alert.alert(
      'Disable Account',
      'Are you sure you want to disable your account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Disable',
          onPress: () => {
            const userId = auth.currentUser.uid;
            const db = getDatabase();
            const accountStatusRef = ref(db, `AccountDissable/${userId}`);
            set(accountStatusRef, true)
              .then(() => {
                auth
                  .signOut()
                  .then(() => {
                    navigation.replace('Login');
                    Alert.alert(
                      'Account Disabled',
                      'Your account has been disabled successfully.'
                    );
                  })
                  .catch((error) => {
                    Alert.alert('Logout Failed', error.message);
                  });
              })
              .catch((error) => {
                Alert.alert(
                  'Error',
                  'Failed to disable account: ' + error.message
                );
              });
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/*Profile Photo Section*/}
      <View style={styles.profilePhotoContainer}>
        {profile ? (
          <>
          <FontAwesome name="user-circle" size={80} color="#09355c" />
          </>
          ) : (
            <Text>Loading profile...</Text>
        )}     
      </View>
      <View style={styles.content}>  
      <View style={styles.card}>   
        {profile ? (
          <>
            <Text style={styles.contentText}>Name: {profile.Name}</Text>
            <Text style={styles.contentText}>Email: {profile.Email}</Text>
            <Text style={styles.contentText}>Height: {profile.Height} Meters</Text>
            <Text style={styles.contentText}>Weight: {profile.Weight} Pounds</Text>
          </>
        ) : (
          <Text>Loading profile...</Text>
        )}
        </View>
      <View style={styles.section}>
          {/*Preference Section*/}
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('UpdatePassword')}
            >
              <FontAwesome name="lock" size={20} color="#fff" />
              <Text style={styles.buttonText}>Update Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonDanger]}
              onPress={disableAccount}
            >
              <FontAwesome name="user-times" size={20} color="#fff" />
              <Text style={styles.buttonText}>Disable Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={confirmLogout}
            >
              <FontAwesome name="sign-out" size={20} color="#fff" />
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
        </View>
    </View>
    <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profilePhotoContainer: {
    alignItems: 'center',
    marginVertical: 20,
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
  content: {
    flex: 1,
    padding: 20,
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09355c',
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
  },
  buttonDanger: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  contentText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
});