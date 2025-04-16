import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  SafeAreaView,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import NavBar from '../components/NavBar';

const RemindersScreen = () => {
  const navigation = useNavigation();
  const [isWaterReminderEnabled, setIsWaterReminderEnabled] = useState(false);
  const [isWorkoutReminderEnabled, setIsWorkoutReminderEnabled] =
    useState(false);
  const [isMealReminderEnabled, setIsMealReminderEnabled] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] =
    useState(false);

  useEffect(() => {
    requestNotificationPermission();
    checkNotificationPermission();
    loadReminderToggleState();

    const intervalId = setInterval(() => {
      checkNotificationPermission();
    }, 5000);

    const foregroundSubscription =
      Notifications.addNotificationReceivedListener(handleNotificationReceived);

    // Set header options
    navigation.setOptions({
      headerShown: false,
    });

    return () => {
      clearInterval(intervalId);
      foregroundSubscription.remove();
    };
  }, [navigation]);

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
      setIsWorkoutReminderEnabled(false);
      setIsMealReminderEnabled(false);
    }
  };

  const handleNotificationReceived = (notification) => {
    console.log('Notification received!', notification);
  };

  const handleReminderToggle = async (reminderType, value, setter) => {
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
        setter(false);
        return;
      }

      await scheduleReminder(reminderType);
      Alert.alert(
        'Reminder Enabled',
        `You will receive ${reminderType} reminders.`
      );
    } else {
      // Only cancel the specific reminder type in a real app
      // For simplicity here, we cancel all
      await Notifications.cancelAllScheduledNotificationsAsync();
      Alert.alert(
        'Reminder Disabled',
        `You will no longer receive ${reminderType} reminders.`
      );
    }

    try {
      await AsyncStorage.setItem(
        `${reminderType.toUpperCase()}_REMINDER_ENABLED`,
        value.toString()
      );
    } catch (e) {
      console.error('Failed to save toggle state', e);
    }

    setter(value);
  };

  const scheduleReminder = async (reminderType) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    let title, body, interval;

    switch (reminderType) {
      case 'water':
        title = 'Time to Hydrate 💧';
        body = 'Stay fresh & drink a glass of water!';
        interval = 60 * 60; // 1 hour in seconds
        break;
      case 'workout':
        title = 'Workout Time 💪';
        body = "Don't forget your scheduled workout today!";
        interval = 24 * 60 * 60; // 24 hours in seconds
        break;
      case 'meal':
        title = 'Food Tracking Reminder 🍽️';
        body = 'Remember to log your meals for better nutrition tracking!';
        interval = 4 * 60 * 60; // 4 hours in seconds
        break;
      default:
        interval = 60 * 60;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
      },
      trigger: {
        seconds: interval,
        repeats: true,
      },
    });
  };

  const loadReminderToggleState = async () => {
    try {
      const waterValue = await AsyncStorage.getItem('WATER_REMINDER_ENABLED');
      const workoutValue = await AsyncStorage.getItem(
        'WORKOUT_REMINDER_ENABLED'
      );
      const mealValue = await AsyncStorage.getItem('MEAL_REMINDER_ENABLED');

      if (waterValue !== null) {
        setIsWaterReminderEnabled(waterValue === 'true');
      }
      if (workoutValue !== null) {
        setIsWorkoutReminderEnabled(workoutValue === 'true');
      }
      if (mealValue !== null) {
        setIsMealReminderEnabled(mealValue === 'true');
      }
    } catch (e) {
      console.error('Failed to load reminder toggle state', e);
    }
  };

  const ReminderItem = ({
    icon,
    iconFamily,
    title,
    description,
    isEnabled,
    onToggle,
  }) => (
    <View style={styles.reminderItem}>
      <View style={styles.reminderIconContainer}>
        {iconFamily === 'FontAwesome5' ? (
          <FontAwesome5 name={icon} size={20} color="#09355c" />
        ) : (
          <FontAwesome name={icon} size={20} color="#09355c" />
        )}
      </View>
      <View style={styles.reminderDetails}>
        <Text style={styles.reminderTitle}>{title}</Text>
        <Text style={styles.reminderDescription}>{description}</Text>
      </View>
      <Switch
        trackColor={{ false: '#e0e0e0', true: '#09355c' }}
        thumbColor={isEnabled ? '#fff' : '#f4f3f4'}
        ios_backgroundColor="#e0e0e0"
        onValueChange={onToggle}
        value={isEnabled}
        disabled={!hasNotificationPermission}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#053559"
        translucent={true}
      />

      {/* Hero Section with Background */}
      <ImageBackground
        source={require('../assets/KeanBG.png')}
        style={styles.heroSection}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay}>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <FontAwesome name="chevron-left" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Reminders</Text>
              <Text style={styles.headerSubtitle}>
                Stay on track with notifications
              </Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {!hasNotificationPermission && (
            <View style={styles.permissionCard}>
              <FontAwesome5
                name="bell-slash"
                size={24}
                color="#d9534f"
                style={styles.permissionIcon}
              />
              <Text style={styles.permissionText}>
                Notifications are disabled. Please enable them in your device
                settings to receive reminders.
              </Text>
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={() => Linking.openURL('app-settings:')}
                >
                  <Text style={styles.settingsButtonText}>Open Settings</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.cardContainer}>
            <Text style={styles.sectionTitle}>Daily Reminders</Text>
            <View style={styles.card}>
              <ReminderItem
                icon="tint"
                iconFamily="FontAwesome"
                title="Water Intake"
                description="Hourly reminders to stay hydrated"
                isEnabled={isWaterReminderEnabled}
                onToggle={(value) =>
                  handleReminderToggle(
                    'water',
                    value,
                    setIsWaterReminderEnabled
                  )
                }
              />

              <View style={styles.divider} />

              <ReminderItem
                icon="dumbbell"
                iconFamily="FontAwesome5"
                title="Workout Reminder"
                description="Daily reminder for your fitness routine"
                isEnabled={isWorkoutReminderEnabled}
                onToggle={(value) =>
                  handleReminderToggle(
                    'workout',
                    value,
                    setIsWorkoutReminderEnabled
                  )
                }
              />

              <View style={styles.divider} />

              <ReminderItem
                icon="utensils"
                iconFamily="FontAwesome5"
                title="Meal Tracking"
                description="Reminders to log your nutrition intake"
                isEnabled={isMealReminderEnabled}
                onToggle={(value) =>
                  handleReminderToggle('meal', value, setIsMealReminderEnabled)
                }
              />
            </View>
          </View>

          <View style={styles.infoCard}>
            <FontAwesome5
              name="info-circle"
              size={24}
              color="#09355c"
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              Reminders help you build healthy habits. Enable the ones that will
              help you reach your fitness goals.
            </Text>
          </View>

          {/* Bottom spacing for NavBar */}
          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      <NavBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  heroSection: {
    height: Platform.OS === 'ios' ? 160 : 120,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: -60,
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 53, 92, 0.65)',
    justifyContent: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 25 : 5,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginTop: 30,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 30,
    marginLeft: 70,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginLeft: 30,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  cardContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#09355c',
    marginBottom: 12,
    marginLeft: 5,
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
    shadowRadius: 8,
    elevation: 4,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  reminderIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(9, 53, 92, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  reminderDetails: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 5,
  },
  permissionCard: {
    backgroundColor: '#fff8f8',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    alignItems: 'center',
  },
  permissionIcon: {
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 15,
  },
  settingsButton: {
    backgroundColor: '#09355c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 5,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'rgba(9, 53, 92, 0.08)',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoIcon: {
    marginRight: 15,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#09355c',
    lineHeight: 20,
  },
});

export default RemindersScreen;
