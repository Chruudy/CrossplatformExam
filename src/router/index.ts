import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import NavBar from '../views/NavBar.vue';
import LoginPage from '../views/LoginPage.vue';
import RegisterPage from '../views/RegisterPage.vue';
import { auth } from '../services/firebase'; // Ensure this import is correct

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
        component: () => import('@/views/GalleryPage.vue')
      },
      {
        path: 'home',
        component: () => import('@/views/HomePage.vue')
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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = auth.currentUser;

  if (requiresAuth && !isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;