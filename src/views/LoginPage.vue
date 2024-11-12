<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar color="primary">
        <ion-title>Login</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Login</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="login-container">
        <ion-card>
          <ion-card-content>
            <ion-item>
              <ion-label position="floating">Username</ion-label>
              <ion-input v-model="username" type="text"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="floating">Password</ion-label>
              <ion-input v-model="password" type="password"></ion-input>
            </ion-item>
            <ion-button expand="block" color="primary" @click="login">Login</ion-button>
            <ion-button expand="block" color="danger" @click="loginWithGoogle">Login with Google</ion-button>
            <ion-button expand="block" color="medium" @click="loginAnonymously">Login Anonymously</ion-button>
            <ion-button expand="block" fill="clear" color="dark" @click="navigateToRegister">
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
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonItem, IonLabel, IonInput, IonButton } from '@ionic/vue';
import { signInWithEmail, signInWithGoogle, signInAnonymouslyUser } from '../services/authentication';

const username = ref('');
const password = ref('');
const router = useRouter();

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
  background: #f0f2f5;
}

ion-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  transition: transform 0.2s;
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
</style>
