import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { setupActivityListener } from '../services/fetchUserActivities';

const UserStats = () => {
  const [activities, setActivities] = useState({});

  useEffect(() => {
    const unsubscribe = setupActivityListener(setActivities);
    return () => unsubscribe();
  }, []);

  const getCurrentDate = () => {
    return new Date().toLocaleDateString();
  };

  const todayDate = getCurrentDate();
  const todayActivities = {};
  const pastActivities = {};

  // Variables to store summed data for today
  const todaySummary = {
    Cardio: { totalSteps: 0, totalDuration: 0 },
    Strength: { totalReps: 0, totalWeight: 0 },
    Yoga: { totalDuration: 0 },
  };

  // Separate and accumulate today's and past activities
  Object.entries(activities).forEach(([category, entries]) => {
    Object.entries(entries).forEach(([entryId, entryDetails]) => {
      if (entryDetails.date === todayDate) {
        if (!todayActivities[category]) todayActivities[category] = {};
        todayActivities[category][entryId] = entryDetails;

        // Convert string values to numbers before summing
        if (category === 'Cardio') {
          todaySummary.Cardio.totalSteps += Number(entryDetails.steps) || 0;
          todaySummary.Cardio.totalDuration += Number(entryDetails.cardioDuration) || 0;

        } else if (category === 'Yoga') {
          todaySummary.Yoga.totalDuration += Number(entryDetails.yogaDuration) || 0;
        }
      } else {
        if (!pastActivities[category]) pastActivities[category] = {};
        pastActivities[category][entryId] = entryDetails;
      }
    });
  });

  return (
    <View>

      {/* Today's Exercises Individual Entries + Total */}
      {Object.keys(todayActivities).length > 0 && (
        <View style={styles.todayContainer}>
          <Text style={styles.todayTitle}>Exercises Done Today</Text>

          {Object.entries(todayActivities).map(([category, entries]) => (
            <View key={category} style={styles.categoryContainer}>
              <Text style={styles.categoryTitle}>{category}</Text>

              {/* List all individual entries for today */}
              {Object.entries(entries).map(([entryId, entryDetails]) => (
                <Text key={entryId} style={styles.entryText}>
                  {entryDetails.date}: {category} - {entryDetails.steps ? `Walked ${entryDetails.steps} steps ` : ''}
                  {entryDetails.reps ? ` Lifted ${entryDetails.weight} lbs for ${entryDetails.reps} reps` : ''}

                  {entryDetails.cardioDuration
                    ? `Practiced for ${Math.floor(entryDetails.cardioDuration / 60)} min ${entryDetails.cardioDuration % 60} sec`
                    : ''}

                  {entryDetails.yogaDuration
                    ? `Practiced for ${Math.floor(entryDetails.yogaDuration / 60)} min ${entryDetails.yogaDuration % 60} sec`
                    : ''}
                </Text>
              ))}

              {/* Display Today total at the bottom of each category */}
              {category === 'Cardio' && todaySummary.Cardio.totalSteps > 0 && (
                <Text style={styles.summaryText}>
                  Total: Walked {todaySummary.Cardio.totalSteps} steps in {Math.floor(todaySummary.Cardio.totalDuration / 60)} min {todaySummary.Cardio.totalDuration % 60} sec
                </Text>
              )}

              {category === 'Yoga' && todaySummary.Yoga.totalDuration > 0 && (
                <Text style={styles.summaryText}>
                    Total: Practiced for {Math.floor(todaySummary.Yoga.totalDuration / 60)} min {todaySummary.Yoga.totalDuration % 60} sec
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Past Exercises and Individual Entries  */}
      {Object.keys(pastActivities).length > 0 && (
        <View style={styles.pastContainer}>
          <Text style={styles.pastTitle}>Previous Exercises</Text>
          {Object.entries(pastActivities).map(([category, entries]) => (
            <View key={category} style={styles.categoryContainer}>
              <Text style={styles.categoryTitle}>{category}</Text>
              {Object.entries(entries).map(([entryId, entryDetails]) => (
                <Text key={entryId} style={styles.entryText}>
                  {entryDetails.date}: {category} - {entryDetails.steps ? `Walked ${entryDetails.steps} steps` : ''}
                  {entryDetails.reps ? ` Lifted ${entryDetails.weight} lbs for ${entryDetails.reps} reps` : ''}
                  {entryDetails.cardioDuration ? ` Practiced for ${entryDetails.cardioDuration} minutes` : ''}
                  {entryDetails.yogaDuration ? ` Practiced for ${entryDetails.yogaDuration} minutes` : ''}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  todayContainer: {
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  todayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0d47a1',
    marginBottom: 5,
  },
  pastContainer: {
    backgroundColor: '#fff3e0',
    padding: 10,
    borderRadius: 10,
  },
  pastTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#bf360c',
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#09355c',
    marginTop: 8,
  },
  entryText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 3,
  },
  categoryContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#09355c',
  },
});

export default UserStats;