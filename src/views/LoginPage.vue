<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
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
            <ion-button expand="block" @click="login">Login</ion-button>
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
import { signIn } from '../services/authentication'; // Import the signIn function

const username = ref('');
const password = ref('');
const router = useRouter();

const login = async () => {
  if (username.value && password.value) {
    try {
      const user = await signIn(username.value, password.value);
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
</script>

<style scoped>
#login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 20px;
}

ion-card {
  width: 100%;
  max-width: 400px;
}
</style>