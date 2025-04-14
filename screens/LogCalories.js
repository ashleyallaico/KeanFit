import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    FlatList,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Alert } from 'react-native';
import NavBar from '../components/NavBar';
import { auth } from '../services/firebaseConfig';
import { getDatabase, ref, push, set, onValue } from 'firebase/database';
import { remove } from 'firebase/database';

const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (`0${today.getMonth() + 1}`).slice(-2); // months are 0-based
    const day = (`0${today.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`; // Format: YYYY-MM-DD
};

export default function LogCaloriesScreen() {
    const [foodTitle, setFoodTitle] = useState('');
    const [servingSize, setServingSize] = useState('');
    const [caloriesPerServing, setCaloriesPerServing] = useState('');
    const [entries, setEntries] = useState([]);
    const [editIndex, setEditIndex] = useState(null);

    const today = getTodayDateString();

    const handleSubmit = () => {
        const db = getDatabase();
        const user = auth.currentUser;


        if (!foodTitle || !servingSize || !caloriesPerServing) {
            Alert.alert("Missing Information", "Please fill in all fields.");
            return;
        }

        const calories =
            parseFloat(servingSize) * parseFloat(caloriesPerServing);

        if (isNaN(calories)) {
            Alert.alert("Invalid Input", "Please enter valid numbers for servings and calories.");
            return;
        }

        if (user) {
            const now = new Date();
            const calorieData = {
                title: foodTitle,
                servingSize: parseFloat(servingSize),
                caloriesPerServing: parseFloat(caloriesPerServing),
                calories,
                date: getTodayDateString(),
            };

            const caloriesRef = ref(db, `Calories/${user.uid}`);
            
            if (editIndex !== null) {       
                const entryToEdit = entries[editIndex];       
                const entryRef = ref(db, `Calories/${user.uid}/${entryToEdit.key}`);      
                set(entryRef, { ...calorieData, key: entryToEdit.key })
        
                .then(() => {
                    console.log('Entry updated successfully!');
                    Alert.alert('Updated', 'Entry updated!');
                    setFoodTitle('');       
                    setServingSize('');      
                    setCaloriesPerServing('');       
                    setEditIndex(null);       
                })
        
                .catch(error => {
                    console.error('Update failed:', error);
                    Alert.alert('Error', 'Failed to update entry.');
                });
        
            } else {
            
            const newCalorieRef = push(caloriesRef);

            set(newCalorieRef, calorieData)
                .then(() => {
                    console.log('Calories logged successfully!');
                    Alert.alert('Success', 'Calories logged successfullt!');
                    setFoodTitle('');
                    setServingSize('');
                    setCaloriesPerServing('');
                    setEditIndex(null);
                })
                .catch((error) => {
                    console.error('Failed to log calories:', error);
                    Alert.alert('Error', 'Failed to save. Please try again.');
                });
            }
        } else {
            Alert.alert('Authentication Required', 'Please log in to track your food.');
        }
    };

    const handleEdit = (index) => {
        const entry = entries[index];
        setFoodTitle(entry.title);
        setServingSize(entry.servingSize.toString());
        setCaloriesPerServing(entry.caloriesPerServing.toString());
        setEditIndex(index);
    };

    const handleRemove = (index) => {
        const db = getDatabase();
        const user = auth.currentUser;
        
        if (!user) {
            Alert.alert('Authentication Required', 'Please log in to remove entries.');
            return;
        }
        
        const entryToRemove = entries[index];
        const entryRef = ref(db, `Calories/${user.uid}/${entryToRemove.key}`);
        
        remove(entryRef)
        .then(() => {
            console.log('Entry removed successfully.');
            const filtered = entries.filter((_, i) => i !== index);
            setEntries(filtered);
        })
        .catch((error) => {
            console.error('Error removing entry:', error);
            Alert.alert('Error', 'Failed to remove entry. Please try again.');
        });
    };

    const groupByDate = () => {
        const grouped = {};
        entries.forEach(entry => {
            if (!grouped[entry.date]) grouped[entry.date] = [];
            grouped[entry.date].push(entry);
        });
        return grouped;
    };

    const dailyGroups = groupByDate();

    const CalorieVisualBar = ({ total }) => {
        const maxCalories = 3000;
        const percentage = Math.min((total / maxCalories) * 100, 100);

        return (
            <View style={styles.barBackground}>
                <View style={[styles.barFill, { width: `${percentage}%` }]} />
            </View>
        );
    };

    useEffect(() => {
        const db = getDatabase();
        const userId = auth.currentUser?.uid;
        const caloriesRef = ref(db, `Calories/${userId}`);
        const unsubscribe = onValue(caloriesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const loadedEntries = Object.entries(data).map(([key, value]) => ({
                    ...value,
                    key,
                }));
                setEntries(loadedEntries);
            } else {
                setEntries([]);
            }
        });
        return () => unsubscribe();
    }, []);

    const dailyGroup = groupByDate();

    const totalCaloriesToday = entries
        .filter(e => e.date === today)
        .reduce((sum, e) => sum + e.calories, 0);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Log Calories</Text>
            <TextInput
                placeholder="Title of Food"
                value={foodTitle}
                onChangeText={setFoodTitle}
                style={styles.input}
            />
            <TextInput
                placeholder="Serving Size"
                value={servingSize}
                onChangeText={setServingSize}
                keyboardType="numeric"
                style={styles.input}
            />
            <TextInput
                placeholder="Calories per Serving"
                value={caloriesPerServing}
                onChangeText={setCaloriesPerServing}
                keyboardType="numeric"
                style={styles.input}
            />

            <Button
                title={editIndex !== null ? 'Update Entry' : 'Add Calories'}
                onPress={handleSubmit}
            />

            <Text style={styles.total}>Total Calories Today: {totalCaloriesToday}</Text>
            <CalorieVisualBar total={totalCaloriesToday} />

            <Text style={styles.subtitle}>Today's Entries</Text>
            <FlatList
                data={entries.filter(e => e.date === today)}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <View style={styles.item}>
                        <Text>{item.title} - {item.calories} cal</Text>
                        <View style={styles.itemButtons}>
                            <TouchableOpacity onPress={() => handleEdit(index)}>
                                <Text style={styles.edit}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleRemove(index)}>
                                <Text style={styles.remove}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            <Text style={styles.subtitle}>Calories History</Text>
            {Object.entries(dailyGroups).map(([date, dayEntries]) => {
                const total = dayEntries.reduce((sum, e) => sum + e.calories, 0);
                return (
                    <View key={date} style={styles.historyItem}>
                        <Text style={styles.historyDate}>{date}</Text>
                        <Text>{total} cal</Text>
                        <CalorieVisualBar total={total} />
                    </View>
                );
            })}
        <NavBar />
        </View>
    );
};



const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
        backgroundColor: '#fefefe',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 20,
        marginTop: 20,
        fontWeight: 'bold',
    },
    total: {
        fontSize: 18,
        marginVertical: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 10,
        padding: 10,
        borderRadius: 6,
    },
    item: {
        padding: 10,
        backgroundColor: '#eee',
        marginVertical: 5,
        borderRadius: 6,
    },
    itemButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 5,
    },
    edit: {
        color: 'blue',
        marginRight: 15,
    },
    remove: {
        color: 'red',
    },
    barBackground: {
        height: 20,
        backgroundColor: '#ddd',
        borderRadius: 10,
        marginTop: 5,
        marginBottom: 10,
        overflow: 'hidden',
    },
    barFill: {
        height: 20,
        backgroundColor: '#4caf50',
    },
    historyItem: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        marginVertical: 5,
        borderRadius: 6,
    },
    historyDate: {
        fontWeight: 'bold',
    },
});