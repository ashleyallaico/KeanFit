import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ImageBackground,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { getDatabase, ref, set, get, child } from 'firebase/database';
import { auth } from '../services/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { calculateAge } from '../utils/ageCalculator';
import NavBar from '../components/NavBar';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const activityLevels = [
  'Sedentary',
  'Lightly Active',
  'Moderately Active',
  'Very Active',
];
const goals = ['lose_weight', 'maintain_weight', 'gain_muscle'];
const dietaryOptions = [
  'vegetarian',
  'vegan',
  'gluten_free',
  'dairy_free',
  'nut_allergy',
];
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
    return (
      !existingPreferences ||
      !existingPreferences[key] ||
      existingPreferences[key].length === 0
    );
  };
  const [mealSuggestions, setMealSuggestions] = useState([]);

  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const userId = auth.currentUser?.uid;

  const db = getDatabase();
  const preferencesRef = ref(db, `MealPreferences/${userId}`);

  useEffect(() => {
    // Hide the header to be consistent with dashboard
    navigation.setOptions({
      headerShown: false,
    });

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

            if (meal.goal === existingPreferences.goal)
              matchedTags.push('Goal');
            if (meal.activityLevel === existingPreferences.activityLevel)
              matchedTags.push('Activity Level');
            if (existingPreferences.preferredCuisines.includes(meal.cuisine))
              matchedTags.push('Cuisine');
            if (meal.skill === existingPreferences.cookingSkill)
              matchedTags.push('Cooking Skill');

            const dietaryMatch =
              existingPreferences.dietaryRestrictions.length === 0 ||
              meal.dietaryTags.some((tag) =>
                existingPreferences.dietaryRestrictions.includes(tag)
              );
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
      'cookingSkill',
    ];

    return requiredFields.some((field) => isMissing(field));
  };

  const handleSubmit = () => {
    const {
      activityLevel,
      goal,
      dietaryRestrictions,
      mealFrequency,
      preferredCuisines,
      cookingSkill,
    } = data;
    if (
      !activityLevel ||
      !goal ||
      !mealFrequency ||
      !cookingSkill ||
      preferredCuisines.length === 0
    ) {
      Alert.alert(
        'Missing Fields',
        'Please complete all fields before continuing.'
      );
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

  const getGoalIcon = (goal) => {
    switch (goal) {
      case 'lose_weight':
        return <FontAwesome5 name="weight" size={18} color="#fff" />;
      case 'maintain_weight':
        return <FontAwesome5 name="balance-scale" size={18} color="#fff" />;
      case 'gain_muscle':
        return <FontAwesome5 name="dumbbell" size={18} color="#fff" />;
      default:
        return <FontAwesome5 name="bullseye" size={18} color="#fff" />;
    }
  };

  const getCuisineIcon = (cuisine) => {
    switch (cuisine) {
      case 'mexican':
        return <FontAwesome5 name="pepper-hot" size={18} color="#fff" />;
      case 'italian':
        return <FontAwesome5 name="pizza-slice" size={18} color="#fff" />;
      case 'asian':
        return <FontAwesome5 name="utensils" size={18} color="#fff" />;
      case 'mediterranean':
        return <FontAwesome5 name="leaf" size={18} color="#fff" />;
      case 'american':
        return <FontAwesome5 name="hamburger" size={18} color="#fff" />;
      default:
        return <FontAwesome5 name="utensils" size={18} color="#fff" />;
    }
  };

  const getDietaryIcon = (restriction) => {
    switch (restriction) {
      case 'vegetarian':
      case 'vegan':
        return <FontAwesome5 name="seedling" size={18} color="#fff" />;
      case 'gluten_free':
        return <FontAwesome5 name="bread-slice" size={18} color="#fff" />;
      case 'dairy_free':
        return <FontAwesome5 name="cheese" size={18} color="#fff" />;
      case 'nut_allergy':
        return <FontAwesome5 name="allergies" size={18} color="#fff" />;
      default:
        return <FontAwesome5 name="check-circle" size={18} color="#fff" />;
    }
  };

  const getActivityIcon = (level) => {
    switch (level) {
      case 'Sedentary':
        return <FontAwesome5 name="couch" size={18} color="#fff" />;
      case 'Lightly Active':
        return <FontAwesome5 name="walking" size={18} color="#fff" />;
      case 'Moderately Active':
        return <FontAwesome5 name="running" size={18} color="#fff" />;
      case 'Very Active':
        return <FontAwesome5 name="heartbeat" size={18} color="#fff" />;
      default:
        return <FontAwesome5 name="running" size={18} color="#fff" />;
    }
  };

  const getSkillIcon = (level) => {
    switch (level) {
      case 'easy':
        return <FontAwesome5 name="smile" size={18} color="#fff" />;
      case 'intermediate':
        return <FontAwesome5 name="user-check" size={18} color="#fff" />;
      case 'advanced':
        return <FontAwesome5 name="star" size={18} color="#fff" />;
      default:
        return <FontAwesome5 name="graduation-cap" size={18} color="#fff" />;
    }
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#09355c" />
        <Text style={styles.loadingText}>Loading your meal preferences...</Text>
      </View>
    );

  return (
    <View style={styles.wrapper}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#09355c"
        translucent={true}
      />

      {/* Hero Section with Background */}
      <ImageBackground
        source={require('../assets/KeanBG.png')}
        style={styles.heroSection}
        resizeMode="cover"
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome name="chevron-left" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Meal Preferences</Text>
          <View style={{ width: 36 }}></View> {/* Empty view for spacing */}
        </View>
      </ImageBackground>

      <ScrollView contentContainerStyle={styles.container}>
        {/* User Info Card */}
        <View style={styles.userInfoCard}>
          <View style={styles.userInfoRow}>
            <View style={styles.userInfoItem}>
              <FontAwesome5
                name="ruler-vertical"
                size={16}
                color="#09355c"
                style={styles.infoIcon}
              />
              <View>
                <Text style={styles.infoLabel}>Height</Text>
                <Text style={styles.infoValue}>
                  {userInfo.height ? `${userInfo.height} m` : 'Not set'}
                </Text>
              </View>
            </View>
            <View style={styles.userInfoItem}>
              <FontAwesome5
                name="weight"
                size={16}
                color="#09355c"
                style={styles.infoIcon}
              />
              <View>
                <Text style={styles.infoLabel}>Weight</Text>
                <Text style={styles.infoValue}>
                  {userInfo.weight ? `${userInfo.weight} kg` : 'Not set'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.userInfoRow}>
            <View style={styles.userInfoItem}>
              <FontAwesome5
                name="calendar-alt"
                size={16}
                color="#09355c"
                style={styles.infoIcon}
              />
              <View>
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>
                  {userInfo.dob
                    ? `${calculateAge(userInfo.dob)} yrs`
                    : 'Not set'}
                </Text>
              </View>
            </View>
            <View style={styles.userInfoItem}>
              <FontAwesome5
                name="user"
                size={16}
                color="#09355c"
                style={styles.infoIcon}
              />
              <View>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>
                  {userInfo.gender || 'Not set'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Preferences Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Meal Preferences</Text>

          {/* Activity Level */}
          {(isMissing('activityLevel') || showAllFields) && (
            <View style={styles.preferenceSection}>
              <Text style={styles.label}>
                <FontAwesome5
                  name="running"
                  size={14}
                  color="#09355c"
                  style={styles.labelIcon}
                />
                Activity Level
              </Text>
              <View style={styles.optionsGrid}>
                {activityLevels.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.gridOption,
                      data.activityLevel === level && styles.selectedGridOption,
                    ]}
                    onPress={() => setData({ ...data, activityLevel: level })}
                  >
                    <View style={styles.iconContainer}>
                      {getActivityIcon(level)}
                    </View>
                    <Text
                      style={
                        data.activityLevel === level
                          ? styles.selectedOptionText
                          : styles.optionText
                      }
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Goal */}
          {(isMissing('goal') || showAllFields) && (
            <View style={styles.preferenceSection}>
              <Text style={styles.label}>
                <FontAwesome5
                  name="bullseye"
                  size={14}
                  color="#09355c"
                  style={styles.labelIcon}
                />
                Goal
              </Text>
              <View style={styles.optionsGrid}>
                {goals.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.gridOption,
                      data.goal === g && styles.selectedGridOption,
                    ]}
                    onPress={() => setData({ ...data, goal: g })}
                  >
                    <View style={styles.iconContainer}>{getGoalIcon(g)}</View>
                    <Text
                      style={
                        data.goal === g
                          ? styles.selectedOptionText
                          : styles.optionText
                      }
                    >
                      {g.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Dietary Restrictions */}
          {(isMissing('dietaryRestrictions') || showAllFields) && (
            <View style={styles.preferenceSection}>
              <Text style={styles.label}>
                <FontAwesome5
                  name="check-circle"
                  size={14}
                  color="#09355c"
                  style={styles.labelIcon}
                />
                Dietary Restrictions
              </Text>
              <View style={styles.optionsWrap}>
                {dietaryOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.chipOption,
                      data.dietaryRestrictions.includes(opt) &&
                        styles.selectedChip,
                    ]}
                    onPress={() =>
                      toggleMultiSelect('dietaryRestrictions', opt)
                    }
                  >
                    {data.dietaryRestrictions.includes(opt) && (
                      <View style={styles.smallIconContainer}>
                        {getDietaryIcon(opt)}
                      </View>
                    )}
                    <Text
                      style={
                        data.dietaryRestrictions.includes(opt)
                          ? styles.selectedChipText
                          : styles.chipText
                      }
                    >
                      {opt.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Meal Frequency */}
          {(isMissing('mealFrequency') || showAllFields) && (
            <View style={styles.preferenceSection}>
              <Text style={styles.label}>
                <FontAwesome5
                  name="clock"
                  size={14}
                  color="#09355c"
                  style={styles.labelIcon}
                />
                Meal Frequency (meals/day)
              </Text>
              <View style={styles.numbersGrid}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[
                      styles.numberOption,
                      data.mealFrequency == n && styles.selectedNumberOption,
                    ]}
                    onPress={() => setData({ ...data, mealFrequency: n })}
                  >
                    <Text
                      style={
                        data.mealFrequency == n
                          ? styles.selectedNumberText
                          : styles.numberText
                      }
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Preferred Cuisines */}
          {(isMissing('preferredCuisines') || showAllFields) && (
            <View style={styles.preferenceSection}>
              <Text style={styles.label}>
                <FontAwesome5
                  name="utensils"
                  size={14}
                  color="#09355c"
                  style={styles.labelIcon}
                />
                Preferred Cuisines
              </Text>
              <View style={styles.optionsWrap}>
                {cuisines.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.chipOption,
                      data.preferredCuisines.includes(c) && styles.selectedChip,
                    ]}
                    onPress={() => toggleMultiSelect('preferredCuisines', c)}
                  >
                    {data.preferredCuisines.includes(c) && (
                      <View style={styles.smallIconContainer}>
                        {getCuisineIcon(c)}
                      </View>
                    )}
                    <Text
                      style={
                        data.preferredCuisines.includes(c)
                          ? styles.selectedChipText
                          : styles.chipText
                      }
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Cooking Skill */}
          {(isMissing('cookingSkill') || showAllFields) && (
            <View style={styles.preferenceSection}>
              <Text style={styles.label}>
                <FontAwesome5
                  name="hat-chef"
                  size={14}
                  color="#09355c"
                  style={styles.labelIcon}
                />
                Cooking Skill
              </Text>
              <View style={styles.optionsGrid}>
                {skillLevels.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.gridOption,
                      data.cookingSkill === level && styles.selectedGridOption,
                    ]}
                    onPress={() => setData({ ...data, cookingSkill: level })}
                  >
                    <View style={styles.iconContainer}>
                      {getSkillIcon(level)}
                    </View>
                    <Text
                      style={
                        data.cookingSkill === level
                          ? styles.selectedOptionText
                          : styles.optionText
                      }
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {(hasMissingFields() || showAllFields) && (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <FontAwesome5
                name="save"
                size={18}
                color="#fff"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.submitText}>Save Preferences</Text>
            </TouchableOpacity>
          )}

          {existingPreferences && (
            <TouchableOpacity
              style={[styles.updateButton]}
              onPress={() => setShowAllFields((prev) => !prev)}
            >
              <FontAwesome5
                name={showAllFields ? 'times' : 'edit'}
                size={18}
                color="#09355c"
                style={{ marginRight: 10 }}
              />
              <Text style={styles.updateText}>
                {showAllFields ? 'Cancel Update' : 'Update Preferences'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Meal Suggestions */}
        {existingPreferences && mealSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <View style={styles.suggestionsHeader}>
              <FontAwesome5 name="utensils" size={18} color="#09355c" />
              <Text style={styles.suggestionsTitle}>Suggested Meals</Text>
              <Text style={styles.suggestionCount}>
                {mealSuggestions.length}
              </Text>
            </View>

            {mealSuggestions.map((meal, idx) => (
              <View key={idx} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealTitle}>{meal.title}</Text>
                  <View style={styles.nutritionPill}>
                    <Text style={styles.caloriesText}>{meal.calories} cal</Text>
                  </View>
                </View>

                <View style={styles.macroNutrients}>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>Protein</Text>
                    <Text style={styles.macroValue}>{meal.protein}g</Text>
                  </View>
                  {meal.carbs && (
                    <View style={styles.macroItem}>
                      <Text style={styles.macroLabel}>Carbs</Text>
                      <Text style={styles.macroValue}>{meal.carbs}g</Text>
                    </View>
                  )}
                  {meal.fat && (
                    <View style={styles.macroItem}>
                      <Text style={styles.macroLabel}>Fat</Text>
                      <Text style={styles.macroValue}>{meal.fat}g</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.mealDescription}>{meal.description}</Text>

                <View style={styles.matchTagsContainer}>
                  {meal.matchedTags.map((tag, tagIdx) => (
                    <View key={tagIdx} style={styles.matchTag}>
                      <Text style={styles.matchTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                {/* View Recipe button removed as requested */}
              </View>
            ))}

            {/* Disclaimer */}
            <View style={styles.disclaimerContainer}>
              <FontAwesome5
                name="exclamation-triangle"
                size={16}
                color="#ff9800"
                style={styles.disclaimerIcon}
              />
              <Text style={styles.disclaimer}>
                These meals are only suggestions. Nutritional values are
                approximate and can vary. Consult reliable sources if needed. We
                are not responsible for any health issues caused by these
                suggestions.
              </Text>
            </View>
          </View>
        )}

        {/* Motivation Quote */}
        <LinearGradient
          colors={['#09355c', '#053559']}
          style={styles.motivationCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.quoteContainer}>
            <Text style={styles.quoteText}>
              "Let food be thy medicine and medicine be thy food."
            </Text>
            <Text style={styles.quoteAuthor}>- Hippocrates</Text>
          </View>

          <View style={styles.logoWatermark}>
            <FontAwesome name="paw" size={60} color="rgba(255,255,255,0.2)" />
          </View>
        </LinearGradient>

        {/* Bottom Padding for NavBar */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#09355c',
  },
  heroSection: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 15,
    position: 'relative',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    zIndex: 10,
    overflow: 'hidden',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  userInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  userInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#09355c',
    marginBottom: 15,
    textAlign: 'center',
  },
  preferenceSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#09355c',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelIcon: {
    marginRight: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridOption: {
    width: '48%',
    backgroundColor: '#f1f5f9',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedGridOption: {
    backgroundColor: '#09355c',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(9, 53, 92, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  smallIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(9, 53, 92, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  optionText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  selectedOptionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chipOption: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 50,
    marginRight: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedChip: {
    backgroundColor: '#09355c',
  },
  chipText: {
    color: '#333',
    fontSize: 14,
  },
  selectedChipText: {
    color: '#fff',
    fontSize: 14,
  },
  numbersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  numberOption: {
    width: '15%',
    aspectRatio: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedNumberOption: {
    backgroundColor: '#09355c',
  },
  numberText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#09355c',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  updateText: {
    color: '#09355c',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#09355c',
    marginLeft: 10,
    flex: 1,
  },
  suggestionCount: {
    backgroundColor: '#09355c',
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  mealCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#09355c',
    flex: 1,
  },
  nutritionPill: {
    backgroundColor: '#09355c',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 50,
  },
  caloriesText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  macroNutrients: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  macroItem: {
    marginRight: 20,
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  mealDescription: {
    color: '#555',
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  matchTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  matchTag: {
    backgroundColor: 'rgba(9, 53, 92, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 50,
    marginRight: 8,
    marginBottom: 8,
  },
  matchTagText: {
    color: '#09355c',
    fontSize: 12,
    fontWeight: '500',
  },
  viewRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 10,
  },
  viewRecipeText: {
    color: '#09355c',
    fontWeight: '600',
    marginRight: 8,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  disclaimerIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  disclaimer: {
    fontSize: 12,
    color: '#555',
    flex: 1,
    lineHeight: 18,
  },
  motivationCard: {
    borderRadius: 16,
    padding: 25,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  quoteContainer: {
    zIndex: 2,
  },
  quoteText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 28,
    marginBottom: 10,
  },
  quoteAuthor: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'right',
  },
  logoWatermark: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    zIndex: 1,
    opacity: 0.3,
  },
  bottomPadding: {
    height: 70, // Height for NavBar clearance
  },
});
