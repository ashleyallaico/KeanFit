import React, { useState } from 'react';
import { View, Text, Switch, Button, StyleSheet, Alert } from 'react-native';
import NavBar from '../components/NavBar'; 
import { useNavigation } from '@react-navigation/native'; 
import { getDatabase, ref, set } from 'firebase/database';
import { auth } from '../services/firebaseConfig';  

const SettingsScreen = () => {
    const [isEnabledNotifications, setIsEnabledNotifications] = useState(false);
    const [isEnabledDarkMode, setIsEnabledDarkMode] = useState(false);
    const navigation = useNavigation(); 

    const toggleSwitchNotifications = () => setIsEnabledNotifications(!isEnabledNotifications);
    const toggleSwitchDarkMode = () => setIsEnabledDarkMode(!isEnabledDarkMode);

    const disableAccount = () => {
        const userId = auth.currentUser.uid; 
        const db = getDatabase();
        const accountStatusRef = ref(db, `AccountDissable/${userId}`);

        set(accountStatusRef, true)
            .then(() => {
                auth.signOut()
                .then(() => { 
                    navigation.replace('Login');
                    Alert.alert("Account Disabled", "Your account has been disabled successfully.");
                }).catch((error) => {
                    Alert.alert("Logout Failed", error.message);
                });
            })
            .catch((error) => {
                Alert.alert("Error", "Failed to disable account: " + error.message);
            });
    };

    return (
        <View style={styles.container}>
            <NavBar />
            <Text style={styles.title}>Settings</Text>
            <View style={styles.setting}>
                <Text>Enable Notifications</Text>
                <Switch
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={isEnabledNotifications ? "#f5dd4b" : "#f4f3f4"}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={toggleSwitchNotifications}
                    value={isEnabledNotifications}
                />
            </View>
            <View style={styles.setting}>
                <Text>Enable Dark Mode</Text>
                <Switch
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={isEnabledDarkMode ? "#f5dd4b" : "#f4f3f4"}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={toggleSwitchDarkMode}
                    value={isEnabledDarkMode}
                />
            </View>
            <Button
                title="Update Password"
                onPress={() => navigation.navigate('UpdatePassword')}
            />
            <Button
                title="Disable Account"
                color="red"
                onPress={disableAccount}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        margin: 10,
    },
    setting: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 10,
        width: '90%',
    }
});

export default SettingsScreen;

