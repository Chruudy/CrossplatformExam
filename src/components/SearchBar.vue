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

// Define props and emits
const props = defineProps<{ suggestedUsers: Array<{ displayName: string }> }>();
const emit = defineEmits(['search', 'selectUser']);

// State variables
const searchQuery = ref('');
const showSuggestions = ref(false);

// Handle input in the search bar
const handleInput = () => {
  if (searchQuery.value.startsWith('@')) {
    showSuggestions.value = true;
    emit('search', searchQuery.value);
  } else {
    showSuggestions.value = false;
    emit('search', searchQuery.value);
  }
};

// Select a user from the suggestions
const selectUser = (user: { displayName: string }) => {
  searchQuery.value = `@${user.displayName}`;
  showSuggestions.value = false;
  emit('selectUser', user);
};
</script>

<style scoped>
.search-bar {
  position: relative;
}

.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 9999;
}

.suggestions-list ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.suggestions-list li {
  padding: 10px;
  cursor: pointer;
}

.suggestions-list li:hover {
  background: #f0f0f0;
}
</style>