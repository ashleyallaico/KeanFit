
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome'; 

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigation = useNavigation();

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
        navigation.navigate('Dashboard'); 
      })
      .catch((error) => {
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <TextInput
          style={styles.inputEmail}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address" 
        />
        <View style={styles.inputPasswordContainer}>
          <TextInput
            style={styles.inputPassword}
            placeholder="Password"
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={styles.icon}>
            <Icon name={passwordVisible ? 'eye-slash' : 'eye'} size={20} color="grey" />
          </TouchableOpacity>
        </View>
        <Button title="Login" onPress={handleLogin} />
        <Button title="Forgot Password?" onPress={() => navigation.navigate('ResetPassword')} />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  inputEmail: {
    height: 40,
    marginBottom: 12,
    borderWidth: 1,
    padding: 10,
    width: '100%', 
  },
  inputPasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputPassword: {
    flex: 1, 
    height: 40,
    borderWidth: 1,
    padding: 10,
  },
  icon: {
    padding: 10,
  }
});
