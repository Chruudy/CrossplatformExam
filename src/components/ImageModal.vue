<template>
  <div v-if="isModalOpen" class="modal" @click="closeModal">
    <div class="modal-background"></div>
    <div class="modal-content" @click.stop>
      <img :src="image.src" :alt="image.alt" class="enlarged-image" />
      <div class="image-details">
        <h2>{{ image.title }}</h2>
        <p>{{ image.description }}</p>
      </div>
      <div class="map-container">
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

// Define the Image interface
interface Image {
  id: string;
  src: string;
  alt: string;
  title: string;
  artistId: string;
  artistName: string;
  description: string;
  likes: number;
  comments: Array<{ userId: string; commentText: string }>;
  tags: string[];
  exhibitionId: string;
  lat: number;
  lng: number;
  address: string;
}

// Define props and emits
const props = defineProps<{ image: Image, isModalOpen: boolean }>();
const emit = defineEmits(['closeModal']);

// State variables
const db = getFirestore();
const mapElement = ref<HTMLElement | null>(null);
const address = ref('');
const loading = ref(true);

// Function to close the modal
const closeModal = () => {
  emit('closeModal');
};

// Function to fetch the address from Firestore
const fetchAddress = async () => {
  if (!props.image) return;

  try {
    const docRef = doc(db, 'content', props.image.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      address.value = docSnap.data().address || '';
    }
  } catch (error) {
    console.error('Error fetching address:', error);
  } finally {
    loading.value = false;
  }
};

// Function to initialize the map with coordinates
const initializeMapWithCoordinates = async () => {
  if (!mapElement.value || !props.image) return;

  try {
    initializeMap(mapElement.value, props.image.lat, props.image.lng);
  } catch (error) {
    console.error('Error initializing map:', error);
  }
};

// Watch for changes in the modal's open state
watch(() => props.isModalOpen, async (newVal) => {
  if (newVal) {
    loading.value = true;
    await loadGoogleMapsScript();
    await fetchAddress();
    if (props.image.lat && props.image.lng) {
      initializeMapWithCoordinates();
    }
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
  margin-bottom: 20px;
}

.exhibition-details {
  position: absolute;
  bottom: 10px;
  left: 10px;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  padding: 10px;
  border-radius: 8px;
}

.exhibition-details h2 {
  margin: 0;
  font-size: 18px;
}

.exhibition-details p {
  margin: 0;
  font-size: 14px;
}

.error {
  color: red;
}
</style>