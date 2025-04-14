import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import SplashScreen from './screens/SplashScreen'; // Import the Splash Screen

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <NavigationContainer>
      {isLoading ? (
        <SplashScreen onAnimationFinish={() => setIsLoading(false)} />
      ) : (
        <AppNavigator />
      )}
    </NavigationContainer>
  );
}
