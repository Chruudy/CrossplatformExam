<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Profile</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="toggleEditMode">
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
            <ion-input v-model="displayName" type="text"></ion-input>
          </ion-item>
          <ion-button expand="block" @click="takePhoto">Take Photo</ion-button>
          <ion-button expand="block" @click="selectPhoto">Select Photo</ion-button>
          <ion-button expand="block" @click="saveProfile">Save Changes</ion-button>
        </div>
        <div v-else>
          <h2>{{ displayName }}</h2>
          <p>{{ firstName }} {{ lastName }}</p>
        </div>
        <ion-button expand="block" @click="logout">Sign Out</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonItem, IonLabel, IonInput, IonIcon, IonButtons } from '@ionic/vue';
import { settings, close } from 'ionicons/icons';
import { logoutUser, updateProfile, getUserProfile, uploadProfilePicture } from '../services/authentication'; // Import the necessary functions
import { auth } from '../services/firebase'; // Import auth from firebase configuration

const isEditMode = ref(false);
const firstName = ref('');
const lastName = ref('');
const displayName = ref('');
const profilePicture = ref('');

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
      displayName: displayName.value,
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
    }
  } catch (error) {
    console.error("Error loading user profile:", error);
  }
};

loadUserProfile();
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
}

ion-item {
  margin-bottom: 10px;
}

ion-button {
  margin-top: 10px;
}
</style>