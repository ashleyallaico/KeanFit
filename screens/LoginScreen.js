import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const handleLogin = () => {
    console.log("Email:", email);
    console.log("Password:", password);

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredentials) => {
            console.log('Logged in with:', userCredentials.user.email);
            navigation.navigate('Dashboard'); 
        })
        .catch((error) => {
          console.error('Login Error:', error);
          let message = '';
          switch (error.code) {
            case 'auth/user-not-found':
              message = 'No user account found with that email. Please check your email or register.';
              break;
            case 'auth/wrong-password':
            case 'auth/invalid-email':
              message = 'Invalid Email or password. Please try again or reset your password if you forgot it.';
              break;
            default:
              message = `Login failed: ${error.message}`;
          }
          Alert.alert('Login Error', message);
        });
    };
  //       .catch((error) => {
  //           console.error('Login Error:', error);
  //           Alert.alert(`Login Error: ${error.code} - ${error.message}`);
  //       });
  // };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
      />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Forgot Password?" onPress={() => navigation.navigate('ResetPassword')}/>
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