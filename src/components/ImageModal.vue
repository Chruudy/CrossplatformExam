<template>
  <div v-if="isModalOpen" class="modal" @click="closeModal">
    <div class="modal-background"></div>
    <div class="modal-content" @click.stop>
      <img :src="image.src" :alt="image.alt" class="enlarged-image" />
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
import { loadGoogleMapsScript, geocodeAddress } from '../services/googleService';

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

const props = defineProps<{ image: Image, isModalOpen: boolean }>();
const emit = defineEmits(['closeModal']);

const db = getFirestore();
const mapElement = ref<HTMLElement | null>(null);
const map = ref<google.maps.Map | null>(null);
const marker = ref<google.maps.Marker | null>(null);
const address = ref('');
const loading = ref(true);

const closeModal = () => {
  emit('closeModal');
};

const fetchAddress = async () => {
  try {
    console.log('Fetching address for image ID:', props.image.id);
    const docRef = doc(db, 'content', props.image.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      address.value = docSnap.data().address || '';
      if (!address.value) {
        console.error('Address field is empty');
      } else {
        console.log('Address fetched:', address.value);
      }
    } else {
      console.error('No such document!');
    }
  } catch (error) {
    console.error('Error fetching address:', error);
  } finally {
    loading.value = false;
  }
};

const initializeMap = async () => {
  if (typeof window.google === 'undefined') {
    console.error('Google Maps API is not loaded.');
    return;
  }

  if (!mapElement.value) {
    console.error('Map element is not available.');
    return;
  }

  try {
    console.log('Geocoding address:', address.value);
    const location = await geocodeAddress(address.value);
    console.log('Geocoded location:', location);
    const mapOptions = {
      center: location,
      zoom: 15,
    };
    map.value = new window.google.maps.Map(mapElement.value as HTMLElement, mapOptions);

    marker.value = new window.google.maps.Marker({
      position: location,
      map: map.value,
    });
    console.log('Map initialized with marker at location:', location);
  } catch (error) {
    console.error('Error initializing map:', error);
  }
};

watch(() => props.isModalOpen, async (newVal) => {
  if (newVal) {
    loading.value = true;
    console.log('Modal opened, loading Google Maps script...');
    await loadGoogleMapsScript();
    console.log('Google Maps script loaded, fetching address...');
    await fetchAddress();
    if (address.value) {
      console.log('Address found, initializing map...');
      initializeMap();
    } else {
      console.error('Address not found, map initialization skipped.');
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

.map-container {
  width: 100%;
  height: 400px;
  position: relative;
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