import { getDatabase, ref, onValue } from 'firebase/database';
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

    return unsubscribe; // Return the unsubscribe function to call when the component unmounts
  } else {
    throw new Error("User not authenticated");
  }
};
