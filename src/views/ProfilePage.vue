<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar color="primary">
        <ion-title>Profile</ion-title>
        <ion-buttons slot="end">
          <ion-button color="light" @click="toggleEditMode">
            <ion-icon :icon="isEditMode ? close : settings"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Profile</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="profile-container">
        <img :src="profilePicture" alt="Profile Picture" id="profile-picture" />
        <div v-if="isEditMode">
          <ion-item>
            <ion-label position="floating">First Name</ion-label>
            <ion-input v-model="firstName" type="text"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="floating">Last Name</ion-label>
            <ion-input v-model="lastName" type="text"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="floating">Display Name</ion-label>
            <ion-input v-model="displayNameWithoutAt" type="text"></ion-input>
          </ion-item>
          <ion-button expand="block" color="secondary" @click="takePhoto">Take Photo</ion-button>
          <ion-button expand="block" color="tertiary" @click="selectPhoto">Select Photo</ion-button>
          <ion-button expand="block" color="success" @click="saveProfile">Save Changes</ion-button>
        </div>
        <div v-else>
          <h2>{{ displayNameWithAt }}</h2>
          <p class="info">{{ firstName }} {{ lastName }}</p>
          <p class="info">Followers: {{ followers }}</p>
          <p class="info">Views: {{ views }}</p>
          <p class="info">Likes: {{ likes }}</p>
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
        <ion-button expand="block" color="danger" @click="logout">Sign Out</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonItem, IonLabel, IonInput, IonIcon, IonButtons, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonCardTitle } from '@ionic/vue';
import { settings, close } from 'ionicons/icons';
import { logoutUser, updateProfile, getUserProfile, uploadProfilePicture, getUserPosts } from '../services/authentication';
import { auth } from '../services/firebase';
import type { DocumentData } from 'firebase/firestore';

const isEditMode = ref(false);
const firstName = ref('');
const lastName = ref('');
const displayName = ref('');
const profilePicture = ref('');
const followers = ref(0);
const views = ref(0);
const likes = ref(0);
const posts = ref<DocumentData[]>([]);

const router = useRouter();

const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
};

const takePhoto = async () => {
  try {
    const image = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      quality: 100
    });
    if (image.dataUrl) {
      const user = auth.currentUser;
      if (user) {
        profilePicture.value = await uploadProfilePicture(user.uid, image.dataUrl);
      }
    }
  } catch (error) {
    console.error("Error taking photo:", error);
  }
};

const selectPhoto = async () => {
  try {
    const image = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
      quality: 100
    });
    if (image.dataUrl) {
      const user = auth.currentUser;
      if (user) {
        profilePicture.value = await uploadProfilePicture(user.uid, image.dataUrl);
      }
    }
  } catch (error) {
    console.error("Error selecting photo:", error);
  }
};

const saveProfile = async () => {
  try {
    await updateProfile({
      displayName: displayNameWithoutAt.value,
      photoURL: profilePicture.value,
      firstName: firstName.value,
      lastName: lastName.value
    });
    console.log("Profile updated successfully");
    alert("Profile updated successfully");
    isEditMode.value = false;
  } catch (error) {
    console.error("Profile update error:", error);
    alert("Error updating profile: " + (error as Error).message);
  }
};

const logout = async () => {
  try {
    await logoutUser();
    console.log("Logged out successfully");
    router.push('/'); // Navigate to the login page
  } catch (error) {
    console.error("Logout error:", error);
    alert("Error logging out: " + (error as Error).message);
  }
};

const loadUserProfile = async () => {
  try {
    const profile = await getUserProfile();
    if (profile) {
      firstName.value = profile.firstName;
      lastName.value = profile.lastName;
      displayName.value = profile.displayName;
      profilePicture.value = profile.photoURL;
      followers.value = profile.followers || 0;
      views.value = profile.views || 0;
      likes.value = profile.likes || 0;
    }
    const userPosts = await getUserPosts();
    posts.value = userPosts;
  } catch (error) {
    console.error("Error loading user profile:", error);
  }
};

const displayNameWithAt = computed(() => `@${displayName.value}`);
const displayNameWithoutAt = computed({
  get: () => displayName.value.startsWith('@') ? displayName.value.slice(1) : displayName.value,
  set: (value) => displayName.value = value.startsWith('@') ? value : `@${value}`
});

onMounted(() => {
  loadUserProfile();
});
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
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

h2 {
  font-size: 24px;
  margin-top: 10px;
  color: #1e88e5;
}

.info {
  color: #757575;
  margin: 5px 0;
}

ion-item {
  margin-bottom: 10px;
  --background: #f1f1f1;
  --placeholder-color: #757575;
}

ion-button {
  margin-top: 10px;
  border-radius: 12px;
}

ion-card {
  margin: 10px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
}
</style>
