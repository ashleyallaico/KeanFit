import React, { useState } from 'react';
import { View, Text, Switch, Button, StyleSheet } from 'react-native';
import NavBar from '../components/NavBar'; 
import { useNavigation } from '@react-navigation/native'; 


const SettingsScreen = () => {
    const [isEnabledNotifications, setIsEnabledNotifications] = useState(false);
    const [isEnabledDarkMode, setIsEnabledDarkMode] = useState(false);

    const navigation = useNavigation(); 


    const toggleSwitchNotifications = () => setIsEnabledNotifications(previousState => !previousState);
    const toggleSwitchDarkMode = () => setIsEnabledDarkMode(previousState => !previousState);

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

