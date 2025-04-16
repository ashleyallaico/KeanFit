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
  StatusBar,
  ImageBackground,
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

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  });

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

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.contentContainer}>
            {/* Profile Photo and Name */}
            <View style={styles.profileCard}>
              <View style={styles.profilePhotoContainer}>
                <FontAwesome name="user-circle" size={100} color="#fff" />
              </View>
              {profile && (
                <Text style={styles.profileName}>{profile.Name}</Text>
              )}
            </View>

            {/* Profile Information Card */}
            <View style={styles.settingsCard}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              {profile ? (
                <View style={styles.infoContainer}>
                  <View style={styles.infoRow}>
                    <FontAwesome
                      name="envelope"
                      size={16}
                      color="#053559"
                      style={styles.infoIcon}
                    />
                    <Text style={styles.infoText}>Email: {profile.Email}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <FontAwesome
                      name="calculator"
                      size={16}
                      color="#053559"
                      style={styles.infoIcon}
                    />
                    <Text style={styles.infoText}>
                      BMI:{' '}
                      {calculateBMI(profile.Height, profile.Weight) ?? 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <FontAwesome
                      name="arrows-v"
                      size={16}
                      color="#053559"
                      style={styles.infoIcon}
                    />
                    <Text style={styles.infoText}>
                      Height: {heightFeet} ft {heightInches} in
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <FontAwesome
                      name="balance-scale"
                      size={16}
                      color="#053559"
                      style={styles.infoIcon}
                    />
                    <Text style={styles.infoText}>
                      Weight: {profile.Weight} Pounds
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <FontAwesome
                      name="birthday-cake"
                      size={16}
                      color="#053559"
                      style={styles.infoIcon}
                    />
                    <Text style={styles.infoText}>
                      Age: {dob ? calculateAge(dob) + ' years' : 'Not provided'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <FontAwesome
                      name="venus-mars"
                      size={16}
                      color="#053559"
                      style={styles.infoIcon}
                    />
                    <Text style={styles.infoText}>
                      Gender: {gender || 'Not provided'}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.loadingText}>Loading profile...</Text>
              )}
            </View>

            {/* Edit Profile Button */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowUpdateFields(!showUpdateFields)}
            >
              <FontAwesome name="edit" size={20} color="#fff" />
              <Text style={styles.editButtonText}>
                {showUpdateFields
                  ? 'Hide Update Fields'
                  : 'Edit Profile Details'}
              </Text>
            </TouchableOpacity>

            {/* Update Fields Section */}
            {showUpdateFields && (
              <View style={styles.settingsCard}>
                <Text style={styles.sectionTitle}>Update Profile Details</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Height (feet)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter height (feet)"
                    value={heightFeet}
                    onChangeText={setHeightFeet}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Height (inches)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter height (inches)"
                    value={heightInches}
                    onChangeText={setHeightInches}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Weight (pounds)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new weight (pounds)"
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Date of Birth</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={{ color: dob ? '#000' : '#999' }}>
                      {dob
                        ? new Date(dob).toLocaleDateString()
                        : 'Select your date of birth'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showDatePicker && (
                  <View style={styles.datePickerContainer}>
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
                      style={styles.saveDateButton}
                      onPress={() => {
                        const now = new Date();
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
                      <Text style={styles.saveDateButtonText}>
                        Save Date of Birth
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.genderContainer}>
                  <Text style={styles.genderLabel}>Select Gender</Text>
                  <View style={styles.genderOptions}>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        gender === 'Male' && styles.genderButtonSelected,
                      ]}
                      onPress={() => setGender('Male')}
                    >
                      <Text
                        style={[
                          styles.genderText,
                          gender === 'Male' && styles.genderTextSelected,
                        ]}
                      >
                        Male
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        gender === 'Female' && styles.genderButtonSelected,
                      ]}
                      onPress={() => setGender('Female')}
                    >
                      <Text
                        style={[
                          styles.genderText,
                          gender === 'Female' && styles.genderTextSelected,
                        ]}
                      >
                        Female
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={updateProfileDetails}
                >
                  <FontAwesome name="save" size={20} color="#fff" />
                  <Text style={styles.updateButtonText}>Update Profile</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Account Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('UpdatePassword')}
              >
                <FontAwesome name="lock" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Update Password</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.disableButton]}
                onPress={disableAccount}
              >
                <FontAwesome name="user-times" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Disable Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>

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
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  profileCard: {
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
  profilePhotoContainer: {
    marginBottom: 15,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
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
  infoContainer: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoIcon: {
    marginRight: 10,
    width: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#053559',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  dateInput: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  datePickerContainer: {
    marginTop: 10,
  },
  saveDateButton: {
    backgroundColor: '#053559',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveDateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  genderContainer: {
    marginTop: 20,
  },
  genderLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 5,
  },
  genderButtonSelected: {
    backgroundColor: '#053559',
    borderColor: '#053559',
  },
  genderText: {
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
  },
  genderTextSelected: {
    color: '#fff',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#053559',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  actionsContainer: {
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#053559',
    padding: 15,
    borderRadius: 10,
  },
  disableButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});
