// ===== AUTH SİSTEMİ =====
window.onerror = function(msg, src, line, col, err) {
  console.error('GeoBlitz Error:', msg, 'at', src, line);
  return false; // hatayı yutma, console'da göster ama loading-error'a yazma
};
window.addEventListener('unhandledrejection', function(e) {
  console.error('Unhandled promise rejection:', e.reason);
});



// Firebase Auth state — sayfa yüklenince aktif oturumu kontrol et
let _loggingOut = false; // logout sırasında listener'ı engelle
if (auth) {
  auth.onAuthStateChanged(async (fireUser) => {
    if (_loggingOut) return; // logout sırasında tetiklenmesin
    if (fireUser && !currentUser) {
      try {
        const mapSnap = await db.collection('uid_to_username').doc(fireUser.uid).get();
        if (mapSnap.exists) {
          const key = mapSnap.data().key;
          const userSnap = await db.collection('users').doc(key).get();
          if (userSnap.exists) {
            currentUser = userSnap.data();
            const authModal = document.getElementById('auth-modal');
            if (authModal && !authModal.classList.contains('hidden')) {
              onAuthSuccess();
            }
          }
        }
    }
  });
}

// ===== İNGİLİZCE ÇEVİRİ =====

let currentUser = null;

function hashPassword(pass) {
  let hash = 0;
  for (let i = 0; i < pass.length; i++) {
    const char = pass.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t,i) => {
    t.classList.toggle('active', (i===0 && tab==='login') || (i===1 && tab==='register'));
  });
  document.getElementById('auth-error').textContent = '';
  document.getElementById('auth-modal').dataset.tab = tab;
  const identifierInp = document.getElementById('auth-identifier');
  const emailInp      = document.getElementById('auth-email');
  if (tab === 'register') {
    // Kayıt: e-posta ayrı + identifier kullanıcı adı için gizle
    if (identifierInp) { identifierInp.style.display = 'none'; identifierInp.value = ''; }
    if (emailInp)      { emailInp.style.display = 'block'; }
  } else {
    // Giriş: sadece identifier (e-posta veya kullanıcı adı)
    if (identifierInp) { identifierInp.style.display = 'block'; }
    if (emailInp)      { emailInp.style.display = 'none'; emailInp.value = ''; }
  }
}

// ══════════════════════════════════════════════════════════
// AUTH SİSTEMİ — Firebase Authentication
// ══════════════════════════════════════════════════════════

function showAuthMain() {
  document.getElementById('auth-screen-main').style.display = 'block';
  document.getElementById('auth-screen-username').style.display = 'none';
  document.getElementById('auth-screen-forgot').style.display = 'none';
}
function showForgotPassword() {
  document.getElementById('auth-screen-main').style.display = 'none';
  document.getElementById('auth-screen-forgot').style.display = 'block';
  const identVal = document.getElementById('auth-identifier');
  const emailVal = document.getElementById('auth-email');
  const val = (identVal && identVal.value.includes('@')) ? identVal.value : (emailVal ? emailVal.value : '');
  if (val) document.getElementById('auth-forgot-email').value = val;
  document.getElementById('auth-forgot-error').textContent = '';
}

async function authSendReset() {
  const email = document.getElementById('auth-forgot-email').value.trim();
  const errEl = document.getElementById('auth-forgot-error');
  const btn   = document.getElementById('auth-forgot-btn');
  if (!email) { errEl.textContent = 'E-posta girin'; return; }
  btn.disabled = true;
  try {
    await auth.sendPasswordResetEmail(email);
    errEl.style.color = 'var(--green)';
    errEl.textContent = 'Şifre sıfırlama e-postası gönderildi!';
    setTimeout(() => { errEl.style.color = ''; showAuthMain(); }, 2500);
  } catch(e) {
    errEl.style.color = '';
    errEl.textContent = e.code === 'auth/user-not-found' ? 'Bu e-posta ile kayıtlı kullanıcı yok.'
      : e.code === 'auth/invalid-email' ? 'Geçersiz e-posta.'
      : 'Hata: ' + e.message;
  }
  btn.disabled = false;
}

let _authSubmitting = false;
let _authSubmitTimeout = null;
function _clearAuthSubmit() {
  _authSubmitting = false;
  if (_authSubmitTimeout) { clearTimeout(_authSubmitTimeout); _authSubmitTimeout = null; }
}
async function authSubmit() {
  if (_authSubmitting) return;
  _authSubmitting = true;
  // Safety: release the lock after 15s no matter what (network timeout etc.)
  _authSubmitTimeout = setTimeout(_clearAuthSubmit, 15000);
  const tab      = document.getElementById('auth-modal').dataset.tab || 'login';
  const rawPassword = (document.getElementById('auth-password').value || '');
  const password = rawPassword.length < 6 ? rawPassword + ('_gb_' + rawPassword).slice(0, 6 - rawPassword.length) : rawPassword;
  const errEl    = document.getElementById('auth-error');
  const btn      = document.getElementById('auth-submit-btn');
  const btnOrigText = btn.textContent;

  errEl.textContent = '';
  if (!rawPassword) { errEl.textContent = lang==='en'?'Enter password':'Şifre girin'; _clearAuthSubmit(); return; }

  btn.disabled = true; btn.style.opacity = '0.6'; btn.textContent = lang==='en' ? 'Please wait...' : 'Lütfen bekle...';

  const _resetBtn = () => { btn.disabled = false; btn.style.opacity = ''; btn.textContent = t('submit'); _clearAuthSubmit(); };

  try {
    let fireUser;
    if (tab === 'register') {
      // Kayıt: e-posta zorunlu
      const email = (document.getElementById('auth-email').value || '').trim();
      if (!email) { errEl.textContent = lang==='en'?'Enter email':'E-posta girin'; _resetBtn(); return; }
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      fireUser = cred.user;
      _resetBtn();
      document.getElementById('auth-screen-main').style.display = 'none';
      document.getElementById('auth-screen-username').style.display = 'block';
      document.getElementById('auth-username-input').focus();
      window._pendingFireUser = fireUser;
      return;
    } else {
      // Giriş: e-posta veya kullanıcı adı
      const identifier = (document.getElementById('auth-identifier').value || '').trim();
      if (!identifier) { errEl.textContent = lang==='en'?'Enter email or username':'E-posta veya kullanıcı adı girin'; _resetBtn(); return; }
      const isEmail = identifier.includes('@');
      let loginEmail = identifier;
      if (!isEmail) {
        // Kullanıcı adıyla giriş — Firestore'dan e-postayı bul
        const key = identifier.toLowerCase();
        const userSnap = await db.collection('users').doc(key).get();
        if (!userSnap.exists) {
          errEl.textContent = lang==='en'?'User not found.':'Kullanıcı bulunamadı.';
          _resetBtn(); return;
        }
        loginEmail = userSnap.data().email;
        if (!loginEmail) {
          errEl.textContent = lang==='en'?'No email on file. Try logging in with email.':'Bu hesabın e-postası bulunamadı. E-posta ile giriş dene.';
          _resetBtn(); return;
        }
      }
      const cred = await auth.signInWithEmailAndPassword(loginEmail, password);
      fireUser = cred.user;
    }
    await _loadUserFromFirestore(fireUser.uid, '');
    _resetBtn();
  } catch(e) {
    _resetBtn();
    errEl.textContent =
      e.code === 'auth/user-not-found'        ? (lang==='en'?'User not found.':'Kullanıcı bulunamadı.') :
      e.code === 'auth/wrong-password'         ? (lang==='en'?'Wrong password.':'Yanlış şifre.') :
      e.code === 'auth/invalid-credential'     ? (lang==='en'?'Wrong credentials.':'Giriş bilgileri hatalı.') :
      e.code === 'auth/email-already-in-use'   ? (lang==='en'?'Email already registered.':'Bu e-posta zaten kayıtlı.') :
      e.code === 'auth/invalid-email'          ? (lang==='en'?'Invalid email.':'Geçersiz e-posta.') :
      e.code === 'auth/network-request-failed' ? '📶 İnternet bağlantısı yok.' :
      'Hata: ' + (e.message || e.code);
  }
}

async function authSetUsername() {
  const username = (document.getElementById('auth-username-input').value || '').trim();
  const errEl = document.getElementById('auth-username-error');
  const btn   = document.getElementById('auth-username-btn');
  if (!username || username.length < 2) { errEl.textContent = 'Kullanıcı adı en az 2 karakter olmalı'; return; }
  if (username.length > 20) { errEl.textContent = 'Kullanıcı adı en fazla 20 karakter olabilir'; return; }
  if (!/^[a-zA-Z0-9_À-ɏ]+$/.test(username)) { errEl.textContent = 'Sadece harf, rakam ve _ kullanılabilir'; return; }
  btn.disabled = true; btn.style.opacity = '0.6';
  // Kullanıcı adı benzersiz mi?
  const key = username.toLowerCase();
  try {
    const snap = await db.collection('users').doc(key).get();
    if (snap.exists) { errEl.textContent = 'Bu kullanıcı adı alınmış, başka birini dene'; btn.disabled=false; btn.style.opacity=''; return; }
    const fireUser = window._pendingFireUser || auth.currentUser;
    const userData = { username, uid: fireUser.uid, email: fireUser.email||'', bestScore: 0, bestLevel: 0, gamesPlayed: 0, bestScoreTurkey:0, bestScoreLandmark:0, bestScoreFlag:0, created: Date.now() };
    await db.collection('users').doc(key).set(userData);
    await db.collection('uid_to_username').doc(fireUser.uid).set({ username, key });
    window._pendingFireUser = null;
    currentUser = userData;
    errEl.textContent = '';
    btn.disabled = false; btn.style.opacity = '';
    onAuthSuccess();
  } catch(e) {
    errEl.textContent = 'Hata: ' + e.message;
    btn.disabled = false; btn.style.opacity = '';
  }
}

async function _loadUserFromFirestore(uid, email) {
  // uid → username map
  const mapSnap = await db.collection('uid_to_username').doc(uid).get();
  if (mapSnap.exists) {
    const { key } = mapSnap.data();
    const userSnap = await db.collection('users').doc(key).get();
    if (userSnap.exists) {
      currentUser = userSnap.data();
      onAuthSuccess();
      return;
    }
  }
  // uid_to_username yok → kullanıcı adı ekranına git (eski hesap migrasyonu)
  window._pendingFireUser = auth.currentUser;
  document.getElementById('auth-screen-main').style.display = 'none';
  document.getElementById('auth-screen-username').style.display = 'block';
  document.getElementById('auth-username-input').focus();
}

function mpWatchSession(userRef, mySessionId) {
  // Session izleme devre dışı
}

function authGuest() {
  currentUser = null;
  onAuthSuccess();
}

function authLogout() {
  // ÖNCE watcher'ı durdur, sonra Firebase'e yaz (yoksa kendi silme işlemimizi "başka cihaz" sanır)
  if (window._sessionHeartbeat) { clearInterval(window._sessionHeartbeat); window._sessionHeartbeat = null; }
  if (window._sessionWatcher) { window._sessionWatcher(); window._sessionWatcher = null; }
  // Firestore'daki sessionId'yi temizle
  if (window._mySessionRef && window._mySessionId) {
    const refToClean = window._mySessionRef;
    const idToClean = window._mySessionId;
    refToClean.get().then(snap => {
      if (snap.exists && snap.data().sessionId === idToClean) {
        refToClean.update({ sessionId: '', sessionAt: 0 }).catch(() => {});
      }
    }).catch(() => {});
  }
  window._mySessionId = null;
  window._mySessionRef = null;
  currentUser = null;
  gameMode = 'world';
  _loggingOut = true;
  if (auth) auth.signOut().catch(()=>{}).finally(() => { setTimeout(() => { _loggingOut = false; }, 1000); });
  const savedLang = lang;
  document.getElementById('welcome-modal').style.display = 'none';
  document.getElementById('overlay').classList.add('hidden');
  document.getElementById('lb-modal').classList.add('hidden');
  document.getElementById('auth-modal').dataset.tab = 'login';
  document.getElementById('auth-email').value = '';
  document.getElementById('auth-password').value = '';
  document.getElementById('auth-error').textContent = '';
  document.getElementById('auth-modal').classList.remove('hidden');
  stopTimer();
  setLang(savedLang);
}

// ===== KEYBIND SİSTEMİ =====
const DEFAULT_BINDS = { mark:'Space', next:'Enter', zoomin:'Equal', zoomout:'Minus', zoomreset:'KeyR' };
let keybinds = Object.assign({}, DEFAULT_BINDS);
let rebindTarget = null;

function loadKeybinds() {
  try {
    const saved = localStorage.getItem('geoblitz_keybinds');
    if (saved) keybinds = Object.assign({}, DEFAULT_BINDS, JSON.parse(saved));
  } catch(e) {}
  applyKeybindUI();
}

function saveKeybinds() {
  try { localStorage.setItem('geoblitz_keybinds', JSON.stringify(keybinds)); } catch(e) {}
}

function applyKeybindUI() {
  Object.keys(keybinds).forEach(action => {
    const btn = document.getElementById('keybind-' + action);
    if (btn) btn.textContent = formatKey(keybinds[action]);
  });
}

function formatKey(code) {
  const map = { Space:'SPACE', Enter:'ENTER', Equal:'+', Minus:'-', KeyR:'R',
    ArrowUp:'↑', ArrowDown:'↓', ArrowLeft:'←', ArrowRight:'→' };
  if (map[code]) return map[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code;
}

function startRebind(btn) {
  if (rebindTarget) {
    rebindTarget.classList.remove('listening');
  }
  rebindTarget = btn;
  btn.classList.add('listening');
  btn.textContent = '...';
}

function resetKeybinds() {
  keybinds = Object.assign({}, DEFAULT_BINDS);
  saveKeybinds();
  applyKeybindUI();
}

document.addEventListener('keydown', function(e) {
  if (rebindTarget) {
    e.preventDefault();
    const action = rebindTarget.dataset.action;
    keybinds[action] = e.code;
    saveKeybinds();
    applyKeybindUI();
    rebindTarget.classList.remove('listening');
    rebindTarget = null;
    return;
  }
  // Normal keybind actions (sadece oyun sırasında)
  const activeTag = document.activeElement && document.activeElement.tagName;
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
  if (document.getElementById('auth-modal') && !document.getElementById('auth-modal').classList.contains('hidden')) return;
  if (document.getElementById('welcome-modal') && document.getElementById('welcome-modal').style.display === 'flex') return;
  if (document.getElementById('main-menu-modal') && document.getElementById('main-menu-modal').style.display === 'flex') return;
  if (document.getElementById('mp-modal') && document.getElementById('mp-modal').classList.contains('open')) return;
  if (e.code === keybinds.next) { e.preventDefault(); const nb = document.getElementById('next-btn'); if (nb && nb.style.display !== 'none') nb.click(); }
  if (e.code === keybinds.zoomin) { e.preventDefault(); document.getElementById('btn-zoom-in') && document.getElementById('btn-zoom-in').click(); }
  if (e.code === keybinds.zoomout) { e.preventDefault(); document.getElementById('btn-zoom-out') && document.getElementById('btn-zoom-out').click(); }
  if (e.code === keybinds.zoomreset) { e.preventDefault(); document.getElementById('btn-zoom-r') && document.getElementById('btn-zoom-r').click(); }
});

// opt-reset-btn onclick
document.addEventListener('DOMContentLoaded', function() {
  const resetBtn = document.getElementById('opt-reset-btn');
  if (resetBtn) resetBtn.onclick = function() { resetKeybinds(); };
  const closeBtn = document.getElementById('opt-close-btn');
  if (closeBtn) closeBtn.onclick = function() { closeOptions(); };

  // ── iOS MOBILE LOGIN FIX ──────────────────────────────────────────────────
  // Problem: on iOS, onclick inside a scrollable modal can be unreliable.
  // We wire everything through touchend (with preventDefault to stop the
  // synthetic click) + a click fallback for desktop/Android.
  // The _authSubmitting guard prevents double-calls.

  function _bindAuthBtn(id, fn) {
    const el = document.getElementById(id);
    if (!el) return;
    let _touched = false;
    // touchstart: mark that we had a real finger press
    el.addEventListener('touchstart', function(e) {
      _touched = true;
      this.style.opacity = '0.75';
    }, { passive: true });
    // touchend: fire immediately, block the synthetic click
    el.addEventListener('touchend', function(e) {
      e.preventDefault(); // stops synthetic click
      this.style.opacity = '';
      if (_touched) { _touched = false; fn(); }
    }, { passive: false });
    el.addEventListener('touchcancel', function() {
      _touched = false;
      this.style.opacity = '';
    }, { passive: true });
    // click: fires on desktop & Android where touchend preventDefault still works
    el.addEventListener('click', function() {
      if (_touched) return; // already handled by touchend
      fn();
    });
  }

  _bindAuthBtn('auth-submit-btn', authSubmit);
  _bindAuthBtn('auth-username-btn', authSetUsername);
  _bindAuthBtn('auth-forgot-btn', authSendReset);

  // Input focus helpers — also keep addTouchFix for legacy use
  function addTouchFix(id, fn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchend', function(e) {
      e.preventDefault();
      e.stopPropagation();
      fn();
    }, { passive: false });
  }
  addTouchFix('auth-identifier', function() { document.getElementById('auth-identifier').focus(); });
  addTouchFix('auth-email', function() { document.getElementById('auth-email').focus(); });
  addTouchFix('auth-password', function() { document.getElementById('auth-password').focus(); });

  // Guest link
  const guestLink = document.querySelector('#auth-guest-line a');
  if (guestLink) {
    let _guestTouched = false;
    guestLink.addEventListener('touchstart', function() { _guestTouched = true; }, { passive: true });
    guestLink.addEventListener('touchend', function(e) {
      e.preventDefault();
      if (_guestTouched) { _guestTouched = false; authGuest(); }
    }, { passive: false });
    guestLink.addEventListener('click', function() {
      if (!_guestTouched) authGuest();
    });
  }

  // Auth tab buttons
  const tabLogin = document.getElementById('auth-tab-login');
  const tabReg   = document.getElementById('auth-tab-register');
  if (tabLogin) { let t=false; tabLogin.addEventListener('touchstart',()=>t=true,{passive:true}); tabLogin.addEventListener('touchend',function(e){e.preventDefault();if(t){t=false;switchAuthTab('login');}},{passive:false}); tabLogin.addEventListener('click',function(){if(!t)switchAuthTab('login');}); }
  if (tabReg)   { let t=false; tabReg.addEventListener('touchstart',()=>t=true,{passive:true}); tabReg.addEventListener('touchend',function(e){e.preventDefault();if(t){t=false;switchAuthTab('register');}},{passive:false}); tabReg.addEventListener('click',function(){if(!t)switchAuthTab('register');}); }

  // Language buttons in auth modal
  const alTr = document.getElementById('auth-lang-tr');
  const alEn = document.getElementById('auth-lang-en');
  if (alTr) { let t=false; alTr.addEventListener('touchstart',()=>t=true,{passive:true}); alTr.addEventListener('touchend',function(e){e.preventDefault();if(t){t=false;setLang('tr');}},{passive:false}); alTr.addEventListener('click',function(){if(!t)setLang('tr');}); }
  if (alEn) { let t=false; alEn.addEventListener('touchstart',()=>t=true,{passive:true}); alEn.addEventListener('touchend',function(e){e.preventDefault();if(t){t=false;setLang('en');}},{passive:false}); alEn.addEventListener('click',function(){if(!t)setLang('en');}); }

  // Forgot password link
  const forgotLink = document.getElementById('auth-forgot-link');
  if (forgotLink) { let t=false; forgotLink.addEventListener('touchstart',()=>t=true,{passive:true}); forgotLink.addEventListener('touchend',function(e){e.preventDefault();if(t){t=false;showForgotPassword();}},{passive:false}); forgotLink.addEventListener('click',function(){if(!t)showForgotPassword();}); }
  const backLink = document.getElementById('auth-back-link');
  if (backLink) { let t=false; backLink.addEventListener('touchstart',()=>t=true,{passive:true}); backLink.addEventListener('touchend',function(e){e.preventDefault();if(t){t=false;showAuthMain();}},{passive:false}); backLink.addEventListener('click',function(){if(!t)showAuthMain();}); }
  // ── END iOS MOBILE LOGIN FIX ──────────────────────────────────────────────
});

function onAuthSuccess() {
  document.getElementById('auth-modal').classList.add('hidden');
  // Harita verilerini arka planda cache'e al
  if (typeof prefetchMapData === 'function') prefetchMapData();
  // Haritayı başlat (daha önce yapılmadıysa)
  if (!markersG) initMap();
  // Welcome modal'ı göster
  const wm = document.getElementById('welcome-modal');
  wm.style.display = 'flex';
  wm.style.visibility = 'visible';
  wm.style.pointerEvents = 'auto';
  wm.style.zIndex = '450';
  const nameEl = document.getElementById('welcome-username');
  const userText = document.getElementById('welcome-user-text');
  if (currentUser) {
    nameEl.textContent = currentUser.username;
    userText.innerHTML = t('welcome') + ' <span id="welcome-username">' + currentUser.username + '</span>!';
  } else {
    userText.textContent = t('guest');
  }
  applyLang();
  updateUserUI();
  loadKeybinds();
}

function goToWelcome() {
  // Her yerden ana ekrana dön — tüm ekranları/overlay'leri kapat
  if (typeof stopTimer === 'function') stopTimer();
  if (typeof hideFlagScreen === 'function') hideFlagScreen();
  // MP oyunundaysa lobi'yi temizle (host ise sil, guest ise çık)
  if (typeof mpGameActive !== 'undefined' && mpGameActive && mpLobbyId) {
    mpLeaveLobby(); return; // mpLeaveLobby zaten goToWelcome'a yönlendirir
  }

  const ids = ['overlay','main-menu-modal','flag-between-overlay'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('hidden');
    el.style.display = 'none';
  });
  const lpo = document.getElementById('landmark-photo-overlay');
  if (lpo) lpo.classList.remove('show');
  const toast = document.getElementById('result-toast');
  if (toast) { toast.classList.remove('show'); toast.style.display = 'none'; }
  const mpo = document.getElementById('mp-between-overlay');
  if (mpo) mpo.classList.remove('show');

  // Haritayı temizle
  if (typeof clearMarkers === 'function') clearMarkers();

  // Welcome modal'ı göster
  const wm = document.getElementById('welcome-modal');
  if (wm) {
    wm.style.display = 'flex';
    wm.style.visibility = 'visible';
    wm.style.pointerEvents = 'auto';
    wm.style.zIndex = '450';
  }
}

function startGame() {
  const wm = document.getElementById('welcome-modal');
  wm.style.display = 'none';
  wm.style.visibility = 'hidden';
  wm.style.pointerEvents = 'none';
  wm.style.zIndex = '-1';
  document.getElementById('overlay').classList.add('hidden');
  document.getElementById('main-menu-modal').style.display = 'none';
  state.level = 1; state.totalScore = 0;
  resetAdGameFlag();
  // Önceki oyundan kalma toast'u temizle
  const toast = document.getElementById('result-toast');
  if (toast) { toast.classList.remove('show'); toast.style.display = 'none'; toast.style.bottom = ''; }
  startLevel();
}

function welcomeStart(mode) {
  gameMode = mode || 'world';
  startGame();
}

function updateUserUI() {
  // Premium rozet
  const existingBadge = document.getElementById('premium-badge');
  if (isPremium()) {
    if (!existingBadge) {
      const badge = document.createElement('span');
      badge.id = 'premium-badge';
      badge.title = 'Premium Üye';
      badge.style.cssText = 'font-size:.75rem;background:linear-gradient(135deg,#e05c2a,#f0a500);color:#000;padding:2px 7px;border-radius:10px;font-family:Lato,sans-serif;font-weight:700;letter-spacing:1px;margin-left:4px;';
      badge.textContent = '⭐ PRO';
      const nameEl2 = document.getElementById('user-name-display');
      if (nameEl2) nameEl2.after(badge);
    }
  } else {
    if (existingBadge) existingBadge.remove();
  }
  const avatarEl = document.getElementById('user-avatar');
  const nameEl = document.getElementById('user-name-display');
  if (currentUser) {
    avatarEl.textContent = currentUser.username[0].toUpperCase();
    nameEl.textContent = currentUser.username;
  } else {
    avatarEl.textContent = '?';
    nameEl.textContent = lang === 'en' ? 'Guest' : 'Misafir';
  }
}

function dbReady() { return db !== null; }

// ===== PREMIUM & REKLAM SİSTEMİ =====

function isPremium() {
  return !!(currentUser && currentUser.premium === true);
}

// --- Reklam limitleri (günlük) ---
// Normal (interstitial): günde max 5, her 3 oyun sonunda 1
// Ödüllü (rewarded): günde max 5, oyun başına max 1
const AD_LIMITS = { interstitial: 5, rewarded: 5 };

function getAdStorage() {
  const today = new Date().toDateString();
  try {
    const raw = localStorage.getItem('geoblitz_ads');
    const data = raw ? JSON.parse(raw) : {};
    if (data.date !== today) return { date: today, interstitial: 0, rewarded: 0, rewardedThisGame: false };
    return data;
  } catch(e) { return { date: today, interstitial: 0, rewarded: 0, rewardedThisGame: false }; }
}

function saveAdStorage(data) {
  try { localStorage.setItem('geoblitz_ads', JSON.stringify(data)); } catch(e) {}
}

function canShowAd(type) {
  if (isPremium()) return false;
  const data = getAdStorage();
  if (type === 'rewarded') return data.rewarded < AD_LIMITS.rewarded && !data.rewardedThisGame;
  return data[type] < AD_LIMITS[type];
}

function recordAd(type) {
  const data = getAdStorage();
  data[type] = (data[type] || 0) + 1;
  if (type === 'rewarded') data.rewardedThisGame = true;
  saveAdStorage(data);
}

// Yeni oyun başlayınca rewardedThisGame sıfırla
function resetAdGameFlag() {
  const data = getAdStorage();
  data.rewardedThisGame = false;
  saveAdStorage(data);
}

// Her 3 oyun SONUNDA 1 normal reklam
let _gamesPlayedSinceAd = 0;
function maybeShowInterstitialAfterGame(onDone) {
  if (isPremium()) { onDone(); return; }
  _gamesPlayedSinceAd++;
  if (_gamesPlayedSinceAd >= 3 && canShowAd('interstitial')) {
    _gamesPlayedSinceAd = 0;
    recordAd('interstitial');
    showAdBanner('interstitial', onDone);
  } else {
    onDone();
  }
}

// Başarısızlık sonrası ödüllü reklam teklifi
function offerRewardedAd(onRewarded, onSkip) {
  const canShow = canShowAd('rewarded');
  if (!canShow) {
    setTimeout(onSkip, 0);
    return;
  }
  showAdBanner('rewarded', onRewarded, onSkip);
}

// Reklam UI göster
function showAdBanner(type, onDone, onSkip) {
  const existing = document.getElementById('ad-overlay');
  if (existing) existing.remove();

  const div = document.createElement('div');
  div.id = 'ad-overlay';
  div.style.cssText = 'position:fixed;inset:0;background:rgba(10,14,26,.97);z-index:800;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;';

  if (type === 'interstitial') {
    div.innerHTML = `
      <div style="background:#111827;border:1px solid #1e2d45;border-radius:16px;padding:32px 40px;text-align:center;max-width:380px;width:92%;">
        <div style="font-size:.7rem;color:#5a6a80;letter-spacing:2px;margin-bottom:8px;">REKLAM</div>
        <div style="background:#1e2d45;border-radius:8px;height:200px;display:flex;align-items:center;justify-content:center;color:#5a6a80;font-size:.85rem;margin-bottom:16px;">
          📢 Reklam Alanı<br><small style="font-size:.7rem;">(AdMob entegrasyonu)</small>
        </div>
        <button type="button" id="ad-skip-btn"
          style="background:transparent;color:#5a6a80;border:1px solid #1e2d45;border-radius:8px;padding:10px 24px;font-size:.85rem;cursor:pointer;width:100%;" disabled>
          5 saniye bekle...
        </button>
        <button type="button" id="ad-premium-btn" style="background:transparent;color:#f0a500;border:none;font-size:.78rem;cursor:pointer;margin-top:8px;padding:4px;">
          ⭐ Reklamları kaldır — ₺10
        </button>
      </div>`;
    document.body.appendChild(div);
    const skipBtn = div.querySelector('#ad-skip-btn');
    skipBtn.addEventListener('click', () => { div.remove(); if (onDone) onDone(); });
    const premBtn = div.querySelector('#ad-premium-btn');
    if (premBtn) premBtn.addEventListener('click', () => {
      div.remove();
      showPremiumModal();
      // Eğer premium almadan kapanırsa onDone çağır
      window._pendingAdDone = onDone;
    });
    let secs = 5;
    const _t = setInterval(() => {
      secs--;
      if (secs <= 0) {
        clearInterval(_t);
        skipBtn.disabled = false;
        skipBtn.textContent = 'Devam →';
        skipBtn.style.color = '#d4dce8';
        skipBtn.style.borderColor = '#3a5a7a';
      } else {
        skipBtn.textContent = secs + ' saniye bekle...';
      }
    }, 1000);

  } else if (type === 'rewarded') {
    div.innerHTML = `
      <div style="background:#111827;border:1px solid #1e2d45;border-radius:16px;padding:32px 40px;text-align:center;max-width:380px;width:92%;">
        <div style="font-family:'Bebas Neue',cursive;font-size:1.6rem;color:#f0a500;letter-spacing:2px;margin-bottom:6px;">🎬 ÖDÜLLÜ REKLAM</div>
        <div style="color:#d4dce8;font-size:.9rem;margin-bottom:20px;">Kısa bir reklam izle,<br>bu seviyeyi <b style="color:#22c97a;">1 kere daha</b> oyna!</div>
        <div style="background:#1e2d45;border-radius:8px;height:120px;display:flex;align-items:center;justify-content:center;color:#5a6a80;font-size:.85rem;margin-bottom:16px;">
          📢 Ödüllü Reklam Alanı
        </div>
        <button type="button" id="ad-watch-btn" style="background:linear-gradient(135deg,#22c97a,#1a9a5e);color:#000;border:none;border-radius:10px;padding:12px;font-family:'Bebas Neue',cursive;font-size:1.1rem;letter-spacing:2px;cursor:pointer;width:100%;margin-bottom:10px;">
          İZLEDİM — TEKRAR OYNA
        </button>
        <button type="button" id="ad-skip-rewarded-btn" style="background:transparent;color:#5a6a80;border:1px solid #1e2d45;border-radius:8px;padding:10px;font-size:.85rem;cursor:pointer;width:100%;">
          Hayır, menüye dön
        </button>
      </div>`;
    document.body.appendChild(div);
    div.querySelector('#ad-watch-btn').addEventListener('click', function() {
      recordAd('rewarded');
      div.remove();
      if (onDone) onDone();
    });
    div.querySelector('#ad-skip-rewarded-btn').addEventListener('click', function() {
      div.remove();
      if (onSkip) onSkip();
    });
  }
}

function closeAd() {
  const div = document.getElementById('ad-overlay');
  if (div) div.remove();
}

// Premium satın alma modal
function showPremiumModal() {
  closeAd();
  const existing = document.getElementById('premium-modal');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.id = 'premium-modal';
  div.style.cssText = 'position:fixed;inset:0;background:rgba(10,14,26,.97);z-index:810;display:flex;align-items:center;justify-content:center;';
  div.innerHTML = `
    <div style="background:#111827;border:1px solid #1e2d45;border-radius:20px;padding:36px 40px;text-align:center;max-width:400px;width:92%;">
      <div style="font-family:'Bebas Neue',cursive;font-size:2.2rem;color:#f0a500;letter-spacing:3px;margin-bottom:4px;">⭐ PREMİUM</div>
      <div style="color:#5a6a80;font-size:.85rem;margin-bottom:24px;">Reklamsız, sınırsız oyun deneyimi</div>
      <div style="background:rgba(240,165,0,.06);border:1px solid rgba(240,165,0,.2);border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="font-family:'Bebas Neue',cursive;font-size:2.8rem;color:#f0a500;">₺10</div>
        <div style="color:#d4dce8;font-size:.85rem;margin-top:8px;line-height:1.6;">
          ✅ Tüm reklamlar kaldırılır<br>
          ✅ Tek seferlik ödeme<br>
          ✅ Sonsuza kadar reklamsız<br>
          ✅ Premium rozet
        </div>
      </div>
      <div style="color:#5a6a80;font-size:.78rem;margin-bottom:16px;">Tek seferlik ödeme — sonsuza kadar reklamsız.</div>
      <button type="button" onclick="initiatePurchase()" style="background:linear-gradient(135deg,#e05c2a,#f0a500);color:#000;border:none;border-radius:10px;padding:14px;font-family:'Bebas Neue',cursive;font-size:1.2rem;letter-spacing:2px;cursor:pointer;width:100%;margin-bottom:10px;">SATIN AL — ₺10</button>
      <button type="button" id="premium-cancel-btn" style="background:transparent;color:#5a6a80;border:1px solid #1e2d45;border-radius:8px;padding:10px;font-size:.85rem;cursor:pointer;width:100%;">Şimdi değil</button>
    </div>`;
  document.body.appendChild(div);
  div.querySelector('#premium-cancel-btn').addEventListener('click', () => {
    div.remove();
    // Interstitial ad overlay varsa kapat
    const adOv = document.getElementById('ad-overlay');
    if (adOv) adOv.remove();
    if (window._pendingAdDone) {
      const fn = window._pendingAdDone;
      window._pendingAdDone = null;
      fn();
    }
  });
}

async function initiatePurchase() {
  if (window.getDigitalGoodsService) {
    try {
      const service = await window.getDigitalGoodsService('https://play.google.com/billing');
      const request = new PaymentRequest([{
        supportedMethods: 'https://play.google.com/billing',
        data: { sku: 'geoblitz_premium' }
      }], { total: { label: 'GeoBlitz Premium', amount: { currency: 'TRY', value: '10.00' } } });
      const response = await request.show();
      await response.complete('success');
      await activatePremium(response.details.token);
    } catch(e) { console.error('Purchase failed:', e); }
  } else {
    alert('Bu özellik Google Play uygulamasında çalışır.');
  }
}

async function activatePremium(purchaseToken) {
  if (!currentUser || !dbReady()) return;
  try {
    const key = currentUser.username.toLowerCase();
    await db.collection('users').doc(key).update({
      premium: true, premiumType: 'lifetime',
      premiumSince: Date.now(), premiumToken: purchaseToken || 'manual'
    });
    currentUser.premium = true;
    document.getElementById('premium-modal') && document.getElementById('premium-modal').remove();
    updateUserUI();
    alert('🎉 Premium üyeliğiniz aktif edildi!');
  } catch(e) { console.error('Premium activation error:', e); }
}


// ===== PREMIUM & REKLAM SİSTEMİ =====
// isPremium() — kullanıcının premium üye olup olmadığını döndürür
function isPremium() {
  return !!(currentUser && currentUser.premium === true);
}

// Premium satın alma modal


// Google Play Billing entegrasyonu (TWA / Play Store)
async function initiatePurchase() {
  // Google Play Billing API (Trusted Web Activity içinde çalışır)
  if (window.getDigitalGoodsService) {
    try {
      const service = await window.getDigitalGoodsService('https://play.google.com/billing');
      const details = await service.getDetails(['geoblitz_premium']);
      const request = new PaymentRequest([{
        supportedMethods: 'https://play.google.com/billing',
        data: { sku: 'geoblitz_premium' }
      }], { total: { label: 'GeoBlitz Premium', amount: { currency: 'TRY', value: '10.00' } } });
      const response = await request.show();
      await response.complete('success');
      // Satın alma başarılı - kullanıcıyı premium yap
      await activatePremium(response.details.token);
    } catch(e) {
      console.error('Purchase failed:', e);
      alert('Satın alma başarısız: ' + e.message);
    }
  } else {
    // Tarayıcıda test modu - gerçek uygulamada bu kod çalışmaz
    alert('Bu özellik Google Play uygulamasında çalışır.');
  }
}

// Premium aktifleştir (satın alma doğrulandıktan sonra)
async function activatePremium(purchaseToken) {
  if (!currentUser || !dbReady()) return;
  try {
    const key = currentUser.username.toLowerCase();
    await db.collection('users').doc(key).update({
      premium: true,
      premiumType: 'lifetime',
      premiumSince: Date.now(),
      premiumToken: purchaseToken || 'manual'
    });
    currentUser.premium = true;
    document.getElementById('premium-modal') && document.getElementById('premium-modal').remove();
    // Premium rozet güncelle
    updateUserUI();
    alert('🎉 Premium üyeliğiniz aktif edildi!');
  } catch(e) {
    console.error('Premium activation error:', e);
  }
}

async function saveScore(thisGameScore, thisGameLevel) {
  if (!currentUser || !dbReady()) return;
  const key = currentUser.username.toLowerCase();
  try {
    const userRef = db.collection('users').doc(key);
    const snap = await userRef.get();
    let userData = snap.exists ? snap.data() : Object.assign({}, currentUser);
    userData.gamesPlayed = (userData.gamesPlayed || 0) + 1;
    if (gameMode === 'turkey') {
      userData.gamesPlayedTurkey = (userData.gamesPlayedTurkey || 0) + 1;
      if (thisGameScore > (userData.bestScoreTurkey || 0)) userData.bestScoreTurkey = thisGameScore;
      if (thisGameLevel > (userData.bestLevelTurkey || 0)) userData.bestLevelTurkey = thisGameLevel;
    } else if (gameMode === 'europe') {
      userData.gamesPlayedEurope = (userData.gamesPlayedEurope || 0) + 1;
      if (thisGameScore > (userData.bestScoreEurope || 0)) userData.bestScoreEurope = thisGameScore;
      if (thisGameLevel > (userData.bestLevelEurope || 0)) userData.bestLevelEurope = thisGameLevel;
    } else if (gameMode === 'landmark') {
      userData.gamesPlayedLandmark = (userData.gamesPlayedLandmark || 0) + 1;
      if (thisGameScore > (userData.bestScoreLandmark || 0)) userData.bestScoreLandmark = thisGameScore;
      if (thisGameLevel > (userData.bestLevelLandmark || 0)) userData.bestLevelLandmark = thisGameLevel;
    } else if (gameMode === 'flag') {
      userData.gamesPlayedFlag = (userData.gamesPlayedFlag || 0) + 1;
      if (thisGameScore > (userData.bestScoreFlag || 0)) userData.bestScoreFlag = thisGameScore;
      if (thisGameLevel > (userData.bestLevelFlag || 0)) userData.bestLevelFlag = thisGameLevel;
    } else {
      userData.gamesPlayedWorld = (userData.gamesPlayedWorld || 0) + 1;
      if (thisGameScore > (userData.bestScore || 0)) userData.bestScore = thisGameScore;
      if (thisGameLevel > (userData.bestLevel || 0)) userData.bestLevel = thisGameLevel;
    }
    userData.lastPlayed = Date.now();
    await userRef.set(userData);
    currentUser = userData;
    updateUserUI();
  } catch(e) { console.error('Score save error:', e); }
}

let lbOrigin = null; // 'welcome' | 'overlay' | null

let lbCurrentMode = 'world';
let lbCurrentPage = 0;
const LB_PAGE_SIZE = 10;
let lbAllUsers = [];

