import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import SettingsScreen from '../screens/SettingsScreen'; 
import UpdatePasswordScreen from '../screens/UpdatePasswordScreen'; 
import TrackWorkoutScreen from '../screens/TrackWorkoutScreen'; 
import ProfileScreen from '../screens/ProfileScreen'; 
import MyWorkoutScreen from '../screens/MyWorkoutScreen'; 
import MyGoalsScreen from '../screens/MyGoalsScreen'; 
import WorkoutsScreen from '../screens/WorkoutsScreen'; 
import WorkoutPreferences from '../screens/WorkoutPreferences';


const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: 'Sign In',
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard', headerBackVisible: false }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{
          title: 'Reset Password',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="UpdatePassword"
        component={UpdatePasswordScreen}
        options={{ title: 'Update Password' }}
      />
      <Stack.Screen
        name="TrackWorkout"
        component={TrackWorkoutScreen}
        options={{ title: 'Track Workout', headerBackVisible: false  }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile', headerBackVisible: false  }}
      />
      <Stack.Screen
        name="MyWorkout"
        component={MyWorkoutScreen}
        options={{ title: 'My Workouts', headerBackVisible: false  }}
      />
      <Stack.Screen
        name="MyGoalsScreen"
        component={MyGoalsScreen}
        options={{ title: 'My Goals Screen', headerBackVisible: false  }}
      />
      <Stack.Screen
        name="Workouts"
        component={WorkoutsScreen}
        options={{ title: 'Workouts', headerBackVisible: false  }}
      />
      <Stack.Screen
        name="WorkoutPreferences"
        component={WorkoutPreferences}
        options={{ title: 'Workout Preference', headerBackVisible: false  }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;