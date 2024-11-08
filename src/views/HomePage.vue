<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Welcome</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Welcome</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="welcome-container">
        <h1>Welcome, {{ user.name }}!</h1>
        <p>We're glad to have you here. Explore our app and enjoy the features we have to offer.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue';

const user = {
  name: 'John Doe'
};
</script>

<style scoped>
#welcome-container {
  text-align: center;
  padding: 20px;
  margin-top: 50px;
}

h1 {
  font-size: 28px;
  margin-bottom: 20px;
}

p {
  font-size: 18px;
  color: #8c8c8c;
}
</style>