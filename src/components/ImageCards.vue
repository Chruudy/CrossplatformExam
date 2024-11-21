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
        <ion-button color="tertiary" fill="clear" size="small" @click="toggleFollow">
          <ion-icon :icon="isFollowing ? personRemoveOutline : personAddOutline"></ion-icon>
          {{ isFollowing ? 'Unfollow' : 'Follow' }}
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
import { heart, heartOutline, chatbubbleOutline, personAddOutline, personRemoveOutline, language } from 'ionicons/icons';
import { auth } from '../services/firebase';
import { runTransaction, getFirestore, doc, updateDoc, increment, getDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
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
  address: string;
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
const isFollowing = ref(false);

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

const fetchIsLiked = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;

  const imageDoc = await getDoc(doc(db, 'content', props.image.id));
  if (!imageDoc.exists()) return false;

  const likedBy = imageDoc.data().likedBy || [];
  return likedBy.includes(user.uid);
};

const fetchIsFollowing = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) return false;

  const following = userDoc.data().following || [];
  return following.includes(props.image.artistId);
};

onMounted(async () => {
  comments.value = await fetchCommentsWithDisplayNames(props.image.comments);
  isLiked.value = await fetchIsLiked();
  isFollowing.value = await fetchIsFollowing();

  // Set up snapshot listener for likes
  const likesRef = doc(db, 'content', props.image.id);
  onSnapshot(likesRef, (doc) => {
    if (doc.exists()) {
      likes.value = doc.data().likes;
    }
  });

  // Set up snapshot listener for following
  const user = auth.currentUser;
  if (user) {
    const userDocRef = doc(db, 'users', user.uid);
    onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const following = doc.data().following || [];
        isFollowing.value = following.includes(props.image.artistId);
      }
    });
  }
});

let isProcessing = false;

const toggleLike = async () => {
  if (isProcessing) return;
  isProcessing = true;

  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to like images.');
    isProcessing = false;
    return;
  }

  try {
    const imageDoc = doc(db, 'content', props.image.id);

    await runTransaction(db, async (transaction) => {
      const docSnapshot = await transaction.get(imageDoc);

      if (!docSnapshot.exists()) {
        console.error('Document does not exist:', props.image.id);
        isProcessing = false;
        return;
      }

      const likedBy = docSnapshot.data().likedBy || [];
      const userHasLiked = likedBy.includes(user.uid);

      if (userHasLiked) {
        transaction.update(imageDoc, {
          likes: increment(-1),
          likedBy: arrayRemove(user.uid)
        });
        likes.value--;
        isLiked.value = false;
      } else {
        transaction.update(imageDoc, {
          likes: increment(1),
          likedBy: arrayUnion(user.uid)
        });
        likes.value++;
        isLiked.value = true;
      }
    });

    emit('like', props.image.id);
  } catch (error) {
    console.error('Error liking image:', error);
    alert('Error liking image: ' + (error as Error).message);
  } finally {
    isProcessing = false;
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

const toggleFollow = async () => {
  if (isProcessing) return;
  isProcessing = true;

  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to follow users.');
    isProcessing = false;
    return;
  }

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const artistDocRef = doc(db, 'users', props.image.artistId);

    if (isFollowing.value) {
      await updateDoc(userDocRef, { following: arrayRemove(props.image.artistId) });
      await updateDoc(artistDocRef, { followers: arrayRemove(user.uid) });
      isFollowing.value = false;
    } else {
      await updateDoc(userDocRef, { following: arrayUnion(props.image.artistId) });
      await updateDoc(artistDocRef, { followers: arrayUnion(user.uid) });
      isFollowing.value = true;
    }

    emit('follow', props.image.artistId);
  } catch (error) {
    console.error('Error toggling follow status:', error);
    alert('Error toggling follow status: ' + (error as Error).message);
  } finally {
    isProcessing = false;
  }
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
  width: 100%; /* Set your desired width */
  height: 200px; /* Set your desired height */
  object-fit: cover; /* Ensure the image covers the area without distortion */
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
}
</style>