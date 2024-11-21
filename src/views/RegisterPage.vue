<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Register</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="register-container">
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
            <!-- Register Button -->
            <ion-button expand="block" color="primary" @click="register">
              <ion-icon slot="start" name="person-add-outline"></ion-icon>
              Register
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
import { signUpWithEmail } from '../services/authentication';

// State variables for username and password
const username = ref('');
const password = ref('');
const router = useRouter();

// Function to handle user registration
const register = async () => {
  if (username.value && password.value) {
    try {
      const user = await signUpWithEmail(username.value, username.value, password.value);
      console.log("Registered user:", user);
      router.push('/page/home'); // Navigate to the homepage
    } catch (error) {
      console.error("Registration error:", error);
      alert("Error registering: " + (error as Error).message);
    }
  } else {
    alert('Please enter both username and password');
  }
};
</script>

<style scoped>
#register-container {
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

ion-icon {
  margin-right: 8px;
}
</style>