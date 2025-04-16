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
import StepTrackingScreen from '../screens/StepTrackingScreen';
import MyStepsScreen from '../screens/MyStepsScreen';
import UserStats from '../components/UserStats';
import MealPreferencesScreen from '../screens/MealPreferencesScreen';
import LogCaloriesScreen from '../screens/LogCalories';
import RemindersScreen from '../screens/RemindersScreen';

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
        name="StepTracking"
        component={StepTrackingScreen}
        options={{ title: 'Step Tracking' }}
      />
      <Stack.Screen
        name="TrackWorkout"
        component={TrackWorkoutScreen}
        options={{ title: 'Track Workout', headerBackVisible: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile', headerBackVisible: false }}
      />
      <Stack.Screen
        name="MyWorkout"
        component={MyWorkoutScreen}
        options={{ title: 'My Workouts', headerBackVisible: false }}
      />
      <Stack.Screen
        name="MyGoalsScreen"
        component={MyGoalsScreen}
        options={{ title: 'Fitness Goals', headerBackVisible: false }}
      />
      <Stack.Screen
        name="Workouts"
        component={WorkoutsScreen}
        options={{ title: 'Workouts', headerBackVisible: false }}
      />
      <Stack.Screen
        name="WorkoutPreferences"
        component={WorkoutPreferences}
        options={{ title: 'Workout Preference', headerBackVisible: false }}
      />
      <Stack.Screen
        name="MySteps"
        component={MyStepsScreen}
        options={{ title: 'MySteps', headerBackVisible: false }}
      />
      <Stack.Screen
        name="MyActivity"
        component={UserStats}
        options={{ title: 'My Activities', headerBackVisible: false }}
      />
      <Stack.Screen
        name="MealPreferences"
        component={MealPreferencesScreen}
        options={{ title: 'Meal Preferences', headerBackVisible: false }}
      />
      <Stack.Screen
        name="LogCalories"
        component={LogCaloriesScreen}
        options={{ title: 'Calories Log', headerBackVisible: false }}
      />
      <Stack.Screen
        name="Reminders" // Add Reminders screen to the navigator
        component={RemindersScreen}
        options={{ title: 'Notifications', headerBackVisible: false }} // Customize options as needed
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
