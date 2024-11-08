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
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue';

const user = {
  profilePicture: 'https://via.placeholder.com/150',
  name: 'John Doe',
  bio: 'A short bio about John Doe. He is a software developer with a passion for creating amazing applications.'
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