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
      <div id="showcase-container">
        <h2>Recent Posts from Followed Users</h2>
        <div v-for="(user, index) in followedUsersPosts" :key="index" class="user-posts-container">
          <div class="horizontal-scroll">
            <div class="grid-item" v-for="(image, index) in user.posts" :key="index" @click="openImageModal(image)">
              <img :src="image.src" :alt="image.alt" />
              <div class="image-title">{{ image.title }}</div>
            </div>
          </div>
        </div>
      </div>
      <ImageModal v-if="isModalOpen && selectedImage" :image="selectedImage" :isModalOpen="isModalOpen" @closeModal="closeModal" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { getFirestore, collection, query, where, limit, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import ImageModal from '../components/ImageModal.vue';

const db = getFirestore();

// State variables
const firstName = ref('');

// Define the Image interface
interface Image {
  id: string;
  src: string;
  alt: string;
  title: string;
  description: string;
  artistId: string;
  artistName: string;
  likes: number;
  comments: Array<{ userId: string; commentText: string }>;
  tags: string[];
  exhibitionId: string;
  lat: number;
  lng: number;
  address: string;
}

// Define the UserPosts interface
interface UserPosts {
  artistName: string;
  posts: Image[];
}

// Reactive state variables
const followedUsersPosts = ref<UserPosts[]>([]);
const isModalOpen = ref(false);
const selectedImage = ref<Image | null>(null);
const userProfile = ref<any>(null);

// Function to load images from followed users
const loadFollowedImages = async (followedUsers: string[]) => {
  try {
    if (followedUsers.length > 0) {
      const contentQuery = query(collection(db, 'content'), where('artistId', 'in', followedUsers), orderBy('createdAt', 'desc'), limit(10));
      onSnapshot(contentQuery, (snapshot) => {
        const userPostsMap: { [key: string]: UserPosts } = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const image: Image = {
            id: doc.id,
            src: data.imageURL,
            alt: data.title,
            title: data.title,
            description: data.description,
            artistId: data.artistId,
            artistName: data.artistName,
            likes: data.likes || 0,
            comments: data.comments || [],
            tags: data.tags || [],
            exhibitionId: data.exhibitionId || '',
            lat: data.lat || 0,
            lng: data.lng || 0,
            address: data.address || ''
          };
          if (!userPostsMap[data.artistId]) {
            userPostsMap[data.artistId] = { artistName: data.artistName, posts: [] };
          }
          userPostsMap[data.artistId].posts.push(image);
        });
        followedUsersPosts.value = Object.values(userPostsMap);
      });
    } else {
      followedUsersPosts.value = []; // Clear the followed images if no followed users
    }
  } catch (error) {
    console.error('Error loading followed images:', error);
  }
};

// Function to open the image modal
const openImageModal = (image: Image) => {
  selectedImage.value = image;
  isModalOpen.value = true;
};

// Function to close the image modal
const closeModal = () => {
  isModalOpen.value = false;
  selectedImage.value = null;
};

// Load user profile and data on component mount
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

/* User Posts Container Styling */
.user-posts-container {
  margin-bottom: 30px;
}

/* Horizontal Scroll Styling */
.horizontal-scroll {
  display: flex;
  overflow-x: auto;
  gap: 16px;
  padding: 16px;
}

.grid-item {
  flex: 0 0 auto;
  width: 200px;
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