import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import NavBar from '../views/NavBar.vue';
import LoginPage from '../views/LoginPage.vue';
import RegisterPage from '../views/RegisterPage.vue';
import { auth } from '../services/firebase';

// Define the routes for the application
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: LoginPage
  },
  {
    path: '/register',
    component: RegisterPage
  },
  {
    path: '/page/',
    component: NavBar,
    children: [
      {
        path: '',
        redirect: '/page/home'
      },
      {
        path: 'gallery',
        component: () => import('@/views/GalleryPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'home',
        component: () => import('@/views/HomePage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'profile',
        component: () => import('@/views/ProfilePage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'user/:userId',
        component: () => import('@/views/PublicProfilePage.vue'),
        meta: { requiresAuth: true }
      }
    ]
  }
];

// Create the router instance
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Navigation guard to check for authentication
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = auth.currentUser;

  if (requiresAuth && !isAuthenticated) {
    next('/'); // Redirect to login page if not authenticated
  } else {
    next(); // Proceed to the route
  }
});

export default router;