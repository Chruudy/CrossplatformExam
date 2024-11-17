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
          <p><strong class="display-name">{{ comment.displayName }}</strong>: {{ comment.commentText }}</p>
          <ion-button v-if="comment.userId === auth.currentUser?.uid" @click="deleteComment(index)">Delete</ion-button>
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
import { ref, watch, onMounted } from 'vue';
import { IonCard, IonCardContent, IonCardTitle, IonCardHeader, IonCardSubtitle, IonButton, IonIcon, IonItem, IonInput } from '@ionic/vue';
import { heart, heartOutline, chatbubbleOutline, personAddOutline, language } from 'ionicons/icons';
import { auth } from '../services/firebase';
import { getFirestore, doc, updateDoc, increment, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

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

interface Comment {
  userId: string;
  commentText: string;
  displayName?: string;
}

const props = defineProps<{ image: Image }>();
const emit = defineEmits(['like', 'comment', 'follow']);

const isLiked = ref(false);
const showComments = ref(false);
const newComment = ref('');
const likes = ref(props.image.likes);
const comments = ref<Comment[]>([]);
const translatedDescription = ref('');
const tags = ref([...props.image.tags]);
const isModalOpen = ref(false);

watch(() => props.image.likes, (newLikes) => {
  likes.value = newLikes;
});

watch(() => props.image.comments, async (newComments) => {
  comments.value = await fetchCommentsWithDisplayNames(newComments);
});

watch(() => props.image.tags, (newTags) => {
  tags.value = [...newTags];
});

const fetchCommentsWithDisplayNames = async (comments: Array<{ userId: string; commentText: string }>): Promise<Comment[]> => {
  const commentsWithDisplayNames: Comment[] = [];
  for (const comment of comments) {
    const userDoc = await getDoc(doc(db, 'users', comment.userId));
    const displayName = userDoc.exists() ? userDoc.data().displayName : 'Unknown User';
    commentsWithDisplayNames.push({ ...comment, displayName });
  }
  return commentsWithDisplayNames;
};

onMounted(async () => {
  comments.value = await fetchCommentsWithDisplayNames(props.image.comments);
});

const toggleLike = async () => {
  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to like images.');
    return;
  }

  try {
    const imageDoc = doc(db, 'content', props.image.id);
    const docSnapshot = await getDoc(imageDoc);

    // Check if the document exists
    if (!docSnapshot.exists()) {
      console.error('Document does not exist:', props.image.id);
      return;
    }

    // Document exists, proceed with like/unlike logic
    const likedBy = docSnapshot.data().likedBy || [];
    const userHasLiked = likedBy.includes(user.uid);

    // Toggle like/unlike based on whether the user has already liked it
    if (userHasLiked) {
      // User has already liked, so we are unliking
      await updateDoc(imageDoc, {
        likes: increment(-1),
        likedBy: arrayRemove(user.uid)
      });
      likes.value--;
      isLiked.value = false; // Set to false after unliking
    } else {
      // User hasn't liked yet, so we are liking
      await updateDoc(imageDoc, {
        likes: increment(1),
        likedBy: arrayUnion(user.uid)
      });
      likes.value++;
      isLiked.value = true; // Set to true after liking
    }

    emit('like', props.image.id);
  } catch (error) {
    console.error('Error liking image:', error);
    alert('Error liking image: ' + (error as Error).message);
  }
};

const toggleComments = () => {
  showComments.value = !showComments.value;
};

const addComment = async () => {
  if (newComment.value.trim()) {
    const user = auth.currentUser;
    if (!user) {
      alert('You must be logged in to comment.');
      return;
    }

    const comment = { userId: user.uid, commentText: newComment.value };
    comments.value.push({ ...comment, displayName: user.displayName || 'Unknown User' });
    await updateDoc(doc(db, 'content', props.image.id), {
      comments: arrayUnion(comment)
    });
    emit('comment', { imageId: props.image.id, commentText: newComment.value });
    newComment.value = '';
  }
};

const deleteComment = async (index: number) => {
  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to delete comments.');
    return;
  }

  const comment = comments.value[index];
  if (comment.userId !== user.uid) {
    alert('You can only delete your own comments.');
    return;
  }

  comments.value.splice(index, 1);
  await updateDoc(doc(db, 'content', props.image.id), {
    comments: comments.value
  });
};

const emitFollow = () => {
  emit('follow', props.image.artistId);
};

const translateDescription = async () => {
  try {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=AIzaSyABoN3EsB_jyScms9laVjpwoUeFre5jmhU`, {
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

.display-name {
  color: var(--ion-color-tertiary);
}
</style>