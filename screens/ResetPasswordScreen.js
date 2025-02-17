// screens/ResetPasswordScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');

  const handleResetPassword = () => {
    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert('Check your email', 'A link to reset your password has been sent to your email.');
      })
      .catch((error) => {
        console.error('Reset password error:', error);
        let message = '';
        if (error.code === 'auth/user-not-found') {
          message = 'No account found with this email. Please check the email entered or create a new account.';
        } else {
          message = `Error: ${error.message}`;
        }
        Alert.alert('Reset Error', message);
      });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <Button title="Reset Password" onPress={handleResetPassword} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    height: 40,
    marginBottom: 12,
    borderWidth: 1,
    padding: 10,
  }
});
