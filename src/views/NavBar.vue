<template>
  <ion-page>
    <ion-tabs>
      <!-- Router outlet for tab navigation -->
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom" color="primary">
        <!-- Gallery Tab -->
        <ion-tab-button tab="gallery" href="/page/gallery">
          <ion-icon aria-hidden="true" :icon="images" />
          <ion-label>Gallery</ion-label>
        </ion-tab-button>

        <!-- Home Tab -->
        <ion-tab-button tab="home" href="/page/home">
          <ion-icon aria-hidden="true" :icon="home" />
          <ion-label>Home</ion-label>
        </ion-tab-button>

        <!-- Profile Tab -->
        <ion-tab-button tab="profile" href="/page/profile">
          <ion-icon aria-hidden="true" :icon="person" />
          <ion-label>Profile</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { home, person, images } from 'ionicons/icons';
</script>

<style scoped>
ion-tab-bar {
  --background: #ffffff;
  --color-selected: #1e88e5;
  --color: #8c8c8c;
}

ion-tab-button {
  transition: transform 0.2s;
}

ion-tab-button:active {
  transform: scale(0.95);
}

ion-icon {
  font-size: 20px;
}

ion-label {
  font-size: 14px;
}
</style>