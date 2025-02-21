

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Keyboard, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import { auth } from '../services/firebaseConfig';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';

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



  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Current Password"
            secureTextEntry={!showCurrentPassword}
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
            <Icon name={showCurrentPassword ? 'eye-slash' : 'eye'} size={20} color="grey" />
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            secureTextEntry={!showNewPassword}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
            <Icon name={showNewPassword ? 'eye-slash' : 'eye'} size={20} color="grey" />
          </TouchableOpacity>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Confirm New Password"
            secureTextEntry={!showConfirmNewPassword}
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
            <Icon name={showConfirmNewPassword ? 'eye-slash' : 'eye'} size={20} color="grey" />
          </TouchableOpacity>
        </View>
        <Button title="Update Password" onPress={handleUpdatePassword} />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    padding: 10,
  }
});

export default UpdatePasswordScreen;
