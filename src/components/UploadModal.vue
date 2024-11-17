<template>
  <ion-modal :is-open="isOpen" @didDismiss="closeModal">
    <ion-header>
      <ion-toolbar>
        <ion-title>Upload Image</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal">Close</ion-button>
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
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getFirestore, addDoc, collection } from 'firebase/firestore';
import { app, auth } from '../services/firebase';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonItem, IonLabel, IonInput, IonTextarea } from '@ionic/vue';

const props = defineProps({
  isOpen: Boolean,
});

const emit = defineEmits(['close', 'upload']);

const uploadTitle = ref('');
const uploadTags = ref('');
const uploadDescription = ref('');
const uploadFile = ref<File | null>(null);

const storage = getStorage(app);
const db = getFirestore(app);

const closeModal = () => {
  emit('close');
  // Reset values
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
    alert('Please provide all required fields.');
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to upload images.');
    return;
  }

  const metadata = {
    customMetadata: {
      artistId: user.uid,
      title: uploadTitle.value,
      description: uploadDescription.value,
      tags: uploadTags.value,
    },
  };

  const fileRef = storageRef(storage, `images/${user.uid}/${uploadFile.value.name}`);
  const uploadTask = uploadBytesResumable(fileRef, uploadFile.value, metadata);

  uploadTask.on('state_changed', (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    console.log('Upload is ' + progress + '% done');
  }, (error) => {
    console.error('Upload failed:', error);
    alert('Error uploading image: ' + error.message);
  }, async () => {
    const imageURL = await getDownloadURL(uploadTask.snapshot.ref);
    const docRef = await addDoc(collection(db, 'content'), {
      title: uploadTitle.value,
      imageURL,
      artistId: user.uid,
      tags: uploadTags.value.split(',').map(tag => tag.trim()),
      description: uploadDescription.value,
      likes: 0,
      comments: [],
      createdAt: new Date(),
    });
    console.log('Document ID:', docRef.id); // Log the document ID
    alert('Image uploaded successfully!');
    closeModal();
    emit('upload');
  });
}

// Watch the isOpen prop to reset the form when the modal is opened
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    uploadTitle.value = '';
    uploadTags.value = '';
    uploadDescription.value = '';
    uploadFile.value = null;
  }
});
</script>
