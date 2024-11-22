<template>
  <div v-if="isModalOpen" class="modal" @click="closeModal">
    <div class="modal-background"></div>
    <div class="modal-content" @click.stop>
      <div class="artist-name">
        <router-link :to="`/page/user/${image.artistId}`">{{ image.artistName }}</router-link>
      </div>
      <img :src="image.src" :alt="image.alt" class="enlarged-image" />
      <div class="image-details">
        <h2>{{ image.title }}</h2>
        <p class="description">{{ translatedDescription || image.description }}</p>
        <div class="translate-button">
          <ion-button color="medium" fill="clear" size="small" @click="translateDescription">
            <ion-icon :icon="language"></ion-icon>
            Translate
          </ion-button>
        </div>
        <div class="tags">
          <span v-for="(tag, index) in tags" :key="index" class="tag">
            #{{ tag }}
          </span>
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
        <CommentsSection v-if="showComments" :comments="comments" :imageId="image.id" @deleteComment="deleteComment" @addComment="addComment" />
      </div>
      <div class="map-container">
        <div ref="map" class="map"></div>
        <div class="exhibition-details">
        </div>
      </div>
      <p v-if="address">{{ address }}</p>
      <p v-else class="error">Address not found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment, runTransaction, onSnapshot } from 'firebase/firestore';
import { auth } from '../services/firebase';
import { heart, heartOutline, chatbubbleOutline, personAddOutline, personRemoveOutline, language } from 'ionicons/icons';
import { IonButton, IonIcon } from '@ionic/vue';
import CommentsSection from './CommentsSection.vue';
import { loadGoogleMapsScript, initializeMap } from '../services/googleService';
import { translateDescription as googleTranslateDescription } from '@/services/translateDescription';

// Define the Image interface
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
  lat: number;
  lng: number;
  address: string;
}

// Define props and emits
const props = defineProps<{ image: Image, isModalOpen: boolean }>();
const emit = defineEmits(['closeModal']);

// State variables
const db = getFirestore();
const mapElement = ref<HTMLElement | null>(null);
const address = ref('');
const lat = ref(0);
const lng = ref(0);
const loading = ref(true);
const isLiked = ref(false);
const showComments = ref(false);
const likes = ref(props.image.likes);
const comments = ref<Array<{ userId: string; commentText: string; displayName?: string }>>([]);
const translatedDescription = ref('');
const tags = ref([...props.image.tags]);
const isFollowing = ref(false);
const isProcessing = ref(false);

// Function to close the modal
const closeModal = () => {
  emit('closeModal');
};

// Function to fetch the address, lat, and lng from Firestore
const fetchAddressAndCoordinates = async () => {
  if (!props.image) return;

  try {
    const docRef = doc(db, 'locations', props.image.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log('Fetched Document:', docSnap.data()); // Log fetched document
      address.value = docSnap.data().address || '';
      lat.value = docSnap.data().lat || 0;
      lng.value = docSnap.data().lng || 0;
      console.log('Address:', address.value); // Log address value
      console.log('Latitude:', lat.value); // Log latitude value
      console.log('Longitude:', lng.value); // Log longitude value
    } else {
      console.error('Document does not exist:', props.image.id);
    }
  } catch (error) {
    console.error('Error fetching address and coordinates:', error);
  } finally {
    loading.value = false;
  }
};

// Function to toggle like status
const toggleLike = async () => {
  if (isProcessing.value) return;
  isProcessing.value = true;

  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to like images.');
    isProcessing.value = false;
    return;
  }

  try {
    const imageDoc = doc(db, 'content', props.image.id);

    await runTransaction(db, async (transaction) => {
      const docSnapshot = await transaction.get(imageDoc);

      if (!docSnapshot.exists()) {
        console.error('Document does not exist:', props.image.id);
        isProcessing.value = false;
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
  } catch (error) {
    console.error('Error liking image:', error);
    alert('Error liking image: ' + (error as Error).message);
  } finally {
    isProcessing.value = false;
  }
};

// Function to toggle follow/unfollow status
const toggleFollow = async () => {
  if (isProcessing.value) return;
  isProcessing.value = true;

  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to follow users.');
    isProcessing.value = false;
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
  } catch (error) {
    console.error('Error toggling follow status:', error);
    alert('Error toggling follow status: ' + (error as Error).message);
  } finally {
    isProcessing.value = false;
  }
};

// Function to toggle comments section visibility
const toggleComments = () => {
  showComments.value = !showComments.value;
};

// Function to add a new comment
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
  }
};

// Function to delete a comment
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

// Function to translate the description
const translateDescription = async () => {
  translatedDescription.value = await googleTranslateDescription(props.image.description);
};

// Watch for changes in image likes, comments, and tags
watch(() => props.image.likes, (newLikes) => {
  likes.value = newLikes;
});

watch(() => props.image.comments, async (newComments) => {
  comments.value = await fetchCommentsWithDisplayNames(newComments);
});

watch(() => props.image.tags, (newTags) => {
  tags.value = [...newTags];
});

// Fetch comments with display names
const fetchCommentsWithDisplayNames = async (comments: Array<{ userId: string; commentText: string }>): Promise<Array<{ userId: string; commentText: string; displayName?: string }>> => {
  const commentsWithDisplayNames: Array<{ userId: string; commentText: string; displayName?: string }> = [];
  for (const comment of comments) {
    const userDoc = await getDoc(doc(db, 'users', comment.userId));
    const displayName = userDoc.exists() ? userDoc.data().displayName : 'Unknown User';
    commentsWithDisplayNames.push({ ...comment, displayName });
  }
  return commentsWithDisplayNames;
};

// Fetch if the current user has liked the image
const fetchIsLiked = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;

  const imageDoc = await getDoc(doc(db, 'content', props.image.id));
  if (!imageDoc.exists()) return false;

  const likedBy = imageDoc.data().likedBy || [];
  return likedBy.includes(user.uid);
};

// Fetch if the current user is following the artist
const fetchIsFollowing = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) return false;

  const following = userDoc.data().following || [];
  return following.includes(props.image.artistId);
};

// Fetch address and initialize map on modal open
watch(() => props.isModalOpen, async (isOpen) => {
  console.log('Modal Open:', isOpen); // Log modal state
  if (isOpen) {
    loading.value = true;
    await loadGoogleMapsScript();
    await fetchAddressAndCoordinates(); // Ensure this is called
    if (props.image.lat && props.image.lng) {
      await initializeMapWithCoordinates();
    }
  }
});

// Function to initialize the map with coordinates
const initializeMapWithCoordinates = async () => {
  if (!mapElement.value || !props.image) return;

  try {
    initializeMap(mapElement.value, props.image.lat, props.image.lng);
  } catch (error) {
    console.error('Error initializing map:', error);
  }
};

// On component mount, fetch likes and following status
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

// Watch for changes in address
watch(address, (newValue) => {
  console.log('Address Value:', newValue); // Log address changes
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

.artist-name {
  font-size: 16px;
  color: #1e88e5;
  margin-bottom: 10px;
}

.enlarged-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  margin-bottom: 20px;
}

.image-details {
  text-align: center;
  margin-bottom: 20px;
}

.image-details h2 {
  font-size: 24px;
  color: #333;
}

.image-details p {
  font-size: 16px;
  color: #666;
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

.artist {
  font-size: 16px;
  color: #333;
  margin-top: 10px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

.map-container {
  width: 100%;
  position: relative;
  margin-bottom: 20px;
}

.exhibition-details {
  margin-top: 10px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.exhibition-details p {
  margin: 0;
  font-size: 14px;
}

.loading-address {
  text-align: center;
  font-size: 14px;
  color: #666;
  margin-top: 10px;
}

.error {
  color: red;
}
</style>