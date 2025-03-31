import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Disclaimer = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Disclaimer</Text>
      <Text style={styles.message}>
        The exercises shown in this app are provided for informational purposes only and are not a substitute for professional advice. Please exercise caution and consult with a professional before beginning any exercise program. We are not responsible for any injuries or damages that may occur.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#09355c',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default Disclaimer;
