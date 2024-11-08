<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="login-container">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Hey There!</ion-card-title>
            <ion-card-subtitle>Please sign in to continue</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="floating">Email</ion-label>
              <ion-input v-model="email" type="email" />
            </ion-item>
            <ion-item>
              <ion-label position="floating">Password</ion-label>
              <ion-input v-model="password" type="password" />
            </ion-item>
            <ion-button expand="block" @click="handleSignIn"
              >Sign In</ion-button
            >
            <ion-button expand="block" fill="outline" @click="handleSignUp"
              >Sign Up</ion-button
            >
            <ion-button
              expand="block"
              fill="clear"
              @click="handleAnonymousLogin"
              >Login Anonymously</ion-button
            >
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
} from "@ionic/vue";
import { signIn, signUp, signInAnonymously } from "../services/authentication"; // Adjust the path as necessary

const email = ref("");
const password = ref("");

const router = useRouter();

const handleSignIn = async () => {
  try {
    const user = await signIn(email.value, password.value);
    console.log("Signed in user:", user);
    router.push("/tabs/home"); // Navigate to the homepage
  } catch (error) {
    console.error("Sign-in error:", error);
    alert("Error signing in: " + (error as Error).message);
  }
};

const handleSignUp = async () => {
  try {
    const user = await signUp(email.value, password.value);
    console.log("Signed up user:", user);
    router.push("/tabs/home"); // Navigate to the homepage
  } catch (error) {
    console.error("Sign-up error:", error);
    alert("Error signing up: " + (error as Error).message);
  }
};

const handleAnonymousLogin = async () => {
  try {
    const user = await signInAnonymously();
    console.log("Signed in anonymously:", user);
    router.push("/tabs/home"); // Navigate to the homepage
  } catch (error) {
    console.error("Anonymous sign-in error:", error);
    alert("Error signing in anonymously: " + (error as Error).message);
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
}

ion-card {
  width: 100%;
  max-width: 400px;
  background-color: #1e1e1e; /* Dark theme background */
  color: #ffffff; /* White text */
}

ion-card-title,
ion-card-subtitle,
ion-label {
  color: #ffffff; /* White text */
}

ion-button {
  margin-top: 10px;
}
</style>
