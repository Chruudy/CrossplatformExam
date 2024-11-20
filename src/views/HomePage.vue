<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Home</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="welcome-container">
        <h1>Welcome, {{ firstName }}!</h1>
        <p>Explore our app and enjoy the features we have to offer.</p>
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
        <div class="grid-container">
          <div class="grid-item" v-for="(image, index) in followedImages" :key="index" @click="openImageModal(image)">
            <img :src="image.src" :alt="image.alt" />
            <div class="image-title">{{ image.title }}</div>
          </div>
        </div>
      </div>
      <ImageModal v-if="isModalOpen" :image="selectedImage" :isModalOpen="isModalOpen" @closeModal="closeModal" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonIcon } from '@ionic/vue';
import { getFirestore, collection, query, where, limit, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { auth } from '../services/firebase';
import { heart, personAdd } from 'ionicons/icons';
import { onAuthStateChanged } from 'firebase/auth';
import ImageModal from '../components/ImageModal.vue';

const db = getFirestore();

const firstName = ref('');
interface Image {
  id: string;
  src: string;
  alt: string;
  title: string;
  description: string;
}

interface Activity {
  icon: string;
  message: string;
  timestamp: string;
}

const followedImages = ref<Image[]>([]);
const recentActivities = ref<Activity[]>([]);
const isModalOpen = ref(false);
const selectedImage = ref<Image | null>(null);
const userProfile = ref<any>(null);

const loadFollowedImages = async (followedUsers: string[]) => {
  try {
    if (followedUsers.length > 0) {
      const contentQuery = query(collection(db, 'content'), where('artistId', 'in', followedUsers), orderBy('createdAt', 'desc'), limit(10));
      onSnapshot(contentQuery, (snapshot) => {
        followedImages.value = snapshot.docs.map(doc => ({
          id: doc.id,
          src: doc.data().imageURL,
          alt: doc.data().title,
          title: doc.data().title,
          description: doc.data().description
        }));
      });
    } else {
      followedImages.value = []; // Clear the followed images if no followed users
    }
  } catch (error) {
    console.error('Error loading followed images:', error);
  }
};

const loadRecentActivities = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const activitiesQuery = query(collection(db, 'activities'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'), limit(10));
    onSnapshot(activitiesQuery, (snapshot) => {
      recentActivities.value = snapshot.docs.map(doc => ({
        icon: doc.data().type === 'like' ? heart : personAdd,
        message: doc.data().message,
        timestamp: new Date(doc.data().timestamp.toMillis()).toLocaleString()
      }));
    });
  } catch (error) {
    console.error('Error loading recent activities:', error);
  }
};

const openImageModal = (image: Image) => {
  selectedImage.value = image;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedImage.value = null;
};

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const profileDocRef = doc(db, 'users', user.uid);
        onSnapshot(profileDocRef, async (doc) => {
          if (doc.exists()) {
            userProfile.value = doc.data();
            firstName.value = userProfile.value.firstName;
            await loadFollowedImages(userProfile.value.following || []);
          }
        });
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
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 28px;
  margin-bottom: 10px;
  color: #1e88e5;
}

p {
  font-size: 16px;
  color: #666;
}

/* Activity Container Styling */
#activity-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}

#activity-container h2 {
  font-size: 22px;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}

#showcase-container h2 {
  font-size: 22px;
  color: #1e88e5;
  margin-bottom: 10px;
}

/* Grid Styling */
.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.grid-item {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.grid-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.image-title {
  padding: 10px;
  font-size: 14px;
  text-align: center;
  background: #fff;
  color: #333;
}

.grid-item:hover {
  transform: scale(1.05);
}
</style>