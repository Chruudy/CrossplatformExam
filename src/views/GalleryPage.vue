<template>
  <ion-page>
    <!-- Header -->
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Gallery</ion-title>
        <ion-buttons slot="end">
          <ion-button color="light" @click="openUploadModal">Upload</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- Content -->
    <ion-content :fullscreen="true">
      <div class="search-bar-container">
        <SearchBar 
          :suggestedUsers="suggestedUsers"
          v-model:searchQuery="searchQuery"
          @search="search"
          @selectUser="selectUser"
        />
      </div>

      <!-- Filters and Tags -->
      <div class="filter-tags-container">
        <ion-select placeholder="Sort By" @ionChange="applySort($event)">
          <ion-select-option value="">None</ion-select-option>
          <ion-select-option value="mostLiked">Most Liked</ion-select-option>
          <ion-select-option value="aToZ">A-Z</ion-select-option>
          <ion-select-option value="newest">Newest</ion-select-option>
          <ion-select-option value="oldest">Oldest</ion-select-option>
        </ion-select>
        <ion-select placeholder="Tags" @ionChange="applyTagFilter($event)">
          <ion-select-option value="">None</ion-select-option>
          <ion-select-option v-for="tag in availableTags" :key="tag" :value="tag">
            {{ tag }}
          </ion-select-option>
        </ion-select>
      </div>

      <!-- Image Grid -->
      <div class="image-grid">
        <ImageCard 
          v-for="image in filteredImages" 
          :key="image.id"
          :image="image"
          @comment="commentImage"
          @follow="followArtist"
        />
      </div>

      <!-- Upload Modal Component -->
      <UploadModal 
        :isOpen="isUploadModalOpen" 
        @close="closeUploadModal"
        @upload="fetchImages"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonButtons, IonSelect, IonSelectOption } from '@ionic/vue';
import { getFirestore, collection, query, where, getDocs, getDoc, updateDoc, doc, arrayUnion, limit, orderBy } from 'firebase/firestore';
import { getStorage, ref as storageRef, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import { app, auth } from '../services/firebase';
import SearchBar from '../components/SearchBar.vue';
import ImageCard from '../components/ImageCards.vue';
import UploadModal from '../components/UploadModal.vue';

const db = getFirestore(app);
const storage = getStorage(app);
const route = useRoute();

// Reactive State
const searchQuery = ref<string>(''); // Search query
const images = ref<Array<{ id: string; src: string; title: string; artistId: string; alt: string; artistName: string; description: string; likes: number; comments: Array<{ userId: string; commentText: string }>; tags: string[]; createdAt: string; exhibitionId: string }>>([]); // Images array
const isUploadModalOpen = ref(false); // Modal state
const suggestedUsers = ref<Array<{ displayName: string }>>([]);
const showSuggestions = ref(false);
const availableTags = ref<string[]>([]); // Available tags for filtering
const selectedSort = ref<string>(''); // Selected sort option
const selectedTag = ref<string>(''); // Selected tag option
const isModalOpen = ref(false);
const modalImage = ref<{ id: string; src: string; title: string; artistId: string; alt: string; artistName: string; description: string; likes: number; comments: Array<{ userId: string; commentText: string }>; tags: string[]; createdAt: string; exhibitionId: string } | null>(null);

// Fetch Images from Firebase Storage
const fetchImages = async () => {
  try {
    const imagesRef = storageRef(storage, 'images');
    const imagesList = await listAll(imagesRef);
    const imagePromises = imagesList.prefixes.map(async (folderRef) => {
      const folderList = await listAll(folderRef);
      const itemPromises = folderList.items.map(async (itemRef) => {
        const imageURL = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);
        const artistId = metadata.customMetadata?.artistId || 'Unknown';
        let artistName = 'Unknown Artist';
        if (artistId !== 'Unknown') {
          const artistDoc = await getDoc(doc(db, `users/${artistId}`));
          artistName = artistDoc.exists() ? artistDoc.data().displayName : 'Unknown Artist';
        }
        const tags = metadata.customMetadata?.tags ? metadata.customMetadata.tags.split(',').map(tag => tag.trim()) : [];
        tags.forEach(tag => {
          if (!availableTags.value.includes(tag)) {
            availableTags.value.push(tag);
          }
        });
        const docRef = await getDoc(doc(db, 'content', itemRef.name));
        const docData = docRef.data();
        return {
          id: docRef.id,
          src: imageURL,
          title: metadata.customMetadata?.title || 'Untitled',
          artistId,
          artistName,
          description: metadata.customMetadata?.description || '',
          likes: docData?.likes || 0,
          comments: docData?.comments || [],
          tags,
          alt: metadata.customMetadata?.title || 'Untitled',
          createdAt: metadata.timeCreated || new Date().toISOString(),
          exhibitionId: metadata.customMetadata?.exhibitionId || 'Unknown'
        };
      });
      return Promise.all(itemPromises);
    });
    const resolvedImagePromises = await Promise.all(imagePromises);
    images.value = resolvedImagePromises.flat();
    availableTags.value.sort(); // Sort tags alphabetically
    console.log('Fetched images:', images.value);
  } catch (error) {
    console.error('Error fetching images:', error);
  }
};

// Filtered Images based on search query, selected sort, and selected tag
const filteredImages = computed(() => {
  let sortedImages = [...images.value]; // Create a copy to avoid mutation

  if (searchQuery.value) {
    const searchTerms = searchQuery.value.toLowerCase().split(',').map(term => term.trim());
    sortedImages = sortedImages.filter(image => {
      return searchTerms.every(term => 
        image.title.toLowerCase().includes(term) ||
        image.artistName.toLowerCase().includes(term) ||
        image.description.toLowerCase().includes(term) ||
        image.tags.some(tag => tag.toLowerCase().includes(term))
      );
    });
  }

  if (selectedTag.value) {
    sortedImages = sortedImages.filter(image => image.tags.includes(selectedTag.value));
  }

  if (selectedSort.value) {
    switch (selectedSort.value) {
      case 'mostLiked':
        sortedImages.sort((a, b) => b.likes - a.likes);
        break;
      case 'aToZ':
        sortedImages.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'newest':
        sortedImages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        sortedImages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
    }
  }

  return sortedImages;
});

// Search Functionality
const search = async (searchTerm: string) => {
  searchQuery.value = searchTerm;
  if (searchTerm.startsWith('@')) {
    showSuggestions.value = true;
    const artistQuery = query(
      collection(db, 'users'),
      where('displayName', '>=', searchTerm.slice(1)),
      orderBy('displayName'),
      limit(5)
    );
    const querySnapshot = await getDocs(artistQuery);
    suggestedUsers.value = querySnapshot.docs.map(doc => doc.data() as { displayName: string });
  } else {
    showSuggestions.value = false;
  }
};

// Select User Functionality (for search suggestions)
const selectUser = (user: { displayName: string }) => {
  searchQuery.value = `@${user.displayName}`;
  showSuggestions.value = false;
  search(searchQuery.value);
};

// Open and Close Modals
const openUploadModal = () => { isUploadModalOpen.value = true; };
const closeUploadModal = () => { isUploadModalOpen.value = false; };

// Apply Sort
const applySort = (event: CustomEvent) => {
  selectedSort.value = event.detail.value;
};

// Apply Tag Filter
const applyTagFilter = (event: CustomEvent) => {
  selectedTag.value = event.detail.value;
};

// // Like Image Functionality
// const likeImage = async (imageId: string) => {
//   const user = auth.currentUser;
//   if (!user) {
//     alert('You must be logged in to like images.');
//     return;
//   }

//   const imageDoc = doc(db, 'content', imageId);
//   await updateDoc(imageDoc, { likes: increment(1) });
//   alert('Image liked!');
// };

// Comment on Image Functionality
const commentImage = async ({ imageId, commentText }: { imageId: string; commentText: string }) => {
  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to comment on images.');
    return;
  }

  const imageDoc = doc(db, 'content', imageId);
  await updateDoc(imageDoc, { comments: arrayUnion({ userId: user.uid, commentText }) });
  alert('Comment added!');
};

// Follow Artist Functionality
const followArtist = async (artistId: string) => {
  const user = auth.currentUser;
  if (!user) {
    alert('You must be logged in to follow artists.');
    return;
  }

  const userDocRef = doc(db, 'users', user.uid);
  await updateDoc(userDocRef, { following: arrayUnion(artistId) });
  alert('Artist followed!');
};

// Fetch images on component mount
onMounted(async () => {
  await fetchImages();
  const postId = route.query.postId as string;
  const openModal = route.query.openModal === 'true';
  if (postId) {
    const postElement = document.getElementById(postId);
    if (postElement) {
      postElement.scrollIntoView({ behavior: 'smooth' });
    }
    if (openModal) {
      const image = images.value.find(img => img.id === postId);
      if (image) {
        modalImage.value = image;
        isModalOpen.value = true;
      }
    }
  }
});
</script>

<style scoped>
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
}

.search-bar-container {
  padding: 16px;
}

.filter-tags-container {
  display: flex;
  justify-content: center; /* Center the dropdowns horizontally */
  align-items: center; /* Center the dropdowns vertically */
  padding: 16px;
  margin-left: 25%;
  gap: 16px;
  margin-right: 25%;
}

ion-select {
  width: 45%;
  z-index: 1000; /* Ensure the dropdown is above other elements */
}
</style>