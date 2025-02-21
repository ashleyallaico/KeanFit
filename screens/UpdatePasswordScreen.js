import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import { auth } from '../services/firebaseConfig';
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from 'firebase/auth';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import NavBar from '../components/NavBar';

const UpdatePasswordScreen = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    const navigation = useNavigation();
  

  // const handleUpdatePassword = async () => {
  //   if (newPassword !== confirmNewPassword) {
  //     Alert.alert('Error', 'New passwords do not match.');
  //     return;
  //   }
  //   try {
  //     const user = auth.currentUser;
  //     const credential = EmailAuthProvider.credential(user.email, currentPassword);

  //     // Re-authenticate user
  //     await reauthenticateWithCredential(user, credential);
  //     // Update password
  //     await updatePassword(user, newPassword);
  //     Alert.alert('Success', 'Password updated successfully!');
  //   } catch (error) {
  //     Alert.alert('Error', error.message);
  //   }
  // };

  const isStrongPassword = (password) => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return strongPasswordRegex.test(password);
  };


  const handleUpdatePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
  
    if (!isStrongPassword(newPassword)) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.'
      );
      return;
    }
  
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
  
      // Re-authenticate user
      await reauthenticateWithCredential(user, credential);
      // Update password
      await updatePassword(user, newPassword);
  
      // Navigate after alert "OK"
      Alert.alert(
        'Success', 
        'Password updated successfully!',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Settings')
          },
        ],
        { cancelable: false }
      );
  
    
    } catch (error) {
      // Handle common errors gracefully
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Current password is incorrect.');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Error', 'New password is too weak.');
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  const PasswordInput = ({
    placeholder,
    value,
    setValue,
    showPassword,
    setShowPassword,
  }) => (
    <View style={styles.inputWrapper}>
      <View style={styles.inputContainer}>
        <FontAwesome
          name="lock"
          size={20}
          color="#09355c"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          secureTextEntry={!showPassword}
          value={value}
          onChangeText={setValue}
          placeholderTextColor="#666"
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        >
          <FontAwesome
            name={showPassword ? 'eye-slash' : 'eye'}
            size={20}
            color="#09355c"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Update Password</Text>
          <Text style={styles.headerSubtitle}>Keep your account secure</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <PasswordInput
              placeholder="Current Password"
              value={currentPassword}
              setValue={setCurrentPassword}
              showPassword={showCurrentPassword}
              setShowPassword={setShowCurrentPassword}
            />

            <PasswordInput
              placeholder="New Password"
              value={newPassword}
              setValue={setNewPassword}
              showPassword={showNewPassword}
              setShowPassword={setShowNewPassword}
            />

            <PasswordInput
              placeholder="Confirm New Password"
              value={confirmNewPassword}
              setValue={setConfirmNewPassword}
              showPassword={showConfirmNewPassword}
              setShowPassword={setShowConfirmNewPassword}
            />

            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdatePassword}
            >
              <FontAwesome name="check" size={20} color="#fff" />
              <Text style={styles.updateButtonText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </View>

        <NavBar />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#09355c',
    padding: 20,
    paddingTop: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    height: 50,
  },
  inputIcon: {
    padding: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 10,
    color: '#333',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09355c',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default UpdatePasswordScreen;
