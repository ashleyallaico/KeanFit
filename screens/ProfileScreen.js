import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
  ImageBackground,
  StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
// import { Platform } from 'react-native';
import { fetchUserProfile } from '../services/userService';
import { FontAwesome } from '@expo/vector-icons';
import NavBar from '../components/NavBar';
import { useNavigation } from '@react-navigation/native';
import { getDatabase, ref, update, set } from 'firebase/database';
import { auth } from '../services/firebaseConfig';
import { calculateBMI } from '../utils/bmiCalculator';
import { calculateAge } from '../utils/ageCalculator';

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weight, setWeight] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(true);
  const [showUpdateFields, setShowUpdateFields] = useState(false);
  const navigation = useNavigation();
  // const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDob, setTempDob] = useState(null); // holds the unconfirmed date

  // Helper to convert meters to feet and inches
  const convertMetersToFeetInches = (meters) => {
    const totalFeet = meters * 3.28084;
    let feet = Math.floor(totalFeet);
    let inches = Math.round((totalFeet - feet) * 12);
    if (inches === 12) {
      feet += 1;
      inches = 0;
    }
    return { feet, inches };
  };

  // Use this to determine which option is the header
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = fetchUserProfile((profileData) => {
      if (profileData) {
        setProfile(profileData);
        // Convert the stored height (meters) to feet and inches
        if (!profileData.DOB || !profileData.Gender) {
          Alert.alert(
            'Complete Your Profile',
            'Please update your date of birth and gender to personalize your experience.'
          );
        }
        if (profileData.Height) {
          const { feet, inches } = convertMetersToFeetInches(
            profileData.Height
          );
          setHeightFeet(String(feet));
          setHeightInches(String(inches));
        }
        if (profileData.Gender) setGender(profileData.Gender);
        if (profileData.DOB) setDob(profileData.DOB);
        setWeight(String(profileData.Weight ?? ''));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const confirmLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: handleLogout },
    ]);
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

  const updateProfileDetails = () => {
    // Validate inputs
    if (
      !heightFeet ||
      isNaN(heightFeet) ||
      parseFloat(heightFeet) < 0 ||
      !heightInches ||
      isNaN(heightInches) ||
      parseFloat(heightInches) < 0 ||
      parseFloat(heightInches) >= 12 ||
      !weight ||
      isNaN(weight) ||
      parseFloat(weight) <= 0
    ) {
      Alert.alert(
        'Validation Error',
        'Please enter valid height (feet and inches) and weight.'
      );
      return;
    }

    // Convert feet and inches to meters
    const totalFeet = parseFloat(heightFeet) + parseFloat(heightInches) / 12;
    const meters = totalFeet / 3.28084;

    const userId = auth.currentUser.uid;
    const db = getDatabase();
    const profileRef = ref(db, `Users/${userId}`);

    update(profileRef, {
      Height: parseFloat(meters.toFixed(2)),
      Weight: parseFloat(weight),
      DOB: dob,
      Gender: gender || null,
    })
      .then(() => {
        // Update local profile state with new values
        setProfile((prevProfile) => ({
          ...prevProfile,
          Height: parseFloat(meters.toFixed(2)),
          Weight: parseFloat(weight),
          DOB: dob,
          Gender: gender || null,
        }));
        Alert.alert(
          'Update Successful',
          'Your profile has been updated successfully.'
        );
        setShowUpdateFields(false);
      })
      .catch((error) => {
        Alert.alert('Update Failed', error.message);
      });
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
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>
            Manage your personal information
          </Text>
        </View>
      </ImageBackground>

      <View style={styles.mainContent}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.contentContainer}>
            {/* Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.profilePhotoContainer}>
                <FontAwesome name="user-circle" size={80} color="#fff" />
              </View>
              {profile ? (
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{profile.Name}</Text>
                  <Text style={styles.profileEmail}>{profile.Email}</Text>
                </View>
              ) : (
                <Text style={styles.loadingText}>Loading profile...</Text>
              )}
            </View>

            {/* Personal Info Card */}
            <View style={styles.settingsCard}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              {profile && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>BMI</Text>
                    <Text style={styles.infoValue}>
                      {calculateBMI(profile.Height, profile.Weight) ?? 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Height</Text>
                    <Text style={styles.infoValue}>
                      {heightFeet} ft {heightInches} in
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Weight</Text>
                    <Text style={styles.infoValue}>
                      {profile.Weight} Pounds
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Age</Text>
                    <Text style={styles.infoValue}>
                      {dob ? calculateAge(dob) + ' years' : 'Not provided'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Gender</Text>
                    <Text style={styles.infoValue}>
                      {gender || 'Not provided'}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Edit Profile Button */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setShowUpdateFields(!showUpdateFields);
              }}
            >
              <FontAwesome name="edit" size={16} color="#fff" />
              <Text style={styles.editButtonText}>
                {showUpdateFields
                  ? 'Hide Update Fields'
                  : 'Edit Profile Details'}
              </Text>
            </TouchableOpacity>

            {/* Update Section */}
            {showUpdateFields && (
              <View style={styles.updateSection}>
                <Text style={styles.sectionTitle}>Update Profile</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter height (feet)"
                  value={heightFeet}
                  onChangeText={setHeightFeet}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter height (inches)"
                  value={heightInches}
                  onChangeText={setHeightInches}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new weight (pounds)"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ color: dob ? '#000' : '#999' }}>
                    {dob
                      ? new Date(dob).toLocaleDateString()
                      : 'Select your date of birth'}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <View>
                    <DateTimePicker
                      value={tempDob ? new Date(tempDob) : new Date(2000, 0, 1)}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      maximumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        if (event.type === 'dismissed') {
                          setShowDatePicker(false);
                          return;
                        }
                        setTempDob(selectedDate);
                      }}
                    />
                    <TouchableOpacity
                      style={[styles.button, { marginTop: 10 }]}
                      onPress={() => {
                        const age = calculateAge(tempDob);
                        if (age < 13 || age > 120) {
                          Alert.alert(
                            'Invalid DOB',
                            'Please enter a realistic birthdate (age must be 13+).'
                          );
                        } else {
                          setDob(tempDob.toISOString());
                          setShowDatePicker(false);
                        }
                      }}
                    >
                      <Text style={styles.buttonText}>Save Date of Birth</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.genderContainer}>
                  <Text style={styles.genderTitle}>Select Gender</Text>
                  <View style={styles.genderOptions}>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        gender === 'Male' && styles.genderButtonSelected,
                      ]}
                      onPress={() => setGender('Male')}
                    >
                      <Text style={styles.genderText}>Male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        gender === 'Female' && styles.genderButtonSelected,
                      ]}
                      onPress={() => setGender('Female')}
                    >
                      <Text style={styles.genderText}>Female</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.button}
                  onPress={updateProfileDetails}
                >
                  <FontAwesome name="save" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Update Profile</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Account Actions Card */}
            <View style={styles.settingsCard}>
              <Text style={styles.sectionTitle}>Account Actions</Text>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate('UpdatePassword')}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuIconContainer,
                      { backgroundColor: '#4A90E2' },
                    ]}
                  >
                    <FontAwesome name="lock" size={16} color="#fff" />
                  </View>
                  <Text style={styles.menuItemText}>Update Password</Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color="#9E9E9E" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={disableAccount}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuIconContainer,
                      { backgroundColor: '#E74C3C' },
                    ]}
                  >
                    <FontAwesome name="user-times" size={16} color="#fff" />
                  </View>
                  <Text style={styles.menuItemText}>Disable Account</Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color="#9E9E9E" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={confirmLogout}>
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuIconContainer,
                      { backgroundColor: '#E74C3C' },
                    ]}
                  >
                    <FontAwesome name="sign-out" size={16} color="#fff" />
                  </View>
                  <Text style={styles.menuItemText}>Logout</Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color="#9E9E9E" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  mainContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  contentContainer: {
    padding: 20,
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
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  profileCard: {
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
  profilePhotoContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#053559',
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
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
  updateSection: {
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginVertical: 10,
    borderRadius: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#053559',
    padding: 15,
    borderRadius: 10,
    marginVertical: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  genderContainer: {
    marginTop: 10,
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 5,
  },
  genderButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  genderButtonSelected: {
    backgroundColor: 'white',
    borderColor: '#053559',
  },
  genderText: {
    color: '#000',
    fontWeight: '600',
  },
  genderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#053559',
    marginBottom: 15,
  },
});
