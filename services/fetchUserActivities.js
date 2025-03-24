import { getDatabase, ref, onValue, remove } from 'firebase/database';
import { auth } from './firebaseConfig'; // Ensure this is the correct path

export const setupActivityListener = (callback) => {
  const user = auth.currentUser;
  if (user) {
    const db = getDatabase();
    const uid = user.uid;
    const activitiesRef = ref(db, `Activity/${uid}`);

    const unsubscribe = onValue(activitiesRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback({});
      }
    });

    return unsubscribe; 
  } else {
    throw new Error("User not authenticated");
  }
};

export const deleteActivity = async (category, activityId) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  
  const db = getDatabase();
  const uid = user.uid;
  const activityRef = ref(db, `Activity/${uid}/${category}/${activityId}`);
  
  try {
    await remove(activityRef);
    return true;
  } catch (error) {
    console.error("Error deleting activity:", error);
    throw error;
  }
};