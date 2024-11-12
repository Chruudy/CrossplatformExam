<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar color="primary">
        <ion-title>Gallery</ion-title>
        <ion-buttons slot="end">
          <ion-button color="light" @click="openUploadModal">Upload</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Gallery</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="search-bar">
        <ion-item>
          <ion-label position="floating">Search</ion-label>
          <ion-input v-model="searchQuery" @ionInput="search" type="text" placeholder="Search by title or artist..."></ion-input>
        </ion-item>
      </div>

      <ion-list v-if="showSuggestions">
        <ion-item v-for="(user, index) in suggestedUsers" :key="index" @click="selectUser(user)">
          {{ user.displayName }}
        </ion-item>
      </ion-list>

      <ion-grid>
        <ion-row>
          <ion-col size="6" size-md="4" v-for="(image, index) in filteredImages" :key="index">
            <ion-card>
              <img :src="image.src" :alt="image.alt" />
              <ion-card-content>
                <ion-card-title>{{ image.title }}</ion-card-title>
                <div class="action-buttons">
                  <ion-button color="primary" fill="outline" size="small" @click="likeImage(image.id)">Like</ion-button>
                  <ion-button color="secondary" fill="outline" size="small" @click="commentImage(image.id)">Comment</ion-button>
                  <ion-button color="tertiary" fill="outline" size="small" @click="followArtist(image.artistId)">Follow</ion-button>
                </div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>

      <ion-modal :is-open="isUploadModalOpen" @didDismiss="closeUploadModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>Upload Image</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeUploadModal">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-item>
            <ion-label position="floating">Title</ion-label>
            <ion-input v-model="uploadTitle" type="text"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="floating">Tags (comma-separated)</ion-label>
            <ion-input v-model="uploadTags" type="text"></ion-input>
          </ion-item>
          <ion-item>
            <ion-label position="floating">Description</ion-label>
            <ion-textarea v-model="uploadDescription"></ion-textarea>
          </ion-item>
          <ion-item lines="none">
            <ion-label position="stacked">Image</ion-label>
            <input type="file" @change="handleFileChange" class="file-input" />
          </ion-item>
          <ion-button expand="block" @click="uploadImage">Upload</ion-button>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonCardTitle, IonItem, IonLabel, IonInput, IonButton, IonModal, IonButtons, IonList, IonTextarea } from '@ionic/vue';
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, doc, increment, arrayUnion, orderBy, limit } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../services/firebase';
import { auth } from '../services/firebase';

const db = getFirestore(app);
const storage = getStorage(app);

const searchQuery = ref('');
const images = ref([]);
const isUploadModalOpen = ref(false);
const uploadTitle = ref('');
const uploadTags = ref('');
const uploadDescription = ref('');
const uploadFile = ref<File | null>(null);
const suggestedUsers = ref([]);
const showSuggestions = ref(false);

const filteredImages = computed(() => {
  return images.value.filter(image => image.title.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const search = async () => {
  if (searchQuery.value.startsWith('@')) {
    showSuggestions.value = true;
    const artistQuery = query(collection(db, 'users'), where('displayName', '>=', searchQuery.value.slice(1)), orderBy('displayName'), limit(5));
    const querySnapshot = await getDocs(artistQuery);
    suggestedUsers.value = querySnapshot.docs.map(doc => doc.data());
  } else {
    showSuggestions.value = false;
    const contentQuery = query(collection(db, 'content'), where('title', '>=', searchQuery.value), where('title', '<=', searchQuery.value + '\uf8ff'));
    const querySnapshot = await getDocs(contentQuery);
    images.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      src: doc.data().imageURL,
      alt: doc.data().title,
      title: doc.data().title,
      artistId: doc.data().artistId
    }));
  }
};

const selectUser = (user) => {
  searchQuery.value = `@${user.displayName}`;
  showSuggestions.value = false;
  search();
};

const openUploadModal = () => {
  isUploadModalOpen.value = true;
};

const closeUploadModal = () => {
  isUploadModalOpen.value = false;
  uploadTitle.value = '';
  uploadTags.value = '';
  uploadDescription.value = '';
  uploadFile.value = null;
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    uploadFile.value = target.files[0];
  }
};

const uploadImage = async () => {
  if (!uploadFile.value || !uploadTitle.value || !uploadTags.value || !uploadDescription.value) {
    alert('Please provide all required fields (title, tags, description, and image).');
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to upload images.');
    return;
  }

  const fileRef = storageRef(storage, `images/${user.uid}/${uploadFile.value.name}`);
  await uploadBytes(fileRef, uploadFile.value);
  const imageURL = await getDownloadURL(fileRef);

  await addDoc(collection(db, 'content'), {
    title: uploadTitle.value,
    imageURL,
    artistId: user.uid,
    tags: uploadTags.value.split(',').map(tag => tag.trim()), // Convert tags to an array
    description: uploadDescription.value,
    likes: 0,
    comments: [],
    createdAt: new Date()
  });

  alert('Image uploaded successfully!');
  closeUploadModal();
  search();
};

const likeImage = async (imageId: string) => {
  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to like images.');
    return;
  }

  const imageDoc = doc(db, 'content', imageId);
  await updateDoc(imageDoc, {
    likes: increment(1)
  });

  alert('Image liked!');
  search();
};

const commentImage = async (imageId: string) => {
  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to comment on images.');
    return;
  }

  const comment = prompt('Enter your comment:');
  if (!comment) {
    return;
  }

  const imageDoc = doc(db, 'content', imageId);
  await updateDoc(imageDoc, {
    comments: arrayUnion({ userId: user.uid, comment, createdAt: new Date() })
  });

  alert('Comment added!');
  search();
};

const followArtist = async (artistId: string) => {
  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to follow artists.');
    return;
  }

  const userDoc = doc(db, 'users', user.uid);
  await updateDoc(userDoc, {
    following: arrayUnion(artistId)
  });

  alert('Artist followed!');
};
</script>

<style scoped>
/* Header and Content */
ion-header {
  --background: #1e88e5;
  --color: white;
}

/* Search Bar */
.search-bar ion-item {
  border-radius: 12px;
  margin: 10px;
  --background: #f1f1f1;
  --placeholder-color: #757575;
}

/* Cards */
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

/* Card Titles and Buttons */
ion-card-title {
  font-size: 16px;
  text-align: center;
  font-weight: 600;
  margin-bottom: 8px;
}
.action-buttons {
  display: flex;
  justify-content: space-between;
  padding-top: 8px;
}
.action-buttons ion-button {
  --border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

/* Modal */
ion-modal {
  --background: #ffffff;
  padding: 20px;
}
ion-modal ion-item {
  margin-bottom: 15px;
}
.file-input {
  opacity: 1;
  display: block;
  cursor: pointer;
}
</style>
