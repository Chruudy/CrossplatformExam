<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Profile</ion-title>
        <ion-buttons slot="end" v-if="!isAnonymous">
          <ion-button color="light" @click="toggleEditMode">
            <ion-icon :icon="isEditMode ? close : settings"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="profile-container">
        <div v-if="isAnonymous">
          <p class="info">You are signed in anonymously.</p>
          <ion-button expand="block" color="primary" @click="navigateToRegister">Create an Account</ion-button>
        </div>
        <div v-else>
          <img :src="profilePicture" alt="Profile Picture" id="profile-picture" />
          <div v-if="isEditMode" class="edit-mode">
            <ion-item class="form-item">
              <ion-label slot="start" class="custom-label">First-Name</ion-label>
              <ion-input v-model="firstName" type="text" placeholder="First Name"></ion-input>
            </ion-item>
            <ion-item class="form-item">
              <ion-label slot="start" class="custom-label">Last-Name</ion-label>
              <ion-input v-model="lastName" type="text" placeholder="Last Name"></ion-input>
            </ion-item>
            <ion-item class="form-item">
              <ion-label slot="start" class="custom-label">Display-Name</ion-label>
              <ion-input v-model="displayNameWithoutAt" type="text" placeholder="Display Name"></ion-input>
            </ion-item>
            <div class="photo-buttons">
              <ion-button expand="block" color="secondary" @click="takePhoto">Take Photo</ion-button>
              <ion-button expand="block" color="tertiary" @click="selectPhoto">Select Photo</ion-button>
            </div>
            <ion-button expand="block" color="success" @click="saveProfile">Save Changes</ion-button>
          </div>
          <div v-else>
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
            <ion-grid>
              <ion-row>
                <ion-col size="6" size-md="4" v-for="(post, index) in posts" :key="index">
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
          <ion-button expand="block" color="danger" @click="logout">Sign Out</ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonItem, IonInput, IonLabel, IonIcon, IonButtons, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonCardTitle } from '@ionic/vue';
import { settings, close } from 'ionicons/icons';
import { logoutUser, updateProfile, getUserProfile, uploadProfilePicture, getUserPosts } from '../services/authentication';
import { auth } from '../services/firebase';
import { getStorage, ref as firebaseStorageRef, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';

const isEditMode = ref(false);
const firstName = ref('');
const lastName = ref('');
const displayName = ref('');
const profilePicture = ref('');
const followers = ref(0);
const following = ref(0);
const totalLikes = ref(0);
const posts = ref<Array<{ imageURL: string; title: string; likes: number }>>([]);
const isAnonymous = ref(false);

const router = useRouter();
const storage = getStorage();

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

const navigateToRegister = () => {
  router.push('/register'); // Navigate to the registration page
};

const loadUserProfile = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No user is currently signed in.");
      return;
    }

    isAnonymous.value = user.isAnonymous;

    if (!isAnonymous.value) {
      const profile = await getUserProfile();
      if (profile) {
        firstName.value = profile.firstName;
        lastName.value = profile.lastName;
        displayName.value = profile.displayName;
        followers.value = profile.followers || 0;
        following.value = profile.following?.length || 0;

        // Fetch profile picture from Firebase Storage
        const profilePicRef = firebaseStorageRef(storage, `profilePictures/${user.uid}/profile.png`);
        profilePicture.value = await getDownloadURL(profilePicRef);
      }

      // Fetch user posts and likes
      const userPosts = await getUserPosts();
      posts.value = userPosts.map(post => ({
        imageURL: post.imageURL,
        title: post.title,
        likes: post.likes || 0 // Ensure likes are fetched and default to 0 if not present
      }));

      // Calculate total likes
      totalLikes.value = posts.value.reduce((sum, post) => sum + post.likes, 0);
    }
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
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loadUserProfile();
    } else {
      console.error("No user is currently signed in.");
    }
  });
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
  object-fit: cover;
  margin-bottom: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.edit-mode {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.photo-buttons {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 10px;
}

.custom-label {
  font-weight: bold;
  font-size: 14px;
  color: #1e88e5;
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

ion-item {
  margin-bottom: 10px;
  --background: #f9f9f9;
  --highlight-background: #e0e0e0;
  border-radius: 8px;
}

ion-label {
  --padding-start: 0px;
  --padding-end: 0px;
  --margin-top: -10px; /* Adjust this value to move the label higher */
}

ion-button {
  margin-top: 10px;
  border-radius: 12px;
}

ion-card {
  margin: 10px;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

ion-card img {
  width: 100%;
  height: auto;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

ion-card-title {
  font-size: 16px;
  text-align: center;
  font-weight: 600;
  margin-bottom: 8px;
}
</style>