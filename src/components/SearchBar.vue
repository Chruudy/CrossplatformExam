<template>
  <div class="search-bar">
    <ion-item>
      <ion-input v-model="searchQuery" @input="handleInput" type="text" placeholder="Search by title, artist, or tags..."></ion-input>
    </ion-item>

    <!-- Suggestions List -->
    <div v-if="showSuggestions" class="suggestions-list">
      <ul>
        <li v-for="(user, index) in props.suggestedUsers" :key="index" @click="selectUser(user)">
          {{ user.displayName }}
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { IonItem, IonInput } from '@ionic/vue';

const props = defineProps<{ suggestedUsers: Array<{ displayName: string }> }>();
const emit = defineEmits(['search', 'selectUser']);

const searchQuery = ref('');
const showSuggestions = ref(false);

const handleInput = () => {
  if (searchQuery.value.startsWith('@')) {
    showSuggestions.value = true;
    emit('search', searchQuery.value);
  } else {
    showSuggestions.value = false;
    emit('search', searchQuery.value);
  }
};

const selectUser = (user: { displayName: string }) => {
  searchQuery.value = `@${user.displayName}`;
  showSuggestions.value = false;
  emit('selectUser', user);
};
</script>
