import { getAuth, signInWithEmailAndPassword, signInAnonymously, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signOut, linkWithCredential, EmailAuthProvider, updateProfile } from 'firebase/auth';
import app from '../services/firebase';

const auth = getAuth(app);

export const signUpWithEmail = async (name: string, email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
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