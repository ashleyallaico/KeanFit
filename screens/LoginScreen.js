import React, { useState } from 'react';
import {
  View,
  TextInput,
<<<<<<< Updated upstream
  TouchableOpacity,
=======
>>>>>>> Stashed changes
  Text,
  Image,
  StyleSheet,
  Alert,
<<<<<<< Updated upstream
=======
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
>>>>>>> Stashed changes
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
<<<<<<< Updated upstream
=======
import { getDatabase, ref, onValue, set } from 'firebase/database';
import Icon from 'react-native-vector-icons/FontAwesome';
>>>>>>> Stashed changes

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
<<<<<<< Updated upstream
        console.log('Logged in with:', userCredentials.user.email);
        navigation.navigate('Dashboard');
      })
      .catch((error) => {
        console.error('Login Error:', error);
        Alert.alert(`Login Error: ${error.code} - ${error.message}`);
      });
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/KEANFIT.png')} style={styles.logo} />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        placeholderTextColor="#aaa"
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
=======
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

  const reactivateAccount = (uid) => {
    const db = getDatabase();
    set(ref(db, `AccountDissable/${uid}`), false)
      .then(() => {
        Alert.alert(
          'Account Reactivated',
          'Your account has been reactivated.'
        );
        navigation.navigate('Dashboard');
      })
      .catch((error) =>
        Alert.alert('Account Reactivation Failed', error.message)
      );
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
>>>>>>> Stashed changes
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
<<<<<<< Updated upstream
    backgroundColor: '#f4f4f4',
=======
>>>>>>> Stashed changes
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  logo: {
    width: 150,
    height: 150,
<<<<<<< Updated upstream
    marginBottom: 20,
=======
    marginBottom: 30,
    resizeMode: 'contain',
>>>>>>> Stashed changes
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
<<<<<<< Updated upstream
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
=======
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
    backgroundColor: '#09355c',
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
    color: '#09355c',
    fontSize: 16,
>>>>>>> Stashed changes
  },
});
