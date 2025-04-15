import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  SafeAreaView,
  StatusBar,
} from 'react-native';

export default function SplashScreen({ onAnimationFinish }) {
  const [readyToTransition, setReadyToTransition] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const buttonOpacity = React.useRef(new Animated.Value(0)).current;

  // Fade in the splash screen
  useEffect(() => {
    Animated.sequence([
      // Fade in splash screen elements
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Then fade in the button
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    setReadyToTransition(true);

    // Animate the slide up transition
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      // Callback to parent when animation is done
      if (onAnimationFinish) {
        onAnimationFinish();
      }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -Dimensions.get('window').height],
                }),
              },
            ],
          },
        ]}
      >
        {/* KEANFIT Mascot and Background */}
        <Image
          source={require('../assets/LoginScreen.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        {/* Get Started Button */}
        <Animated.View
          style={[styles.buttonContainer, { opacity: buttonOpacity }]}
        >
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            disabled={readyToTransition}
          >
            <Text style={styles.getStartedText}>GET STARTED</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fcc931', // Dark blue background matching the image
  },
  container: {
    flex: 1,
    backgroundColor: '#fcc931',
  },
  backgroundImage: {
    width: '100%',
    height: '96%',
    position: 'absolute',
    marginTop: -60,
  },
  buttonContainer: {
    position: 'absolute',
    width: '100%',
    bottom: 50,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  getStartedButton: {
    backgroundColor: '#FFCC00', // Kean yellow color
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  getStartedText: {
    color: '#09355c', // Dark blue text
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
