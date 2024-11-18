<template>
  <div v-if="isModalOpen" class="modal" @click="closeModal">
    <div class="modal-background"></div>
    <div class="modal-content" @click.stop>
      <img :src="image.src" :alt="image.alt" class="enlarged-image" />
      <div class="map-container">
        <div ref="map" class="map"></div>
        <div class="exhibition-details">
          <h2>{{ exhibitionName }}</h2>
          <p>{{ exhibitionCountry }}</p>
          <p>{{ exhibitionAddress }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { initializeMap, loadGoogleMapsScript } from '../services/googleService';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const db = getFirestore();

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
}

const props = defineProps<{ image: Image, isModalOpen: boolean }>();
const emit = defineEmits(['closeModal']);

const exhibitionName = ref('');
const exhibitionCountry = ref('');
const exhibitionAddress = ref('');
const mapElement = ref<HTMLElement | null>(null);

const closeModal = () => {
  emit('closeModal');
};

const loadExhibitionDetails = async () => {
  try {
    const exhibitionDoc = await getDoc(doc(db, 'exhibitions', props.image.exhibitionId));
    if (exhibitionDoc.exists()) {
      const exhibitionData = exhibitionDoc.data();
      exhibitionName.value = exhibitionData.name;
      exhibitionCountry.value = exhibitionData.country;
      exhibitionAddress.value = exhibitionData.address;
    } else {
      console.error('Exhibition document does not exist:', props.image.exhibitionId);
    }
  } catch (error) {
    console.error('Error loading exhibition details:', error);
  }
};

onMounted(async () => {
  await loadExhibitionDetails();
  if (mapElement.value) {
    await loadGoogleMapsScript();
    initializeMap(mapElement.value, exhibitionAddress.value);
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
</style>