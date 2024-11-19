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
      <CommentsSection v-if="showComments" :comments="comments" :imageId="image.id" @deleteComment="deleteComment" @addComment="addComment" />
    </ion-card-content>
  </ion-card>

  <ImageModal v-if="isModalOpen" :image="image" :isModalOpen="isModalOpen" @closeModal="closeModal" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { IonCard, IonCardContent, IonCardTitle, IonCardHeader, IonCardSubtitle, IonButton, IonIcon } from '@ionic/vue';
import { heart, heartOutline, chatbubbleOutline, personAddOutline, language } from 'ionicons/icons';
import { auth } from '../services/firebase';
import { getFirestore, doc, updateDoc, increment, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import CommentsSection from './CommentsSection.vue';
import ImageModal from './ImageModal.vue';
import { translateDescription as googleTranslateDescription } from '@/services/translateDescription';

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
  lat: number;
  lng: number;
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

    if (!docSnapshot.exists()) {
      console.error('Document does not exist:', props.image.id);
      return;
    }

    const likedBy = docSnapshot.data().likedBy || [];
    const userHasLiked = likedBy.includes(user.uid);

    if (userHasLiked) {
      await updateDoc(imageDoc, {
        likes: increment(-1),
        likedBy: arrayRemove(user.uid)
      });
      likes.value--;
      isLiked.value = false;
    } else {
      await updateDoc(imageDoc, {
        likes: increment(1),
        likedBy: arrayUnion(user.uid)
      });
      likes.value++;
      isLiked.value = true;
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

const addComment = async (commentText: string) => {
  if (commentText.trim()) {
    const user = auth.currentUser;
    if (!user) {
      alert('You must be logged in to comment.');
      return;
    }

    const comment = { userId: user.uid, commentText };
    comments.value.push({ ...comment, displayName: user.displayName || 'Unknown User' });
    await updateDoc(doc(db, 'content', props.image.id), {
      comments: arrayUnion(comment)
    });
    emit('comment', { imageId: props.image.id, commentText });
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
  translatedDescription.value = await googleTranslateDescription(props.image.description);
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

.translate-button {
  display: flex;
  justify-content: center;
}

.tags {
  margin-top: 10px;
}

.tag {
  display: inline-block;
  background-color: #e0e0e0;
  border-radius: 12px;
  padding: 5px 10px;
  margin: 5px;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}
</style>