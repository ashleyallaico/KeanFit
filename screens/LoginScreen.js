import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Button,
  StyleSheet,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
} from 'react-native';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigation = useNavigation();



  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
        const uid = userCredentials.user.uid;
        const db = getDatabase();
        const accountStatusRef = ref(db, `AccountDissable/${uid}`);

        onValue(
          accountStatusRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const isDisabled = snapshot.val();
              if (!isDisabled) {
                navigation.navigate('Dashboard');
              } else {
                Alert.alert(
                  'Reactivate Account',
                  'Your account is currently disabled. Do you want to reactivate your account?',
                  [
                    { text: 'Yes', onPress: () => reactivateAccount(uid) },
                    { text: 'No', style: 'cancel' },
                  ],
                  { cancelable: false }
                );
              }
            }
          },
          { onlyOnce: true }
        );
      })
      .catch((error) => handleAuthError(error));
  };


  const handleAuthError = (error) => {
    let message = '';
    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No account found with that email.';
        break;
      case 'auth/wrong-password':
      case 'auth/invalid-email':
        message = 'Invalid email or password. Please try again.';
        break;
      default:
        message = `Login failed: ${error.message}`;
    }
    Alert.alert('Login Error', message);
  };

  const reactivateAccount = (uid) => {
    const db = getDatabase();
    const accountStatusRef = ref(db, `AccountDissable/${uid}`);
    set(accountStatusRef, false)
      .then(() => {
        Alert.alert("Account Reactivated", "Your account has been reactivated.");
        navigation.navigate('Dashboard');
      })
      .catch(error => {
        Alert.alert("Account Reactivation Failed", error.message);
      });
  };



  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* KEANFIT Logo */}
        <Image source={require('../assets/KEANFIT.png')} style={styles.logo} />

        {/* Email Input */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Password Input with Toggle Icon */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(!passwordVisible)}
          >
            <Icon
              name={passwordVisible ? 'eye-slash' : 'eye'}
              size={20}
              color="gray"
            />
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        {/* Forgot Password & Sign Up Links */}
        <View style={styles.footerLinks}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ResetPassword')}
          >
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
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
  },

  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
    resizeMode: 'contain',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingLeft: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingLeft: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
