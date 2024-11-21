<template>
  <div class="comments-section">
    <!-- Loop through comments and display each one -->
    <div v-for="(comment, index) in comments" :key="index" class="comment">
      <p>
        <strong class="display-name">{{ comment.displayName }}</strong>: {{ comment.commentText }}
        <!-- Show delete option only for the user's own comments -->
        <span v-if="comment.userId === auth.currentUser?.uid" class="delete-comment" @click="deleteComment(index)">Delete</span>
      </p>
    </div>
    <!-- Input for adding a new comment -->
    <ion-item>
      <ion-input v-model="newComment" placeholder="Add a comment..."></ion-input>
      <ion-button @click="addComment">Post</ion-button>
    </ion-item>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonItem, IonInput, IonButton } from '@ionic/vue';
import { auth } from '../services/firebase';

// Define the Comment interface
interface Comment {
  userId: string;
  commentText: string;
  displayName?: string;
}

// Define props and emits
defineProps<{ comments: Comment[], imageId: string }>();
const emit = defineEmits(['deleteComment', 'addComment']);

// State for the new comment input
const newComment = ref('');

// Function to add a new comment
const addComment = () => {
  if (newComment.value.trim()) {
    emit('addComment', newComment.value);
    newComment.value = '';
  }
};

// Function to delete a comment
const deleteComment = (index: number) => {
  emit('deleteComment', index);
};
</script>

<style scoped>
.display-name {
  color: var(--ion-color-tertiary);
}

.delete-comment {
  color: red;
  cursor: pointer;
  float: right;
}
</style>