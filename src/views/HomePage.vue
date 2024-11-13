<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar color="primary">
        <ion-title>Home</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Home</ion-title>
        </ion-toolbar>
      </ion-header>
      <div id="welcome-container">
        <h1>Welcome, {{ firstName }}!</h1>
        <p>We're glad to have you here. Explore our app and enjoy the features we have to offer.</p>
      </div>
      <ion-grid>
        <ion-row>
          <ion-col size="6" size-md="4" v-for="(image, index) in followedImages" :key="index">
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
import { ref, onMounted } from 'vue';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonCardTitle } from '@ionic/vue';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { auth } from '../services/firebase';
import { getUserProfile } from '../services/authentication';

const db = getFirestore();

const firstName = ref('');
interface Image {
  id: string;
  src: string;
  alt: string;
  title: string;
}

const followedImages = ref<Image[]>([]);

const loadFollowedImages = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const profile = await getUserProfile();
  if (profile && profile.following) {
    const followedUsers = profile.following;
    const contentQuery = query(collection(db, 'content'), where('artistId', 'in', followedUsers));
    const querySnapshot = await getDocs(contentQuery);
    followedImages.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      src: doc.data().imageURL,
      alt: doc.data().title,
      title: doc.data().title
    }));
  }
};

onMounted(async () => {
  try {
    const profile = await getUserProfile();
    if (profile) {
      firstName.value = profile.firstName;
    }
    await loadFollowedImages();
  } catch (error) {
    console.error("Error loading user profile:", error);
  }
});
</script>

<style scoped>
/* Welcome Container Styling */
#welcome-container {
  text-align: center;
  padding: 20px;
  margin-top: 50px;
  color: #333;
}

h1 {
  font-size: 28px;
  margin-bottom: 20px;
  color: #1e88e5;
}

p {
  font-size: 18px;
  color: #8c8c8c;
}

/* Card Styling */
ion-card {
  margin: 10px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}
ion-card:hover {
  transform: scale(1.02);
}

ion-card img {
  width: 100%;
  height: auto;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

ion-card-title {
  font-size: 16px;
  text-align: center;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}
</style>
