<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar color="primary">
        <ion-title>{{ displayNameWithAt }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{ displayNameWithAt }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="profile-container">
        <img :src="profilePicture" alt="Profile Picture" id="profile-picture" />
        <h2>{{ displayNameWithAt }}</h2>
        <p class="info">{{ firstName }} {{ lastName }}</p>
        <div class="stats">
          <div class="stat">
            <ion-icon name="people-outline"></ion-icon>
            <p>{{ followers }}</p>
            <span>Followers</span>
          </div>
          <div class="stat">
            <ion-icon name="eye-outline"></ion-icon>
            <p>{{ views }}</p>
            <span>Views</span>
          </div>
          <div class="stat">
            <ion-icon name="heart-outline"></ion-icon>
            <p>{{ likes }}</p>
            <span>Likes</span>
          </div>
        </div>
        <ion-button expand="block" color="primary" @click="followUser">Follow</ion-button>
        <ion-grid>
          <ion-row>
            <ion-col size="6" size-md="4" v-for="(post, index) in posts" :key="index">
              <ion-card>
                <img :src="post.imageURL" :alt="post.title" />
                <ion-card-content>
                  <ion-card-title>{{ post.title }}</ion-card-title>
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
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonCardTitle, IonButton, IonIcon } from '@ionic/vue';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { getStorage, ref as firebaseStorageRef, getDownloadURL } from 'firebase/storage';
import { app, auth } from '../services/firebase';

const db = getFirestore(app);
const storage = getStorage(app);
const route = useRoute();
const userId = String(route.params.userId);

const firstName = ref('');
const lastName = ref('');
const displayName = ref('');
const profilePicture = ref('');
const followers = ref(0);
const views = ref(0);
const likes = ref(0);
const posts = ref<Array<{ imageURL: string; title: string }>>([]);

const loadUserProfile = async () => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const profile = docSnap.data();
      firstName.value = profile.firstName;
      lastName.value = profile.lastName;
      displayName.value = profile.displayName;
      followers.value = profile.followers || 0;
      views.value = profile.views || 0;
      likes.value = profile.likes || 0;
    }

    // Always fetch profile picture from Firebase Storage
    const fileName = 'profile.png';
    const profilePicRef = firebaseStorageRef(storage, `profilePictures/${userId}/${fileName}`);
    profilePicture.value = await getDownloadURL(profilePicRef);

    const postsQuery = query(collection(db, 'content'), where('artistId', '==', userId));
    const querySnapshot = await getDocs(postsQuery);
    posts.value = querySnapshot.docs.map(doc => doc.data() as { imageURL: string; title: string });
  } catch (error) {
    console.error('Error loading user profile:', error);
  }
};

const followUser = async () => {
  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to follow users.');
    return;
  }

  const userDocRef = doc(db, 'users', user.uid);
  await updateDoc(userDocRef, { following: arrayUnion(userId) });
  alert('User followed!');
};

const displayNameWithAt = computed(() => `@${displayName.value}`);

onMounted(loadUserProfile);
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
  object-fit: cover;
  margin-bottom: 20px;
}

.info {
  color: #757575;
  margin: 5px 0;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin: 20px 0;
}

.stat {
  text-align: center;
}

.stat ion-icon {
  font-size: 24px;
  color: #1e88e5;
}

.stat p {
  font-size: 18px;
  margin: 5px 0;
}

.stat span {
  font-size: 14px;
  color: #757575;
}

ion-card {
  margin: 10px;
  border-radius: 8px;
}

ion-card-title {
  font-size: 16px;
  margin: 10px 0;
}
</style>
