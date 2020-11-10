import Vue from 'vue'
import App from './src/App'

// import font awesome icons
import { library } from '@fortawesome/fontawesome-svg-core'
import {
    faUndoAlt,
    faSyncAlt,
    faArrowUp, faArrowDown, faArrowLeft, faArrowRight,
    faBars,
    faFileExport
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
 
library.add(
    faUndoAlt, // undo button
    faSyncAlt, // toggle button
    faArrowUp, faArrowDown, faArrowLeft, faArrowRight, // arrow buttons
    faBars, // menu button
    faFileExport // file export button
)
 
// register the font awesome component so we dont need to import
Vue.component('fa-icon', FontAwesomeIcon)

// render the app
const app = new Vue({
    el: '#app',
    render: h => h(App)
})