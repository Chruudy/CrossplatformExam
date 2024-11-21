<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Login</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="login-container">
        <ion-card>
          <ion-card-content>
            <!-- Username Input -->
            <ion-item>
              <ion-icon slot="start" name="person-circle-outline"></ion-icon>
              <ion-input v-model="username" type="text" placeholder="Username"></ion-input>
            </ion-item>
            <!-- Password Input -->
            <ion-item>
              <ion-icon slot="start" name="lock-closed-outline"></ion-icon>
              <ion-input v-model="password" type="password" placeholder="Password"></ion-input>
            </ion-item>
            <!-- Login Button -->
            <ion-button expand="block" color="primary" @click="login">
              <ion-icon slot="start" name="log-in-outline"></ion-icon>
              Login
            </ion-button>
            <!-- Login with Google Button -->
            <ion-button expand="block" color="danger" @click="loginWithGoogle">
              <ion-icon slot="start" name="logo-google"></ion-icon>
              Login with Google
            </ion-button>
            <!-- Login Anonymously Button -->
            <ion-button expand="block" color="medium" @click="loginAnonymously">
              <ion-icon slot="start" name="person-outline"></ion-icon>
              Login Anonymously
            </ion-button>
            <!-- Navigate to Register Button -->
            <ion-button expand="block" fill="clear" color="dark" @click="navigateToRegister">
              <ion-icon slot="start" name="person-add-outline"></ion-icon>
              Don't have an account? Register here
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonItem, IonInput, IonButton, IonIcon } from '@ionic/vue';
import { signInWithEmail, signInWithGoogle, signInAnonymouslyUser } from '../services/authentication';

// State variables for username and password
const username = ref('');
const password = ref('');
const router = useRouter();

// Function to handle login with email and password
const login = async () => {
  if (username.value && password.value) {
    try {
      const user = await signInWithEmail(username.value, password.value);
      console.log("Signed in user:", user);
      router.push('/page/home'); // Navigate to the homepage
    } catch (error) {
      console.error("Sign-in error:", error);
      alert("Error signing in: " + (error as Error).message);
    }
  } else {
    alert('Please enter both username and password');
  }
};

// Function to handle login with Google
const loginWithGoogle = async () => {
  try {
    const user = await signInWithGoogle();
    console.log("Signed in with Google:", user);
    router.push('/page/home'); // Navigate to the homepage
  } catch (error) {
    console.error("Google sign-in error:", error);
    alert("Error signing in with Google: " + (error as Error).message);
  }
};

// Function to handle anonymous login
const loginAnonymously = async () => {
  try {
    const user = await signInAnonymouslyUser();
    console.log("Signed in anonymously:", user);
    router.push('/page/home'); // Navigate to the homepage
  } catch (error) {
    console.error("Anonymous sign-in error:", error);
    alert("Error signing in anonymously: " + (error as Error).message);
  }
};

// Function to navigate to the registration page
const navigateToRegister = () => {
  router.push('/register'); // Navigate to the registration page
};
</script>

<style scoped>
#login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 20px;
  background: #ffffff;
}

ion-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  transition: transform 0.2s;
  background: #ffffff;
}

ion-card:hover {
  transform: scale(1.02);
}

ion-item {
  --background: #ffffff;
  --highlight-background: #e0e0e0;
  border-radius: 8px;
  margin-bottom: 15px;
}

ion-button {
  margin-top: 15px;
  border-radius: 12px;
  font-weight: 500;
}

ion-button[fill="clear"] {
  color: #1e88e5;
}

ion-icon {
  margin-right: 8px;
}
</style>