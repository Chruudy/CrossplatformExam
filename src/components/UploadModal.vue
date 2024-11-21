<template>
  <ion-modal :isOpen="isOpen" @didDismiss="closeModal">
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Upload Image</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="form-container">
        <ion-item class="form-item">
          <ion-input v-model="uploadTitle" type="text" placeholder="Enter the title of your artwork"></ion-input>
        </ion-item>
        <ion-item class="form-item">
          <ion-textarea v-model="uploadDescription" placeholder="Describe your artwork"></ion-textarea>
        </ion-item>
        <ion-item class="form-item">
          <ion-input v-model="uploadTags" type="text" placeholder="Enter tags (e.g., landscape, abstract, modern)"></ion-input>
        </ion-item>
        <ion-item class="form-item">
          <ion-input v-model="exhibitionAddress" type="text" placeholder="Enter the exhibition address"></ion-input>
        </ion-item>
        <ion-item lines="none" class="form-item">
          <ion-label position="stacked">Image</ion-label>
          <input type="file" @change="handleFileChange" class="file-input" />
        </ion-item>
        <div v-if="uploadFile" class="post-preview">
          <ion-card>
            <img :src="previewImage" alt="Image Preview" />
            <ion-card-content>
              <ion-card-title>{{ uploadTitle }}</ion-card-title>
              <p>{{ uploadDescription }}</p>
              <div class="tags">
                <span v-for="(tag, index) in uploadTags.split(',').map((tag: string) => tag.trim())" :key="index" class="tag">
                  #{{ tag }}
                </span>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
        <ion-button expand="block" @click="uploadImage">Upload</ion-button>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app, auth } from '../services/firebase';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonItem, IonLabel, IonInput, IonTextarea, IonCard, IonCardContent, IonCardTitle } from '@ionic/vue';
import { geocodeAddress, loadGoogleMapsScript } from '../services/googleService';

// Define props and emits
const props = defineProps({
  isOpen: Boolean,
});
const emit = defineEmits(['close', 'upload']);

// State variables
const uploadTitle = ref('');
const uploadTags = ref('');
const uploadDescription = ref('');
const uploadFile = ref<File | null>(null);
const previewImage = ref('');
const exhibitionAddress = ref('');

const storage = getStorage(app);
const db = getFirestore(app);

// Function to close the modal and reset form values
const closeModal = () => {
  emit('close');
  // Reset values
  uploadTitle.value = '';
  uploadTags.value = '';
  uploadDescription.value = '';
  uploadFile.value = null;
  previewImage.value = '';
  exhibitionAddress.value = '';
};

// Function to handle file input change and generate a preview
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    uploadFile.value = target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.value = e.target?.result as string;
    };
    reader.readAsDataURL(uploadFile.value);
  }
};

// Function to upload the image and save metadata to Firestore
const uploadImage = async () => {
  if (!uploadFile.value || !uploadTitle.value || !uploadTags.value || !uploadDescription.value || !exhibitionAddress.value) {
    alert('Please provide all required fields.');
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to upload images.');
    return;
  }

  try {
    await loadGoogleMapsScript();
    const location = await geocodeAddress(exhibitionAddress.value);

    const metadata = {
      customMetadata: {
        artistId: user.uid,
        title: uploadTitle.value,
        description: uploadDescription.value,
        tags: uploadTags.value,
        address: exhibitionAddress.value,
        lat: location.lat.toString(),
        lng: location.lng.toString(),
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
      const docRef = doc(db, 'content', uploadFile.value!.name);
      await setDoc(docRef, {
        title: uploadTitle.value,
        imageURL,
        artistId: user.uid,
        tags: uploadTags.value.split(',').map((tag: string) => tag.trim()),
        description: uploadDescription.value,
        likes: 0,
        comments: [],
        createdAt: new Date(),
        address: exhibitionAddress.value,
        lat: location.lat,
        lng: location.lng,
      });
      alert('Image uploaded successfully!');
      closeModal();
      emit('upload');
    });
  } catch (error) {
    console.error('Error geocoding address:', error);
    alert('Error geocoding address: ' + error);
  }
};

// Watch the isOpen prop to reset the form when the modal is opened
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    uploadTitle.value = '';
    uploadTags.value = '';
    uploadDescription.value = '';
    uploadFile.value = null;
    previewImage.value = '';
    exhibitionAddress.value = '';
  }
});
</script>

<style scoped>
.form-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-item {
  --background: #ffffff;
  --highlight-background: #f0f0f0;
  border-radius: 8px;
  margin-bottom: 15px;
}

.file-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.post-preview {
  text-align: center;
  margin-top: 20px;
}

.post-preview img {
  max-width: 100%;
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
</style>