import { getDatabase, ref, onValue, set } from 'firebase/database';
import { auth } from './firebaseConfig';

export const fetchUserProfile = (callback) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const db = getDatabase();
  const userProfileRef = ref(db, `Users/${user.uid}`);

  const unsubscribe = onValue(
    userProfileRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        // Create default user structure: name & empty preferences array
        const defaultProfile = {
          name: user.displayName || 'New User',
          preferences: [],
        };

        set(userProfileRef, defaultProfile)
          .then(() => callback(defaultProfile))
          .catch((error) => {
            console.error('Failed to create user profile:', error);
            callback(null);
          });
      }
    },
    { onlyOnce: true }
  );

  return unsubscribe;
};

// update user preferences
export const updateUserPreferences = async (preferences) => {
  const user = auth.currentUser;
  if (user) {
    const db = getDatabase();
    const preferencesRef = ref(db, `Users/${user.uid}/Preferences`);

    try {
      await set(preferencesRef, preferences);
      console.log('Preferences updated successfully');
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  } else {
    throw new Error('User not authenticated');
  }
};

// fetches user preferences ONLY
export const fetchUserPreferences = (callback) => {
  const user = auth.currentUser;
  if (!user) {
    console.error('User not authenticated');
    return () => {};
  }

  const db = getDatabase();
  const preferencesRef = ref(db, `Users/${user.uid}/preferences`);

  const unsubscribe = onValue(preferencesRef, (snapshot) => {
    if (snapshot.exists()) {
      const preferences = snapshot.val();
      callback(preferences);
    } else {
      callback([]);
    }
  });

  return () => unsubscribe();
};
