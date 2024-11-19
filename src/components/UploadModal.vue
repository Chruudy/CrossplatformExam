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
        <div class="map-container">
          <div ref="map" class="map"></div>
        </div>
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
                <span
                  v-for="(tag, index) in uploadTags.split(',').map(tag => tag.trim())"
                  :key="index"
                  class="tag"
                >
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
import { ref, watch, nextTick } from 'vue';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app, auth } from '../services/firebase';
import { loadGoogleMapsScript } from '../services/googleService';

const props = defineProps({
  isOpen: Boolean,
});

const emit = defineEmits(['close', 'upload']);

const uploadTitle = ref('');
const uploadTags = ref('');
const uploadDescription = ref('');
const uploadFile = ref<File | null>(null);
const previewImage = ref('');
const selectedLocation = ref<{ lat: number; lng: number } | null>(null);
const mapElement = ref<HTMLElement | null>(null);
const map = ref<google.maps.Map | null>(null);
const marker = ref<google.maps.Marker | null>(null);

const storage = getStorage(app);
const db = getFirestore(app);

const closeModal = () => {
  emit('close');
  // Reset values
  uploadTitle.value = '';
  uploadTags.value = '';
  uploadDescription.value = '';
  uploadFile.value = null;
  previewImage.value = '';
  selectedLocation.value = null;
};

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

const uploadImage = async () => {
  if (!uploadFile.value || !uploadTitle.value || !uploadTags.value || !uploadDescription.value || !selectedLocation.value) {
    alert('Please provide all required fields.');
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to upload images.');
    return;
  }

  try {
    const metadata = {
      customMetadata: {
        artistId: user.uid,
        title: uploadTitle.value,
        description: uploadDescription.value,
        tags: uploadTags.value,
        lat: selectedLocation.value.lat.toString(),
        lng: selectedLocation.value.lng.toString(),
      },
    };

    const fileRef = storageRef(storage, `images/${user.uid}/${uploadFile.value.name}`);
    const uploadTask = uploadBytesResumable(fileRef, uploadFile.value, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
      },
      (error) => {
        console.error('Upload failed:', error);
        alert('Error uploading image: ' + error.message);
      },
      async () => {
        const imageURL = await getDownloadURL(uploadTask.snapshot.ref);
        const docRef = doc(db, 'content', uploadFile.value!.name);
        await setDoc(docRef, {
          title: uploadTitle.value,
          imageURL,
          artistId: user.uid,
          tags: uploadTags.value.split(',').map((tag) => tag.trim()),
          description: uploadDescription.value,
          likes: 0,
          comments: [],
          createdAt: new Date(),
          lat: selectedLocation.value?.lat ?? 0,
          lng: selectedLocation.value?.lng ?? 0,
        });
        alert('Image uploaded successfully!');
        closeModal();
        emit('upload');
      }
    );
  } catch (error) {
    console.error('Error uploading image:', error);
    alert('Error uploading image: ' + error);
  }
};

const initializeMapWrapper = async () => {
  if (typeof window.google === 'undefined') {
    console.error('Google Maps API is not loaded.');
    return;
  }

  await nextTick(); // Ensure the mapElement is available

  if (!mapElement.value) {
    console.error('Map element is not available.');
    return;
  }

  if (!map.value) {
    const mapOptions = {
      center: { lat: 0, lng: 0 },
      zoom: 2,
    };

    map.value = new window.google.maps.Map(mapElement.value as HTMLElement, mapOptions);

    map.value.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        if (marker.value) {
          marker.value.setPosition(event.latLng);
        } else {
          marker.value = new window.google.maps.Marker({
            position: event.latLng,
            map: map.value,
          });
        }
        selectedLocation.value = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };
      }
    });
  }
};

watch(
  () => props.isOpen,
  async (newVal) => {
    if (newVal) {
      try {
        await loadGoogleMapsScript();
        initializeMapWrapper();
      } catch (error) {
        console.error('Error loading Google Maps script:', error);
        alert('Error loading Google Maps script. Please check your internet connection or disable any ad blockers.');
      }
    }
  }
);
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

.map-container {
  width: 100%;
  height: 400px;
  margin-bottom: 15px;
}
</style>
