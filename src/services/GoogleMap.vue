<template>
  <div ref="map" class="map"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{
  lat: number;
  lng: number;
}>()

const map = ref(null);

onMounted(() => {
  if (typeof google === 'undefined') {
    console.error('Google Maps API is not loaded.');
    return;
  }

  const mapOptions = {
    center: { lat: props.lat || 0, lng: props.lng || 0 },
    zoom: 15,
  };
  map.value = new google.maps.Map(document.getElementById('map') as HTMLElement, mapOptions);

  new google.maps.Marker({
    position: { lat: props.lat || 0, lng: props.lng || 0 },
    map: map.value,
  });
});
</script>

<style scoped>
.map {
  width: 100%;
  height: 400px;
}
</style>