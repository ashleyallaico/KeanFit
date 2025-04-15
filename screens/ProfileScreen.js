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
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
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
          const { feet, inches } = convertMetersToFeetInches(profileData.Height);
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

  const updateProfileDetails = () => {
    // Validate inputs
    if (
      !heightFeet || isNaN(heightFeet) || parseFloat(heightFeet) < 0 ||
      !heightInches || isNaN(heightInches) || parseFloat(heightInches) < 0 ||
      parseFloat(heightInches) >= 12 ||
      !weight || isNaN(weight) || parseFloat(weight) <= 0
    ) {
      Alert.alert('Validation Error', 'Please enter valid height (feet and inches) and weight.');
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
          Gender: gender || null
        }));
        Alert.alert('Update Successful', 'Your profile has been updated successfully.');
        setShowUpdateFields(false)
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.profilePhotoContainer}>
            <FontAwesome name="user-circle" size={80} color="#09355c" />
          </View>
          <View style={styles.content}>
            <View style={styles.card}>
              {profile ? (
                <>
                  <Text style={styles.contentText}>Name: {profile.Name}</Text>
                  <Text style={styles.contentText}>Email: {profile.Email}</Text>
                  <Text style={styles.contentText}>
                    BMI: {calculateBMI(profile.Height, profile.Weight) ?? 'N/A'}
                  </Text>
                  <Text style={styles.contentText}>
                    Height: {heightFeet} ft {heightInches} in
                  </Text>
                  <Text style={styles.contentText}>Weight: {profile.Weight} Pounds</Text>
                  <Text style={styles.contentText}>
                    Age: {dob ? calculateAge(dob) + ' years' : 'Not provided'}
                  </Text>
                  <Text style={styles.contentText}>
                    Gender: {gender || 'Not provided'}
                  </Text>

                </>
              ) : (
                <Text>Loading profile...</Text>
              )}
            </View>

            <View style={styles.section}>
              {/* Toggle update section button */}
              <TouchableOpacity
                style={styles.button}
                onPress={() => setShowUpdateFields(!showUpdateFields)}
              >
                <FontAwesome name="edit" size={20} color="#fff" />
                <Text style={styles.buttonText}>
                  {showUpdateFields ? "Hide Update Fields" : "Edit Profile Details"}
                </Text>
              </TouchableOpacity>
            </View>

            {showUpdateFields && (
              <View style={styles.updateSection}>
                <Text style={styles.updateLabel}>Update Profile Details</Text>
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
                    {dob ? new Date(dob).toLocaleDateString() : 'Select your date of birth'}
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
                        const now = new Date();
                        const age = calculateAge(tempDob);
                        if (age < 13 || age > 120) {
                          Alert.alert('Invalid DOB', 'Please enter a realistic birthdate (age must be 13+).');
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
                  <Text style={{ fontWeight: '600', marginBottom: 5 }}>Select Gender</Text>
                  <View style={styles.genderOptions}>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        gender === 'Male' && styles.genderButtonSelected
                      ]}
                      onPress={() => setGender('Male')}
                    >
                      <Text style={styles.genderText}>Male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        gender === 'Female' && styles.genderButtonSelected
                      ]}
                      onPress={() => setGender('Female')}
                    >
                      <Text style={styles.genderText}>Female</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity style={styles.button} onPress={updateProfileDetails}>
                  <FontAwesome name="save" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Update Profile</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.section}>
              {/* Preference Section */}
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
        </ScrollView>
        <NavBar />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profilePhotoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  content: {
    flex: 1,
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
  updateSection: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
  },
  updateLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginVertical: 10,
    borderRadius: 8,
  },
  contentText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    borderColor: '#09355c',
  },
  genderText: {
    color: '#000',
    fontWeight: '600',
  },
  
});
