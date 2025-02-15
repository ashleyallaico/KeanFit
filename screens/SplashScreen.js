import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import animation from '../assets/animation.json'; 

const SplashScreen = ({ onAnimationFinish }) => {
  return (
    <View style={styles.container}>
      <LottieView
        source={animation}
        autoPlay
        loop={false}
        onAnimationFinish={onAnimationFinish} 
        style={styles.animation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  animation: {
    width: 400, 
    height: 400, 
  },
});

export default SplashScreen;
