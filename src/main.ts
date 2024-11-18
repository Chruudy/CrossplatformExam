import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

import { IonicVue } from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/* Theme variables */
import './theme/variables.css';

import { defineCustomElements } from '@ionic/pwa-elements/loader';
import { addIcons } from 'ionicons';
import { peopleOutline, heartOutline, personAddOutline, personRemoveOutline, personCircleOutline, logInOutline, lockClosedOutline, logoGoogle, personOutline, mailOutline } from 'ionicons/icons';

// Register the icons
addIcons({
  'people-outline': peopleOutline,
  'heart-outline': heartOutline,
  'person-add-outline': personAddOutline,
  'person-circle-outline': personCircleOutline,
  'log-in-outline': logInOutline,
  'lock-closed-outline': lockClosedOutline,
  'logo-google': logoGoogle,
  'person-outline': personOutline,
  'person-remove-outline': personRemoveOutline,
  'mail-outline': mailOutline,
});

const app = createApp(App)
  app.use(IonicVue)
  app.use(router);

router.isReady().then(() => {
  app.mount('#app');
  defineCustomElements(window);
});