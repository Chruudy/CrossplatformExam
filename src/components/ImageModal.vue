<template>
  <div v-if="isModalOpen" class="modal" @click="closeModal">
    <div class="modal-background"></div>
    <div class="modal-content" @click.stop>
      <img v-if="image" :src="image.src" :alt="image.alt" class="enlarged-image" />
      <div v-if="image" class="image-details">
        <h2>{{ image.title }}</h2>
        <p>{{ image.description }}</p>
      </div>
      <div v-if="image" class="map-container">
        <div ref="map" class="map"></div>
        <div class="exhibition-details">
          <h2>{{ image.title }}</h2>
          <p>{{ image.artistName }}</p>
          <p v-if="loading">Loading address...</p>
          <p v-else-if="address">{{ address }}</p>
          <p v-else class="error">Address not found</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { loadGoogleMapsScript, initializeMap } from '../services/googleService';

interface Image {
  id: string;
  src: string;
  alt: string;
  title: string;
  artistId: string;
  artistName: string;
  description: string;
}

const props = defineProps<{ image: Image | null; isModalOpen: boolean }>();
const emit = defineEmits(['closeModal']);

const db = getFirestore();
const mapElement = ref<HTMLElement | null>(null);
const address = ref('');
const lat = ref<number | null>(null);
const lng = ref<number | null>(null);
const loading = ref(true);

const closeModal = () => {
  emit('closeModal');
};

const fetchLocationData = async () => {
  if (!props.image?.id) {
    console.error('Image ID is missing.');
    loading.value = false;
    return;
  }

  try {
    const docRef = doc(db, 'content', props.image.id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      address.value = data.address || 'Address not available';
      lat.value = data.lat;
      lng.value = data.lng;

      console.log('Fetched location data:', { address: address.value, lat: lat.value, lng: lng.value });
    } else {
      console.error('No document found for the given image ID.');
    }
  } catch (error) {
    console.error('Error fetching location data:', error);
  } finally {
    loading.value = false;
  }
};

const setupMap = async () => {
  if (lat.value !== null && lng.value !== null && mapElement.value) {
    initializeMap(mapElement.value, lat.value, lng.value);
    console.log('Map initialized.');
  } else {
    console.error('Cannot initialize map: Missing lat/lng or map element.');
  }
};

watch(() => props.isModalOpen, async (isOpen) => {
  if (isOpen) {
    console.log('Modal opened. Loading Google Maps script...');
    await loadGoogleMapsScript();
    console.log('Google Maps script loaded. Fetching location data...');
    await fetchLocationData();
    await setupMap();
  }
});
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
}

.modal-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.enlarged-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  margin-bottom: 20px;
}

.image-details {
  text-align: center;
  margin-bottom: 20px;
}

.image-details h2 {
  font-size: 24px;
  color: #333;
}

.image-details p {
  font-size: 16px;
  color: #666;
}

.map-container {
  width: 100%;
  height: 400px;
  position: relative;
}

.exhibition-details {
  margin-top: 10px;
}

.error {
  color: red;
}
</style>