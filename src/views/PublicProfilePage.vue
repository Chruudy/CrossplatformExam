<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ displayNameWithAt }}</ion-title>
        <ion-buttons slot="end">
          <ion-button color="light" @click="sendMessage">
            <ion-icon name="mail-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
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
            <ion-icon name="heart-outline"></ion-icon>
            <p>{{ totalLikes }}</p>
            <span>Likes</span>
          </div>
          <div class="stat">
            <ion-icon name="person-add-outline"></ion-icon>
            <p>{{ following }}</p>
            <span>Following</span>
          </div>
        </div>
        <ion-button expand="block" color="primary" @click="toggleFollow">{{ isFollowing ? 'Unfollow' : 'Follow' }}</ion-button>
        
        <!-- Sorting Options -->
        <div class="filter-tags-container">
          <ion-select placeholder="Sort By" @ionChange="applySort($event.detail.value)">
            <ion-select-option value="newest">Newest</ion-select-option>
            <ion-select-option value="oldest">Oldest</ion-select-option>
            <ion-select-option value="mostLiked">Most Liked</ion-select-option>
          </ion-select>
        </div>

        <ion-grid>
          <ion-row>
            <ion-col size="12" size-md="6" size-lg="4" v-for="(post, index) in sortedPosts" :key="index">
              <ion-card>
                <img :src="post.imageURL" :alt="post.title" />
                <ion-card-content>
                  <ion-card-title>{{ post.title }}</ion-card-title>
                  <p>Likes: {{ post.likes }}</p>
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
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonCardTitle, IonButton, IonIcon, IonButtons, IonSelect, IonSelectOption } from '@ionic/vue';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
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
const following = ref(0);
const totalLikes = ref(0);
const posts = ref<Array<{ imageURL: string; title: string; likes: number; createdAt: string }>>([]);
const isFollowing = ref(false);
const sortOption = ref('newest');

const loadUserProfile = async () => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const profile = docSnap.data();
      firstName.value = profile.firstName;
      lastName.value = profile.lastName;
      displayName.value = profile.displayName;
      followers.value = profile.followers?.length || 0;
      following.value = profile.following?.length || 0;

      // Check if the current user is following this profile
      const currentUser = auth.currentUser;
      if (currentUser) {
        const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (currentUserDoc.exists()) {
          isFollowing.value = currentUserDoc.data().following?.includes(userId) || false;
        }
      }
    }

    // Always fetch profile picture from Firebase Storage
    const fileName = 'profile.png';
    const profilePicRef = firebaseStorageRef(storage, `profilePictures/${userId}/${fileName}`);
    profilePicture.value = await getDownloadURL(profilePicRef);

    const postsQuery = query(collection(db, 'content'), where('artistId', '==', userId));
    const querySnapshot = await getDocs(postsQuery);
    posts.value = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        imageURL: data.imageURL,
        title: data.title,
        likes: data.likes || 0, // Ensure likes are fetched and default to 0 if not present
        createdAt: data.createdAt || new Date().toISOString() // Ensure createdAt is fetched and default to current date if not present
      };
    });

    // Calculate total likes
    totalLikes.value = posts.value.reduce((sum, post) => sum + post.likes, 0);

    // Set up snapshot listener for likes
    setupLikesSnapshotListener();
    // Set up snapshot listener for followers
    setupFollowersSnapshotListener();
  } catch (error) {
    console.error('Error loading user profile:', error);
  }
};

const setupLikesSnapshotListener = () => {
  const postsQuery = query(collection(db, 'content'), where('artistId', '==', userId));
  onSnapshot(postsQuery, (snapshot) => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'modified') {
        const updatedPost = change.doc.data();
        const index = posts.value.findIndex(post => post.imageURL === updatedPost.imageURL);
        if (index !== -1) {
          posts.value[index].likes = updatedPost.likes || 0;
        }
        totalLikes.value = posts.value.reduce((sum, post) => sum + post.likes, 0);
      }
    });
  });
};

const setupFollowersSnapshotListener = () => {
  const profileDocRef = doc(db, 'users', userId);
  onSnapshot(profileDocRef, (doc) => {
    if (doc.exists()) {
      const profile = doc.data();
      followers.value = profile.followers?.length || 0;
      following.value = profile.following?.length || 0;
    }
  });
};

const toggleFollow = async () => {
  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to follow users.');
    return;
  }

  try {
    console.log('Toggling follow status...');
    const userDocRef = doc(db, 'users', user.uid);
    const profileDocRef = doc(db, 'users', userId);

    if (isFollowing.value) {
      console.log('Unfollowing user...');
      await updateDoc(userDocRef, { following: arrayRemove(userId) });
      await updateDoc(profileDocRef, { followers: arrayRemove(user.uid) });
    } else {
      console.log('Following user...');
      await updateDoc(userDocRef, { following: arrayUnion(userId) });
      await updateDoc(profileDocRef, { followers: arrayUnion(user.uid) });
    }

    isFollowing.value = !isFollowing.value;
    console.log('Follow status toggled.');
  } catch (error) {
    console.error('Error toggling follow status:', error);
  }
};

const sendMessage = () => {
  alert('Message functionality is not implemented yet.');
};

const displayNameWithAt = computed(() => `@${displayName.value}`);

const sortedPosts = computed(() => {
  if (sortOption.value === 'newest') {
    return [...posts.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortOption.value === 'oldest') {
    return [...posts.value].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (sortOption.value === 'mostLiked') {
    return [...posts.value].sort((a, b) => b.likes - a.likes);
  }
  return posts.value;
});

const applySort = (value: string) => {
  sortOption.value = value;
};

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

.filter-tags-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  gap: 16px;
}

ion-select {
  width: 100%;
  z-index: 1000;
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