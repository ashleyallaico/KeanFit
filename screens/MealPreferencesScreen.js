import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { getDatabase, ref, set, get, child } from 'firebase/database';
import { auth } from '../services/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { calculateAge } from '../utils/ageCalculator';
import NavBar from '../components/NavBar';

const activityLevels = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'];
const goals = ['lose_weight', 'maintain_weight', 'gain_muscle'];
const dietaryOptions = ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_allergy'];
const cuisines = ['mexican', 'italian', 'asian', 'mediterranean', 'american'];
const skillLevels = ['easy', 'intermediate', 'advanced'];



export default function MealPreferencesScreen() {
    const [existingPreferences, setExistingPreferences] = useState(null);
    const [showAllFields, setShowAllFields] = useState(false);
    const [preferencesLoaded, setPreferencesLoaded] = useState(false);
    const [data, setData] = useState({
        activityLevel: '',
        goal: '',
        dietaryRestrictions: [],
        mealFrequency: '',
        preferredCuisines: [],
        cookingSkill: '',
    });
    const [userInfo, setUserInfo] = useState({
        height: null,
        weight: null,
        dob: null,
        gender: '',
    });
    const isMissing = (key) => {
        return !existingPreferences || !existingPreferences[key] || existingPreferences[key].length === 0;
    };
    const [mealSuggestions, setMealSuggestions] = useState([]);


    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();
    const userId = auth.currentUser?.uid;

    const db = getDatabase();
    const preferencesRef = ref(db, `MealPreferences/${userId}`);

    useEffect(() => {
        const dbRef = ref(getDatabase());

        const fetchMealPreferences = get(child(dbRef, `MealPreferences/${userId}`));
        const fetchUserProfile = get(child(dbRef, `Users/${userId}`));

        Promise.all([fetchMealPreferences, fetchUserProfile])
            .then(([mealSnap, profileSnap]) => {
                if (mealSnap.exists()) {
                    const prefs = mealSnap.val();
                    setExistingPreferences(prefs);
                    setData({
                        activityLevel: prefs.activityLevel || '',
                        goal: prefs.goal || '',
                        dietaryRestrictions: prefs.dietaryRestrictions || [],
                        mealFrequency: prefs.mealFrequency || '',
                        preferredCuisines: prefs.preferredCuisines || [],
                        cookingSkill: prefs.cookingSkill || '',
                    });
                }

                if (profileSnap.exists()) {
                    const data = profileSnap.val();
                    setUserInfo({
                        height: data.Height || null,
                        weight: data.Weight || null,
                        dob: data.DOB || null,
                        gender: data.Gender || '',
                    });
                }

                setPreferencesLoaded(true);
                setLoading(false);
            })
            .catch((error) => {
                console.error(error);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!preferencesLoaded) return;

        if (!existingPreferences) {
            Alert.alert(
                'No Preferences Found',
                'Please fill all the fields in order to get meal recommendations.'
            );
            return;
        }

        const fetchMeals = async () => {
            const dbRef = ref(getDatabase());
            try {
                const snapshot = await get(child(dbRef, `Meals`));
                if (snapshot.exists()) {
                    const meals = Object.values(snapshot.val());


                    const scoredMeals = meals.map((meal) => {
                        const matchedTags = [];

                        if (meal.goal === existingPreferences.goal) matchedTags.push('Goal');
                        if (meal.activityLevel === existingPreferences.activityLevel) matchedTags.push('Activity Level');
                        if (existingPreferences.preferredCuisines.includes(meal.cuisine)) matchedTags.push('Cuisine');
                        if (meal.skill === existingPreferences.cookingSkill) matchedTags.push('Cooking Skill');

                        const dietaryMatch =
                            existingPreferences.dietaryRestrictions.length === 0 ||
                            meal.dietaryTags.some(tag => existingPreferences.dietaryRestrictions.includes(tag));
                        if (dietaryMatch) matchedTags.push('Dietary Restriction');

                        return {
                            ...meal,
                            matchedTags,
                            matchCount: matchedTags.length,
                        };
                    });

                    const sortedMeals = scoredMeals
                        .filter((meal) => meal.matchCount >= 3)
                        .sort((a, b) => b.matchCount - a.matchCount);

                    setMealSuggestions(sortedMeals);
                }
            } catch (err) {
                console.error('Error fetching meals:', err);
            }
        };

        fetchMeals();
    }, [existingPreferences, preferencesLoaded]);

    const toggleMultiSelect = (key, value) => {
        setData((prev) => {
            const current = prev[key];
            const isMissing = (key) => {
                return !existingPreferences || !existingPreferences[key] || existingPreferences[key].length === 0;
            };
            return {
                ...prev,
                [key]: current.includes(value)
                    ? current.filter((item) => item !== value)
                    : [...current, value],
            };
        });
    };
    const hasMissingFields = () => {
        const requiredFields = [
            'activityLevel',
            'goal',
            'dietaryRestrictions',
            'mealFrequency',
            'preferredCuisines',
            'cookingSkill'
        ];

        return requiredFields.some((field) => isMissing(field));
    };

    const handleSubmit = () => {
        const { activityLevel, goal, dietaryRestrictions, mealFrequency, preferredCuisines, cookingSkill } = data;
        if (!activityLevel || !goal || !mealFrequency || !cookingSkill || preferredCuisines.length === 0) {
            Alert.alert('Missing Fields', 'Please complete all fields before continuing.');
            return;
        }
    
        set(preferencesRef, data)
            .then(() => {
                setShowAllFields(false);
                Alert.alert('Success', 'Meal preferences saved.');
    
                // 👇 Fetch updated preferences to trigger meal suggestions
                const dbRef = ref(getDatabase());
                get(child(dbRef, `MealPreferences/${userId}`)).then((snap) => {
                    if (snap.exists()) {
                        const updatedPrefs = snap.val();
                        setExistingPreferences(updatedPrefs); // ✅ this will re-trigger useEffect
                    }
                });
            })
            .catch((error) => {
                Alert.alert('Error', error.message);
            });
    };
    

    if (loading) return <View style={styles.container}><Text>Loading...</Text></View>;

    return (
        <>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.heading}>Meal Preferences</Text>

                <View style={styles.card}>

                    <Text style={{ marginBottom: 10 }}>
                        Height: {userInfo.height ? `${userInfo.height} m` : 'N/A'} |
                        Weight: {userInfo.weight ? `${userInfo.weight} kg` : 'N/A'}
                    </Text>
                    <Text style={{ marginBottom: 10 }}>
                        Age: {userInfo.dob ? `${calculateAge(userInfo.dob)} yrs` : 'N/A'} |
                        Gender: {userInfo.gender || 'N/A'}
                    </Text>

                    {/* Activity Level */}
                    {(isMissing('activityLevel') || showAllFields) && (
                        <>
                            <Text style={styles.label}>Activity Level</Text>
                            {activityLevels.map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[styles.option, data.activityLevel === level && styles.selected]}
                                    onPress={() => setData({ ...data, activityLevel: level })}
                                >
                                    <Text style={data.activityLevel === level ? styles.selectedText : styles.optionText}>{level}</Text>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}
                    {(isMissing('goal') || showAllFields) && (
                        <>
                            {/* Goal */}
                            <Text style={styles.label}>Goal</Text>
                            {goals.map((g) => (
                                <TouchableOpacity
                                    key={g}
                                    style={[styles.option, data.goal === g && styles.selected]}
                                    onPress={() => setData({ ...data, goal: g })}
                                >
                                    <Text style={data.goal === g ? styles.selectedText : styles.optionText}>{g.replace('_', ' ')}</Text>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}

                    {(isMissing('dietaryRestrictions') || showAllFields) && (
                        <>
                            {/* Dietary Restrictions */}
                            <Text style={styles.label}>Dietary Restrictions</Text>
                            {dietaryOptions.map((opt) => (
                                <TouchableOpacity
                                    key={opt}
                                    style={[
                                        styles.option,
                                        data.dietaryRestrictions.includes(opt) && styles.selected
                                    ]}
                                    onPress={() => toggleMultiSelect('dietaryRestrictions', opt)}
                                >
                                    <Text style={data.dietaryRestrictions.includes(opt) ? styles.selectedText : styles.optionText}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}
                    {(isMissing('mealFrequency') || showAllFields) && (
                        <>
                            {/* Meal Frequency */}
                            <Text style={styles.label}>Meal Frequency (meals/day)</Text>
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                                <TouchableOpacity
                                    key={n}
                                    style={[styles.option, data.mealFrequency == n && styles.selected]}
                                    onPress={() => setData({ ...data, mealFrequency: n })}
                                >
                                    <Text style={data.mealFrequency == n ? styles.selectedText : styles.optionText}>{n}</Text>
                                </TouchableOpacity>
                            ))}

                        </>
                    )}
                    {(isMissing('preferredCuisines') || showAllFields) && (
                        <>
                            {/* Preferred Cuisines */}
                            <Text style={styles.label}>Preferred Cuisines</Text>
                            {cuisines.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[
                                        styles.option,
                                        data.preferredCuisines.includes(c) && styles.selected
                                    ]}
                                    onPress={() => toggleMultiSelect('preferredCuisines', c)}
                                >
                                    <Text style={data.preferredCuisines.includes(c) ? styles.selectedText : styles.optionText}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}
                    {(isMissing('cookingSkill') || showAllFields) && (
                        <>
                            {/* Cooking Skill */}
                            <Text style={styles.label}>Cooking Skill</Text>
                            {skillLevels.map((level) => (
                                <TouchableOpacity
                                    key={level}
                                    style={[styles.option, data.cookingSkill === level && styles.selected]}
                                    onPress={() => setData({ ...data, cookingSkill: level })}
                                >
                                    <Text style={data.cookingSkill === level ? styles.selectedText : styles.optionText}>{level}</Text>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}

                    {(hasMissingFields() || showAllFields) && (
                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <Text style={styles.submitText}>Save Preferences</Text>
                        </TouchableOpacity>
                    )}
                    {existingPreferences && (
                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: '#6c757d' }]}
                            onPress={() => setShowAllFields((prev) => !prev)}
                        >
                            <Text style={styles.submitText}>
                                {showAllFields ? 'Cancel Update' : 'Update Preferences'}
                            </Text>
                        </TouchableOpacity>
                    )}

                </View>


                {existingPreferences && mealSuggestions.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.label}>Suggested Meals</Text>
                        {mealSuggestions.map((meal, idx) => (
                            // <View key={idx} style={{ marginBottom: 15 }}>
                            <View key={idx} style={styles.mealCard}>
                                <Text style={styles.mealTitle}>{meal.title}</Text>
                                <Text style={styles.mealText}>Calories: {meal.calories}</Text>
                                <Text style={styles.mealText}>Protein: {meal.protein}g</Text>
                                <Text style={styles.mealText}>{meal.description}</Text>
                                <Text style={styles.mealMatch}>Matched: {meal.matchedTags.join(', ')}</Text>
                            </View>
                        ))}
                        <Text style={styles.disclaimer}>
                            ⚠️ These meals are only suggestions. Nutritional values are approximate and can vary based on ingredients and preparation methods. Please verify recipes and consult reliable sources if needed. We are not responsible for any health issues caused by these suggestions.
                        </Text>
                    </View>
                )}


            </ScrollView>
            <NavBar />
        </>

    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f8f9fa',
        paddingVertical: 30,
        paddingHorizontal: 16,
    },
    heading: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 10,
        color: '#09355c',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        margin: 10,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    option: {
        padding: 12,
        backgroundColor: '#f1f1f1',
        borderRadius: 8,
        marginBottom: 8,
    },
    selected: {
        backgroundColor: '#09355c',
    },
    optionText: {
        color: '#333',
        fontSize: 16,
    },
    selectedText: {
        color: '#fff',
        fontSize: 16,
    },
    submitButton: {
        backgroundColor: '#09355c',
        padding: 15,
        borderRadius: 10,
        marginTop: 30,
        alignItems: 'center',
    },
    submitText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    mealTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#09355c',
    },
    mealText: {
        fontSize: 15,
        color: '#333',
        marginBottom: 3,
    },
    mealMatch: {
        fontSize: 13,
        color: '#555',
        fontStyle: 'italic',
        marginTop: 5,
    },
    mealCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    disclaimer: {
        marginTop: 20,
        fontSize: 13,
        color: '#6c757d',
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 18,
    }

});



