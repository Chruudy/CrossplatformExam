<template>
  <ion-modal :isOpen="isOpen" @didDismiss="closeModal">
    <ion-header>
      <ion-toolbar>
        <ion-title>Upload Artwork</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="form-container">
        <ion-item>
          <ion-label position="floating">Title</ion-label>
          <ion-input v-model="uploadTitle"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">Description</ion-label>
          <ion-input v-model="uploadDescription"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">Tags</ion-label>
          <ion-input v-model="uploadTags"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">Exhibition Latitude</ion-label>
          <ion-input v-model="exhibitionLat" type="number"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">Exhibition Longitude</ion-label>
          <ion-input v-model="exhibitionLng" type="number"></ion-input>
        </ion-item>
        <input type="file" @change="onFileChange" />
        <ion-button expand="block" @click="uploadImage">Upload</ion-button>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonItem, IonLabel, IonInput } from '@ionic/vue';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { auth } from '../services/firebase';

const isOpen = ref(false);
const uploadTitle = ref('');
const uploadDescription = ref('');
const uploadTags = ref('');
const exhibitionLat = ref(null);
const exhibitionLng = ref(null);
const uploadFile = ref(null);

const closeModal = () => {
  isOpen.value = false;
};

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    uploadFile.value = target.files[0];
  }
};

const uploadImage = async () => {
  if (!uploadFile.value || !uploadTitle.value || !uploadDescription.value || !uploadTags.value || !exhibitionLat.value || !exhibitionLng.value) {
    alert('Please provide all required fields.');
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to upload images.');
    return;
  }

  const storage = getStorage();
  const fileRef = storageRef(storage, `images/${user.uid}/${uploadFile.value.name}`);
  const uploadTask = uploadBytesResumable(fileRef, uploadFile.value);

  uploadTask.on('state_changed', (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    console.log('Upload is ' + progress + '% done');
  }, (error) => {
    console.error('Upload failed:', error);
    alert('Error uploading image: ' + error.message);
  }, async () => {
    const imageURL = await getDownloadURL(uploadTask.snapshot.ref);
    const db = getFirestore();
    const docRef = doc(db, 'content', uploadFile.value.name);
    await setDoc(docRef, {
      title: uploadTitle.value,
      description: uploadDescription.value,
      tags: uploadTags.value.split(',').map(tag => tag.trim()),
      imageURL,
      artistId: user.uid,
      exhibitionLat: parseFloat(exhibitionLat.value),
      exhibitionLng: parseFloat(exhibitionLng.value),
      createdAt: new Date(),
    });
    alert('Image uploaded successfully!');
    closeModal();
  });
};
</script>

<style scoped>
.form-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-item {
  --background: #f9f9f9;
  --highlight-background: #e0e0e0;
  border-radius: 8px;
  margin-bottom: 10px;
}

.file-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.image-preview {
  text-align: center;
  margin-top: 20px;
}

.image-preview img {
  max-width: 50%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.tags {
  margin-top: 10px;
}

.tag {
  display: inline-block;
  background-color: #e0e0e0;
  border-radius: 12px;
  padding: 5px 10px;
  margin: 5px;
  font-size: 14px;
}

.upload-button {
  margin-top: 20px;
  border-radius: 12px;
  font-weight: 500;
}
</style>