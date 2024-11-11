import { getAuth, signInWithEmailAndPassword, signInAnonymously, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signOut, linkWithCredential, EmailAuthProvider, updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import app, { storage } from '../services/firebase';

const auth = getAuth(app);
const db = getFirestore(app);

export const uploadProfilePicture = async (userId: string, imageDataUrl: string) => {
  const storageRef = ref(storage, `profilePictures/${userId}`);
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
      photoURL: ''
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
    return await signInWithPopup(auth, provider);
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