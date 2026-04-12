// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyDbW4HmzwMARnqL2qDS44AvEYYv9_-k06k",
  authDomain: "sehirbul.firebaseapp.com",
  projectId: "sehirbul",
  storageBucket: "sehirbul.firebasestorage.app",
  messagingSenderId: "25962377570",
  appId: "1:25962377570:web:e1c1d38670ae64fabc3c3b"
};

try {
  firebase.initializeApp(firebaseConfig);
} catch(e) { console.warn('Firebase init error:', e); }

const db   = (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) ? firebase.firestore() : null;
const auth = (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) ? firebase.auth() : null;

// ===== SABITLER =====
const TOTAL_LEVELS = 10;
const MP_QUESTION_COUNT = 12;
const TIMER_TOTAL = 17, TIMER_GRACE = 5;
const COMBO_MULT = [1.0, 1.05, 1.10, 1.20];
const AD_LIMITS = { interstitial: 5, rewarded: 5 };
const MAP_CACHE_DB  = 'geoblitz-maps';
const MAP_CACHE_VER = 2;
const WORLD_URL  = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const EUROPE_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';

const FLAG_Q_COUNT    = 15;
const FLAG_SOLO_COUNT = 15;
const FLAG_MAX_SCORE  = 1000;
const FLAG_FULL_TIME  = 12;
const FLAG_FULL_SECS  = 7;
const FLAG_STEP       = 60;

const FLAG_LEVELS = [
  { level:1, questions:3,  target:1000 },
  { level:2, questions:4,  target:2000 },
  { level:3, questions:5,  target:2800 },
  { level:4, questions:6,  target:4000 },
  { level:5, questions:8,  target:6500 },
];

const LEVEL_CONFIG_WORLD = [
  {questions:3, target:873},{questions:4, target:1358},{questions:5, target:1885},
  {questions:6, target:2509},{questions:7, target:3250},{questions:8, target:4123},
  {questions:8, target:4760},{questions:8, target:5283},{questions:8, target:5865},{questions:8, target:6360},
];
const LEVEL_CONFIG_TURKEY = [
  {questions:3, target:890},{questions:4, target:1385},{questions:5, target:1923},
  {questions:6, target:2559},{questions:7, target:3315},{questions:8, target:4205},
  {questions:8, target:4855},{questions:8, target:5389},{questions:8, target:5982},{questions:8, target:6360},
];
const LEVEL_CONFIG_LANDMARK = [
  {questions:3, target:800},{questions:4, target:1200},{questions:5, target:1700},
  {questions:6, target:2300},{questions:7, target:3000},{questions:8, target:3900},
  {questions:8, target:4500},{questions:8, target:5000},{questions:8, target:5500},{questions:8, target:6000},
];

function getLevelConfig(l) {
  return (gameMode==='turkey' ? LEVEL_CONFIG_TURKEY : gameMode==='landmark' ? LEVEL_CONFIG_LANDMARK : LEVEL_CONFIG_WORLD)[l-1];
}
