import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import { vReveal } from './directives/reveal.js'
import './assets/styles/base.css'
import './assets/styles/main.css'

createApp(App)
  .use(router)
  .directive('reveal', vReveal)
  .mount('#app')
