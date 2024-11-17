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
      <div id="activity-container">
        <h2>Recent Activity</h2>
        <ion-list>
          <ion-item v-for="(activity, index) in recentActivities" :key="index">
            <ion-icon :icon="activity.icon" slot="start"></ion-icon>
            <ion-label>
              <h3>{{ activity.message }}</h3>
              <p>{{ activity.timestamp }}</p>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
      <div id="showcase-container">
        <h2>Recent Posts from Followed Users</h2>
        <ion-grid>
          <ion-row>
            <ion-col size="12" size-md="6" size-lg="4" v-for="(image, index) in followedImages" :key="index">
              <ion-card @click="navigateToPost(image.id)">
                <img :src="image.src" :alt="image.alt" />
                <ion-card-content>
                  <ion-card-title>{{ image.title }}</ion-card-title>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonCardTitle, IonList, IonItem, IonLabel, IonIcon } from '@ionic/vue';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth } from '../services/firebase';
import { getUserProfile } from '../services/authentication';
import { heart, personAdd } from 'ionicons/icons';
import { onAuthStateChanged } from 'firebase/auth';

const db = getFirestore();
const router = useRouter();

const firstName = ref('');
interface Image {
  id: string;
  src: string;
  alt: string;
  title: string;
}

interface Activity {
  icon: string;
  message: string;
  timestamp: string;
}

const followedImages = ref<Image[]>([]);
const recentActivities = ref<Activity[]>([]);

const loadFollowedImages = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const profile = await getUserProfile();
  if (profile && profile.following && profile.following.length > 0) {
    const followedUsers = profile.following;
    const contentQuery = query(collection(db, 'content'), where('artistId', 'in', followedUsers), orderBy('createdAt', 'desc'), limit(10));
    const querySnapshot = await getDocs(contentQuery);
    followedImages.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      src: doc.data().imageURL,
      alt: doc.data().title,
      title: doc.data().title
    }));
  } else {
    followedImages.value = []; // Clear the followed images if no followed users
  }
};

const loadRecentActivities = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const activitiesQuery = query(collection(db, 'activities'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'), limit(10));
  const querySnapshot = await getDocs(activitiesQuery);
  recentActivities.value = querySnapshot.docs.map(doc => ({
    icon: doc.data().type === 'like' ? heart : personAdd,
    message: doc.data().message,
    timestamp: new Date(doc.data().timestamp.toMillis()).toLocaleString()
  }));
};

const navigateToPost = (postId: string) => {
  router.push({ path: '/page/gallery', query: { postId } });
};

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const profile = await getUserProfile();
        if (profile) {
          firstName.value = profile.firstName;
        }
        await loadFollowedImages();
        await loadRecentActivities();
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    } else {
      console.error("No user is currently signed in.");
    }
  });
});
</script>
<style scoped>
/* Welcome Container Styling */
#welcome-container {
  text-align: center;
  padding: 20px;
  margin-top: 50px;
  color: #333;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 32px;
  margin-bottom: 20px;
  color: #1e88e5;
}

p {
  font-size: 18px;
  color: #8c8c8c;
}

/* Activity Container Styling */
#activity-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}

#activity-container h2 {
  font-size: 24px;
  color: #1e88e5;
  margin-bottom: 10px;
}

ion-list {
  background: #fff;
  border-radius: 8px;
}

ion-item {
  --background: #f9f9f9;
  --border-color: #e0e0e0;
  margin-bottom: 10px;
}

ion-item h3 {
  font-size: 16px;
  color: #333;
}

ion-item p {
  font-size: 14px;
  color: #757575;
}

/* Showcase Container Styling */
#showcase-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}

#showcase-container h2 {
  font-size: 24px;
  color: #1e88e5;
  margin-bottom: 10px;
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