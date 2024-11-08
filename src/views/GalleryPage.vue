<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Gallery</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Gallery</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-grid>
        <ion-row>
          <ion-col size="6" size-md="4" v-for="(image, index) in images" :key="index">
            <ion-card>
              <img :src="image.src" :alt="image.alt" />
              <ion-card-content>
                <ion-card-title>{{ image.title }}</ion-card-title>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonCardTitle } from '@ionic/vue';

const images = [
  { src: 'https://via.placeholder.com/150', alt: 'Image 1', title: 'Image 1' },
  { src: 'https://via.placeholder.com/150', alt: 'Image 2', title: 'Image 2' },
  { src: 'https://via.placeholder.com/150', alt: 'Image 3', title: 'Image 3' },
  { src: 'https://via.placeholder.com/150', alt: 'Image 4', title: 'Image 4' },
  { src: 'https://via.placeholder.com/150', alt: 'Image 5', title: 'Image 5' },
  { src: 'https://via.placeholder.com/150', alt: 'Image 6', title: 'Image 6' },
];
</script>

<style scoped>
ion-card {
  margin: 10px;
}

ion-card img {
  width: 100%;
  height: auto;
}

ion-card-title {
  font-size: 16px;
  text-align: center;
}
</style>