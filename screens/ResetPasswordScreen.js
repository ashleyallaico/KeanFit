import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const navigation = useNavigation();

  const handleResetPassword = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert(
          'Check your email',
          'A link to reset your password has been sent to your email.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      })
      .catch((error) => {
        console.error('Reset password error:', error);
        let message = '';
        if (error.code === 'auth/user-not-found') {
          message =
            'No account found with this email. Please check the email entered or create a new account.';
        } else {
          message = `Error: ${error.message}`;
        }
        Alert.alert('Reset Error', message);
      });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reset Password</Text>
          <Text style={styles.headerSubtitle}>
            Enter your email to receive reset instructions
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <FontAwesome
                  name="envelope"
                  size={20}
                  color="#09355c"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetPassword}
            >
              <FontAwesome name="paper-plane" size={20} color="#fff" />
              <Text style={styles.resetButtonText}>Send Reset Link</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Login')}
            >
              <FontAwesome name="arrow-left" size={20} color="#09355c" />
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.helpContainer}>
            <FontAwesome name="info-circle" size={20} color="#09355c" />
            <Text style={styles.helpText}>
              If you don't receive the email, please check your spam folder or
              try again.
            </Text>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

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
    textAlign: 'center',
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
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09355c',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#09355c',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  helpText: {
    flex: 1,
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
});
