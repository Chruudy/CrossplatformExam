<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Profile</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Profile</ion-title>
        </ion-toolbar>
      </ion-header>
      <div id="profile-container">
        <img :src="user.profilePicture" alt="Profile Picture" id="profile-picture" />
        <h2>{{ user.name }}</h2>
        <p>{{ user.bio }}</p>
        <ion-button expand="block" @click="logout">Sign Out</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/vue';
import { logoutUser } from '../services/authentication'; // Import the logoutUser function

const user = {
  profilePicture: 'https://via.placeholder.com/150',
  name: 'John Doe',
  bio: 'A short bio about John Doe. He is a software developer with a passion for creating amazing applications.'
};

const router = useRouter();

const logout = async () => {
  try {
    await logoutUser();
    console.log("Logged out successfully");
    router.push('/'); // Navigate to the login page
  } catch (error) {
    console.error("Logout error:", error);
    alert("Error logging out: " + (error as Error).message);
  }
};
</script>

<style scoped>
#profile-container {
  text-align: center;
  padding: 20px;
}

#profile-picture {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  margin-bottom: 20px;
}

h2 {
  font-size: 24px;
  margin-bottom: 10px;
}

p {
  font-size: 16px;
  color: #8c8c8c;
}
</style>