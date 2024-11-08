import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import NavBar from '../views/NavBar.vue';
import LoginPage from '../views/LoginPage.vue';
import RegisterPage from '../views/RegisterPage.vue';

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
        component: () => import('@/views/ProfilePage.vue')
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;