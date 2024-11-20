import { getAuth, setPersistence, browserLocalPersistence, signInWithEmailAndPassword, signInAnonymously, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signOut, linkWithCredential, EmailAuthProvider, updateProfile as firebaseUpdateProfile, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import app, { storage } from '../services/firebase';

const auth = getAuth(app);
const db = getFirestore(app);

// Set Firebase Auth persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Firebase Auth persistence set to local');
  })
  .catch((error) => {
    console.error('Error setting persistence:', error);
  });

export const uploadProfilePicture = async (userId: string, imageDataUrl: string) => {
  const fileName = 'profile.png';
  const storageRef = ref(storage, `profilePictures/${userId}/${fileName}`);
  await uploadString(storageRef, imageDataUrl, 'data_url');
  return await getDownloadURL(storageRef);
};

export const signUpWithEmail = async (name: string, email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await firebaseUpdateProfile(userCredential.user, { displayName: name });
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      firstName: name.split(' ')[0],
      lastName: name.split(' ')[1] || '',
      displayName: name,
      photoURL: '',
      followers: [],
      views: 0,
      likes: 0,
      following: []
    });
    return userCredential;
  } catch (error) {
    console.error('Error during sign-up:', error);
    throw new Error('Failed to create an account. Please try again.');
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Error during sign-in:', error);
    throw new Error('Failed to sign in. Please check your credentials.');
  }
};

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user document exists
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      // Create user document if it doesn't exist
      await setDoc(userDocRef, {
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ')[1] || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        followers: [],
        views: 0,
        likes: 0,
        following: []
      });
    }

    return userCredential;
  } catch (error) {
    console.error('Error during Google sign-in:', error);
    throw new Error('Failed to sign in with Google. Please try again.');
  }
};

export const signInAnonymouslyUser = async () => {
  try {
    return await signInAnonymously(auth);
  } catch (error) {
    console.error('Error during anonymous sign-in:', error);
    throw new Error('Failed to sign in anonymously.');
  }
};

export const logoutUser = async () => {
  try {
    return await signOut(auth);
  } catch (error) {
    console.error('Error during logout:', error);
    throw new Error('Failed to log out. Please try again.');
  }
};

export const linkAnonymousAccount = async (email: string, password: string) => {
  try {
    const credential = EmailAuthProvider.credential(email, password);
    const user = auth.currentUser;
    if (user) {
      return await linkWithCredential(user, credential);
    } else {
      throw new Error('No user is currently signed in.');
    }
  } catch (error) {
    console.error('Error during account linking:', error);
    throw new Error('Failed to link account. Please try again.');
  }
};

export const updateProfile = async (profile: { displayName: string; photoURL: string; firstName: string; lastName: string }) => {
  try {
    const user = auth.currentUser;
    if (user) {
      await firebaseUpdateProfile(user, { displayName: profile.displayName, photoURL: profile.photoURL });
      await setDoc(doc(db, 'users', user.uid), {
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: profile.displayName,
        photoURL: profile.photoURL
      }, { merge: true });
    } else {
      throw new Error('No user is currently signed in.');
    }
  } catch (error) {
    console.error('Error during profile update:', error);
    throw new Error('Failed to update profile. Please try again.');
  }
};

export const getUserProfile = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        throw new Error('No user profile found.');
      }
    } else {
      throw new Error('No user is currently signed in.');
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Failed to get user profile. Please try again.');
  }
};

export const getUserPosts = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      const postsQuery = query(collection(db, 'content'), where('artistId', '==', user.uid));
      const querySnapshot = await getDocs(postsQuery);
      return querySnapshot.docs.map(doc => doc.data());
    } else {
      throw new Error('No user is currently signed in.');
    }
  } catch (error) {
    console.error('Error getting user posts:', error);
    throw new Error('Failed to get user posts. Please try again.');
  }
};

export const getUserFeed = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const following = userDoc.data().following || [];
        if (following.length > 0) {
          const feedQuery = query(collection(db, 'content'), where('artistId', 'in', following));
          const querySnapshot = await getDocs(feedQuery);
          return querySnapshot.docs.map(doc => doc.data());
        }
      }
      return [];
    } else {
      throw new Error('No user is currently signed in.');
    }
  } catch (error) {
    console.error('Error getting user feed:', error);
    throw new Error('Failed to get user feed. Please try again.');
  }
};

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is signed in:", user);
  } else {
    console.log("User is signed out");
  }
});