<template>
  <ion-card>
    <ion-card-header>
      <ion-card-subtitle>
        <router-link :to="`/page/user/${image.artistId}`">{{ image.artistName }}</router-link>
      </ion-card-subtitle>
    </ion-card-header>
    <img :src="image.src" :alt="image.alt" class="image" @click="openModal" />
    <ion-card-content>
      <ion-card-title>{{ image.title }}</ion-card-title>
      <p class="description">{{ translatedDescription || image.description }}</p>
      <div class="translate-button">
        <ion-button color="medium" fill="clear" size="small" @click="translateDescription">
          <ion-icon :icon="language"></ion-icon>
          Translate
        </ion-button>
      </div>
      <div class="action-buttons">
        <ion-button color="primary" fill="clear" size="small" @click="toggleLike">
          <ion-icon :icon="isLiked ? heart : heartOutline" :color="isLiked ? 'danger' : 'medium'"></ion-icon>
          {{ likes }}
        </ion-button>
        <ion-button color="secondary" fill="clear" size="small" @click="toggleComments">
          <ion-icon :icon="chatbubbleOutline"></ion-icon>
          Comments
        </ion-button>
        <ion-button color="tertiary" fill="clear" size="small" @click="emitFollow">
          <ion-icon :icon="personAddOutline"></ion-icon>
          Follow
        </ion-button>
      </div>
      <div class="tags">
        <span v-for="(tag, index) in tags" :key="index" class="tag">
          #{{ tag }}
        </span>
      </div>
      <div v-if="showComments" class="comments-section">
        <div v-for="(comment, index) in comments" :key="index" class="comment">
          <p><strong>{{ comment.userId }}</strong>: {{ comment.commentText }}</p>
        </div>
        <ion-item>
          <ion-input v-model="newComment" placeholder="Add a comment..."></ion-input>
          <ion-button @click="addComment">Post</ion-button>
        </ion-item>
      </div>
    </ion-card-content>
  </ion-card>

  <!-- Modal for Enlarged Image -->
  <div v-if="isModalOpen" class="modal" @click="closeModal">
    <div class="modal-background"></div>
    <div class="modal-image-container">
      <img :src="image.src" :alt="image.alt" class="enlarged-image" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import { IonCard, IonCardContent, IonCardTitle, IonCardHeader, IonCardSubtitle, IonButton, IonIcon, IonItem, IonInput } from '@ionic/vue';
import { heart, heartOutline, chatbubbleOutline, personAddOutline, language } from 'ionicons/icons';
import { auth } from '../services/firebase';
import { getFirestore, doc, updateDoc, increment, getDoc } from 'firebase/firestore';

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
}

const props = defineProps<{ image: Image }>();
const emit = defineEmits(['like', 'comment', 'follow']);

const isLiked = ref(false);
const showComments = ref(false);
const newComment = ref('');
const likes = ref(props.image.likes);
const comments = ref([...props.image.comments]);
const translatedDescription = ref('');
const tags = ref([...props.image.tags]);
const isModalOpen = ref(false);

watch(() => props.image.likes, (newLikes) => {
  likes.value = newLikes;
});

watch(() => props.image.comments, (newComments) => {
  comments.value = [...newComments];
});

watch(() => props.image.tags, (newTags) => {
  tags.value = [...newTags];
});

const toggleLike = async () => {
  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to like images.');
    return;
  }

  try {
    console.log('Document ID:', props.image.id); // Log the document ID
    const imageDoc = doc(db, 'content', props.image.id);
    const docSnapshot = await getDoc(imageDoc);
    if (!docSnapshot.exists()) {
      console.error('Document does not exist:', props.image.id);
      throw new Error('Document does not exist');
    }

    isLiked.value = !isLiked.value;
    if (isLiked.value) {
      likes.value++;
    } else {
      likes.value--;
    }
    await updateDoc(imageDoc, { likes: increment(isLiked.value ? 1 : -1) });
    emit('like', props.image.id);
  } catch (error) {
    console.error('Error liking image:', error);
    alert('Error liking image: ' + (error as Error).message);
  }
};

const toggleComments = () => {
  showComments.value = !showComments.value;
};

const addComment = () => {
  if (newComment.value.trim()) {
    const comment = { userId: 'currentUserId', commentText: newComment.value }; // Replace 'currentUserId' with the actual user ID
    comments.value.push(comment);
    emit('comment', { imageId: props.image.id, commentText: newComment.value });
    newComment.value = '';
  }
};

const emitFollow = () => {
  emit('follow', props.image.artistId);
};

const translateDescription = async () => {
  try {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=YOUR_API_KEY`, {
      method: 'POST',
      body: JSON.stringify({
        q: props.image.description,
        target: 'en'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (data.data && data.data.translations && data.data.translations.length > 0) {
      translatedDescription.value = data.data.translations[0].translatedText;
    } else {
      console.error('Translation API response is invalid:', data);
    }
  } catch (error) {
    console.error('Error translating description:', error);
  }
};

const openModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};
</script>
<style scoped>
.image {
  cursor: pointer;
  transition: transform 0.2s;
}

.image:hover {
  transform: scale(1.05);
}

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

.modal-image-container {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.enlarged-image {
  max-width: 90%;
  max-height: 80vh;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s;
}

.modal-image-container:hover .enlarged-image {
  transform: scale(1.05);
}
</style>