import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';


import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID
} from '@env';


const firebaseConfig = {
  apiKey: "AIzaSyBfIEMi8GHTL1qOjzMB17NIud2x2MUbi3U",
  authDomain: "keanfit-7923d.firebaseapp.com",
  projectId: "keanfit-7923d",
  storageBucket: "keanfit-7923d.appspot.com",
  messagingSenderId: "752185559064",
  appId: "1:752185559064:ios:0273e3a7159dd045a01b6d"
};


// Initialize Firebase App
const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { auth };
