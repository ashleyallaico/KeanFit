import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Alert, Button, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RemindersScreen = ({ navigation }) => {
  const [isWaterReminderEnabled, setIsWaterReminderEnabled] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);

  useEffect(() => {
    requestNotificationPermission();
    checkNotificationPermission();
    loadReminderToggleState();
  
    const intervalId = setInterval(() => {
      checkNotificationPermission();
    }, 5000);
  
    const foregroundSubscription = Notifications.addNotificationReceivedListener(handleNotificationReceived);
  
    return () => {
      clearInterval(intervalId);
      foregroundSubscription.remove();
    };
  }, []);  

  const requestNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setHasNotificationPermission(status === 'granted');
  };

  const checkNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    const isGranted = status === 'granted';
    setHasNotificationPermission(isGranted);

    if (!isGranted) {
      setIsWaterReminderEnabled(false);
    }
  };

  const handleNotificationReceived = (notification) => {
    console.log('Notification received!', notification);
  };

  const handleWaterReminderToggle = async (value) => {
    if (value) {
      if (!hasNotificationPermission) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            Platform.OS === 'ios'
              ? {
                  text: 'Open Settings',
                  onPress: () => Linking.openURL('app-settings:'),
                }
              : undefined,
          ].filter(Boolean)
        );
        setIsWaterReminderEnabled(false);
        return;
      }
  
      await scheduleWaterReminder();
      Alert.alert('Reminder Enabled', 'You will receive a reminder every hour.');
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      Alert.alert('Reminder Disabled', 'You will no longer receive reminders.');
    }
  
    try {
      await AsyncStorage.setItem('WATER_REMINDER_ENABLED', value.toString());
    } catch (e) {
      console.error('Failed to save toggle state', e);
    }
  
    setIsWaterReminderEnabled(value);
  };
  

  const scheduleWaterReminder = async () => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Repeating hourly at the top of the hour
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to Hydrate💧',
        body: 'Stay fresh & drink a glass of water!',
        sound: 'default',
      },
      trigger: {
        seconds: 60,
        repeats: true,
      },
    });
  };

  const loadReminderToggleState = async () => {
    try {
      const value = await AsyncStorage.getItem('WATER_REMINDER_ENABLED');
      if (value !== null) {
        setIsWaterReminderEnabled(value === 'true');
      }
    } catch (e) {
      console.error('Failed to load reminder toggle state', e);
    }
  };
  

  const SettingItem = ({ icon, title, children }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <FontAwesome name={icon} size={20} color="#09355c" />
        <Text style={styles.settingText}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <View style={styles.container}>
        <View style={styles.content}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reminders</Text>
                <View style={styles.card}>
                    <SettingItem icon="bell" title="Water Intake">
                        <Switch
                        trackColor={{ false: '#767577', true: '#09355c' }}
                        thumbColor={isWaterReminderEnabled ? '#fff' : '#f4f3f4'}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={handleWaterReminderToggle}
                        value={isWaterReminderEnabled}
                        disabled={!hasNotificationPermission}
                        />
                    </SettingItem>
                </View>
                {!hasNotificationPermission && (
                    <Text style={styles.permissionText}>
                    Notifications are disabled. Please enable them in your device settings.
                    </Text>
                )}
                <Button title="Back" onPress={() => navigation.goBack()} />
            </View>
      </View>
    </View>   
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  text: {
    fontSize: 20,
    color: '#09355c',
    marginBottom: 20,
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginVertical: 15,
  },
  reminderLabel: {
    fontSize: 18,
    color: '#09355c',
  },
  permissionText: {
    fontSize: 16,
    color: '#d9534f',
    marginTop: 20,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#09355c',
    marginBottom: 10,
    marginLeft: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
});

export default RemindersScreen;