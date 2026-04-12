// ===== MULTIPLAYER SİSTEMİ =====
// ===== MULTIPLAYER SİSTEMİ =====

let mpLobby = null;
let mpLobbyId = null;
let mpUnsubscribe = null;
let mpMode = 'world';
let mpIsHost = false;
let mpMyScore = 0;
let mpQuestions = [];
let mpCurrentQ = 0;
let mpGameActive = false;

// ── RANK SİSTEMİ ─────────────────────────────────────
const RANK_TIERS = [
  { key:'bronze1', label:'Bronz I',    min:0,   max:60  },
  { key:'bronze2', label:'Bronz II',   min:60,  max:100 },
  { key:'bronze3', label:'Bronz III',  min:100, max:140 },
  { key:'silver1', label:'Gümüş I',    min:140, max:180 },
  { key:'silver2', label:'Gümüş II',   min:180, max:220 },
  { key:'silver3', label:'Gümüş III',  min:220, max:260 },
  { key:'gold1',   label:'Altın I',    min:260, max:300 },
  { key:'gold2',   label:'Altın II',   min:300, max:340 },
  { key:'gold3',   label:'Altın III',  min:340, max:380 },
  { key:'plat1',   label:'Platin I',   min:380, max:420 },
  { key:'plat2',   label:'Platin II',  min:420, max:460 },
  { key:'plat3',   label:'Platin III', min:460, max:9999 },
];
const RANK_TIERS_EN = [
  { key:'bronze1', label:'Bronze I' }, { key:'bronze2', label:'Bronze II' }, { key:'bronze3', label:'Bronze III' },
  { key:'silver1', label:'Silver I' }, { key:'silver2', label:'Silver II' }, { key:'silver3', label:'Silver III' },
  { key:'gold1',   label:'Gold I'   }, { key:'gold2',   label:'Gold II'   }, { key:'gold3',   label:'Gold III'   },
  { key:'plat1',   label:'Platinum I' }, { key:'plat2', label:'Platinum II' }, { key:'plat3',  label:'Platinum III' },
];
const RANK_PLACEMENT_ELO = [80, 70, 50, 40, 30]; // 5 yerleşme maçı çarpanları
const RANK_PLACEMENT_GAMES = 5;
const RANK_WIN_ELO = 20;
const RANK_LOSS_ELO = -20;
const RANK_PLACEMENT_WIN_TOTAL = 270; // 5 galibiyet → 270 elo → Gümüş III

function getRankEloField(mode) {
  return { turkey:'eloTurkey', europe:'eloEurope', landmark:'eloLandmark', flag:'eloFlag' }[mode] || 'eloWorld';
}
function getRankGamesField(mode) {
  return { turkey:'rankGamesTurkey', europe:'rankGamesEurope', landmark:'rankGamesLandmark', flag:'rankGamesFlag' }[mode] || 'rankGamesWorld';
}
function getElo(user, mode) {
  if (!user) return null;
  const games = user[getRankGamesField(mode)] || 0;
  if (games < RANK_PLACEMENT_GAMES) return null; // yerleşmemiş
  return user[getRankEloField(mode)] || 0;
}
function getRankFromElo(elo) {
  if (elo === null) return null;
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (elo >= RANK_TIERS[i].min) return RANK_TIERS[i];
  }
  return RANK_TIERS[0];
}
function getRankLabel(elo, lang) {
  if (elo === null) return lang==='en' ? 'Unranked' : 'Sırasız';
  const tier = getRankFromElo(elo);
  if (!tier) return '?';
  const enTier = RANK_TIERS_EN.find(t => t.key === tier.key);
  return lang==='en' ? enTier.label : tier.label;
}
function getRankClass(elo) {
  if (elo === null) return 'rank-unranked';
  const tier = getRankFromElo(elo);
  return tier ? 'rank-' + tier.key : 'rank-unranked';
}
function getRankEmoji(elo) {
  if (elo === null) return '❓';
  const tier = getRankFromElo(elo);
  if (!tier) return '❓';
  if (tier.key === 'plat3')   return '💎';
  if (tier.key === 'plat2')   return '🔵';
  if (tier.key === 'plat1')   return '🌟';
  if (tier.key === 'gold3')   return '👑';
  if (tier.key === 'gold2')   return '🏅';
  if (tier.key === 'gold1')   return '🥇';
  if (tier.key === 'silver3') return '⭐';
  if (tier.key === 'silver2') return '🥈';
  if (tier.key === 'silver1') return '🔷';
  if (tier.key === 'bronze3') return '🔶';
  if (tier.key === 'bronze2') return '🥉';
  return '🔸'; // bronze1
}

// Büyük rank kartı HTML'i döndür
function getRankCardHTML(elo, langOverride) {
  const l = langOverride || lang;
  if (elo === null) {
    return `<div class="rank-card-display rank-card-unranked" style="background:rgba(60,70,90,.5);border:1px solid var(--border);">
      <div class="rank-card-icon">❓</div>
      <div class="rank-card-label" style="color:var(--muted)">${l==='en'?'UNRANKED':'SIRASIZ'}</div>
    </div>`;
  }
  const tier = getRankFromElo(elo);
  if (!tier) return '';
  const label = getRankLabel(elo, l);
  const icon  = getRankEmoji(elo);
  const cls   = 'rank-card-' + tier.key;
  return `<div class="rank-card-display ${cls}">
    <div class="rank-card-icon">${icon}</div>
    <div class="rank-card-label">${label}</div>
    <div class="rank-card-elo">${elo} ELO</div>
  </div>`;
}

async function updateRankAfterMatch(won, mode) {
  if (!currentUser || !db) return { oldElo: null, newElo: null, oldRank: null, newRank: null };
  const eloField   = getRankEloField(mode);
  const gamesField = getRankGamesField(mode);
  const key = currentUser.username.toLowerCase();
  try {
    const snap = await db.collection('users').doc(key).get();
    const userData = snap.exists ? snap.data() : currentUser;
    let elo   = userData[eloField]   || 0;
    let games = userData[gamesField] || 0;
    const oldElo = games >= RANK_PLACEMENT_GAMES ? elo : null;
    const oldRank = getRankFromElo(oldElo);

    let delta;
    if (games < RANK_PLACEMENT_GAMES) {
      // Yerleşme maçı
      const placementMult = RANK_PLACEMENT_ELO[games] || 20;
      delta = won ? placementMult : -Math.floor(placementMult * 0.5);
    } else {
      delta = won ? RANK_WIN_ELO : RANK_LOSS_ELO;
    }
    elo = Math.max(0, elo + delta);
    games += 1;

    await db.collection('users').doc(key).update({
      [eloField]:   elo,
      [gamesField]: games,
    });
    currentUser[eloField]   = elo;
    currentUser[gamesField] = games;

    const newElo  = games >= RANK_PLACEMENT_GAMES ? elo : null;
    const newRank = getRankFromElo(newElo);
    return { oldElo, newElo, oldRank, newRank, delta, games, placed: games === RANK_PLACEMENT_GAMES };
  } catch(e) { console.error('Rank update error:', e); return { oldElo:null, newElo:null }; }
}

function openMultiplayerMenu() {
  if (!currentUser || currentUser.isGuest) {
    alert(t('mpErrLogin'));
    return;
  }
  document.getElementById('welcome-modal').style.display = 'none';
  mpShowMain();
  document.getElementById('mp-modal').classList.add('open');
}

function closeMultiplayerMenu() {
  mmCleanup();
  document.getElementById('mp-modal').classList.remove('open');
  document.getElementById('welcome-modal').style.display = 'flex';
}

function mpShowMain() {
  ['mp-screen-create','mp-screen-join','mp-screen-lobby-host','mp-screen-lobby-guest','mp-screen-browse','mp-screen-matchmaking'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById('mp-screen-main').style.display = 'block';
}

function mpShowCreate() {
  document.getElementById('mp-screen-main').style.display = 'none';
  document.getElementById('mp-screen-create').style.display = 'block';
  const cn = document.getElementById('mp-create-name');
  if (cn) { cn.value = ''; cn.focus(); }
  const pt = document.getElementById('mp-create-private-toggle');
  if (pt) { pt.checked = false; document.getElementById('mp-create-password-row').style.display = 'none'; }
  document.getElementById('mp-create-error').textContent = '';
}

function mpShowJoin() {
  document.getElementById('mp-screen-main').style.display = 'none';
  document.getElementById('mp-screen-join').style.display = 'block';
  const jc = document.getElementById('mp-join-code');
  if (jc) { jc.value = ''; jc.focus(); }
  document.getElementById('mp-join-error').textContent = '';
  document.getElementById('mp-join-password-row').style.display = 'none';
  setTimeout(() => document.getElementById('mp-join-code').focus(), 100);
}

function mpSelectMode(m) {
  mpMode = m;
  ['world','europe','turkey','landmark','flag'].forEach(id => {
    const btn = document.getElementById('mp-mode-'+id);
    if (btn) btn.classList.toggle('active', id === m);
  });
}

// Lobi içinde mod değiştir (sadece host)
async function mpLobbySetMode(m) {
  if (!mpIsHost || !mpLobbyId) return;
  mpMode = m;
  ['world','europe','turkey','landmark','flag'].forEach(id => {
    const btn = document.getElementById('lobby-mode-'+id);
    if (btn) btn.classList.toggle('active', id === m);
  });
  const labels = {world:'🌍 DÜNYA', europe:'🇪🇺 AVRUPA', turkey:'🇹🇷 TÜRKİYE', landmark:'🏛️ HARİKALAR', flag:'🚩 BAYRAKLAR'};
  const labelsEn = {world:'🌍 WORLD', europe:'🇪🇺 EUROPE', turkey:'🇹🇷 TURKEY', landmark:'🏛️ WONDERS', flag:'🚩 FLAGS'};
  const lbl = document.getElementById('lobby-mode-label');
  if (lbl) lbl.textContent = lang==='tr' ? (labels[m]||m) : (labelsEn[m]||m);
  // Firebase'e yaz
  try {
    await db.collection('mp_lobbies').doc(mpLobbyId).update({ mode: m });
  } catch(e) { console.error('setMode error', e); }
}

// Rastgele 4 haneli lobi kodu üret (sadece büyük harf)
function mpGenerateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const MP_QUESTION_COUNT = 12;

function mpTogglePasswordField() {
  const checked = document.getElementById('mp-create-private-toggle').checked;
  document.getElementById('mp-create-password-row').style.display = checked ? 'block' : 'none';
  if (checked) document.getElementById('mp-create-password').focus();
}

async function mpCreateLobby() {
  if (!db) { document.getElementById('mp-create-error').textContent = 'Connection error!'; return; }
  const lobbyNameRaw = (document.getElementById('mp-create-name').value || '').trim().toUpperCase();
  if (!lobbyNameRaw) { document.getElementById('mp-create-error').textContent = 'Lobi adı boş olamaz!'; return; }
  const isPrivate = document.getElementById('mp-create-private-toggle').checked;
  const password  = isPrivate ? (document.getElementById('mp-create-password').value || '').trim() : '';
  if (isPrivate && !password) { document.getElementById('mp-create-error').textContent = 'Şifre boş olamaz!'; return; }
  if (mpMode === 'flag') _showPortraitTip();
  const btn = document.getElementById('mp-create-go');
  btn.disabled = true; btn.textContent = t('mpCreating');

  try {
    // Şifreli lobilerde benzersiz kod üret, şifresiz lobilerde gerek yok
    let code = '';
    if (isPrivate) {
      let exists = true;
      while (exists) {
        code = mpGenerateCode();
        const snap = await db.collection('mp_lobbies').where('code', '==', code).where('status', '==', 'waiting').get();
        exists = !snap.empty;
      }
    }

    const questions = mpMode === 'turkey' ? pickTurkeyQuestions(MP_QUESTION_COUNT) : mpMode === 'europe' ? pickEuropeQuestions(MP_QUESTION_COUNT) : mpMode === 'landmark' ? pickLandmarkQuestions(MP_QUESTION_COUNT) : mpMode === 'flag' ? pickFlagQuestions(12) : pickQuestions(MP_QUESTION_COUNT);

    const lobbyData = {
      code,
      lobbyName: lobbyNameRaw,
      isPrivate: isPrivate,
      password:  isPrivate ? password : '',
      hostId: currentUser.username,
      status: 'waiting',
      mode: mpMode,
      questions: mpMode === 'flag'
        ? questions.map(q => ({tr: q.tr, en: q.en, flag: q.flag, code: q.code||'', atr: q.atr||[], aen: q.aen||[]}))
        : questions.map(q => ({name: q.name, name_en: q.name_en||'', country: q.country||'', city: q.city||'', lat: q.lat||0, lon: q.lon||0})),
      players: {
        [currentUser.username]: { name: currentUser.username, score: 0, joinedAt: Date.now(), ready: true }
      },
      scores: {},
      createdAt: Date.now()
    };

    const ref = await db.collection('mp_lobbies').add(lobbyData);
    mpLobbyId = ref.id;
    mpLobby = lobbyData;
    mpIsHost = true;
    mpMyScore = 0;
    mpQuestions = questions;

    mpSubscribeLobby();
    mpShowLobbyHost();
  } catch(e) {
    document.getElementById('mp-create-error').textContent = 'Hata: ' + e.message;
  }
  btn.disabled = false; btn.textContent = t('mpCreateGo');
}

// Lobiye katılma — ortak yardımcı
async function _mpDoJoin(docSnap, password) {
  const lobbyData = docSnap.data();
  const playerCount = Object.keys(lobbyData.players || {}).length;
  const maxPlayers = lobbyData.maxPlayers || 5;
  if (playerCount >= maxPlayers) throw new Error(lang==='en' ? 'Lobby is full!' : 'Lobi dolu!');
  if (lobbyData.players && lobbyData.players[currentUser.username]) throw new Error('Bu lobide zaten varsın!');
  if (lobbyData.isPrivate && lobbyData.password !== password) throw new Error('Yanlış şifre!');

  mpLobbyId = docSnap.id;
  mpIsHost = false;
  mpMyScore = 0;
  mpQuestions = lobbyData.questions;
  mpMode = lobbyData.mode;

  await db.collection('mp_lobbies').doc(mpLobbyId).update({
    [`players.${currentUser.username}`]: { name: currentUser.username, score: 0, joinedAt: Date.now(), ready: true }
  });
  mpSubscribeLobby();
  mpShowLobbyGuest();
  if (mpMode === 'flag') _showPortraitTip();
}

// Koda göre katılma
async function mpJoinLobbyByCode() {
  const code = document.getElementById('mp-join-code').value.trim().toUpperCase();
  if (code.length !== 4) { document.getElementById('mp-join-error').textContent = 'Geçersiz kod!'; return; }
  if (!db) { document.getElementById('mp-join-error').textContent = 'Bağlantı hatası!'; return; }
  const btn = document.getElementById('mp-join-go');
  btn.disabled = true; btn.textContent = t('mpJoining');
  try {
    const snap = await db.collection('mp_lobbies').where('code', '==', code).where('status', '==', 'waiting').get();
    if (snap.empty) { document.getElementById('mp-join-error').textContent = 'Lobi bulunamadı veya oyun başladı!'; btn.disabled=false; btn.textContent=t('mpJoinGo'); return; }
    const docSnap = snap.docs[0];
    const lobbyData = docSnap.data();
    if (lobbyData.isPrivate) {
      // Şifre alanını göster
      document.getElementById('mp-join-password-row').style.display = 'block';
      document.getElementById('mp-join-password').dataset.docId = docSnap.id;
      document.getElementById('mp-join-password').focus();
      btn.disabled = false; btn.textContent = t('mpJoinGo');
      btn.onclick = async function() {
        const pw = document.getElementById('mp-join-password').value.trim();
        btn.disabled = true; btn.textContent = t('mpJoining');
        try {
          await _mpDoJoin(docSnap, pw);
        } catch(e) { document.getElementById('mp-join-error').textContent = e.message; btn.disabled=false; btn.textContent=t('mpJoinGo'); }
      };
      return;
    }
    await _mpDoJoin(docSnap, '');
  } catch(e) {
    document.getElementById('mp-join-error').textContent = 'Hata: ' + e.message;
  }
  btn.disabled = false; btn.textContent = t('mpJoinGo');
  btn.onclick = mpJoinLobbyByCode;
}

// Eski alias
function mpJoinLobby() { mpJoinLobbyByCode(); }

// ─── Aktif Lobi Listesi ───────────────────────────────────────
let _mpBrowsePendingDoc = null;

// ══════════════════════════════════════════════════════════
// RASTGELE EŞLEŞTİRME (Matchmaking)
// ══════════════════════════════════════════════════════════
let _mmMode = 'world';
let _mmInterval = null;
let _mmDocRef = null;
let _mmUnsubscribe = null;
let _mmExpanded = false;
let _mmExpandAsked = false;

const MM_MODES = [
  { key:'world',    emoji:'🌍', labelTr:'Dünya',    labelEn:'World'   },
  { key:'europe',   emoji:'🇪🇺', labelTr:'Avrupa',   labelEn:'Europe'  },
  { key:'turkey',   emoji:'🇹🇷', labelTr:'Türkiye',  labelEn:'Turkey'  },
  { key:'landmark', emoji:'🏛️', labelTr:'Harikalar',labelEn:'Wonders' },
  { key:'flag',     emoji:'🚩', labelTr:'Bayraklar',labelEn:'Flags'   },
];

function mmRenderRankGrid() {
  const grid = document.getElementById('mm-rank-grid');
  if (!grid) return;
  grid.innerHTML = MM_MODES.map(m => {
    const elo = currentUser ? getElo(currentUser, m.key) : null;
    const rkLabel = getRankLabel(elo, lang);
    const rkClass = getRankClass(elo);
    const rkEmoji = elo !== null ? getRankEmoji(elo) : '❓';
    const games = currentUser ? (currentUser[getRankGamesField(m.key)] || 0) : 0;
    const gamesLeft = Math.max(0, RANK_PLACEMENT_GAMES - games);
    const sub = elo !== null ? rkLabel : (gamesLeft > 0 ? (lang==='en' ? gamesLeft+' games left' : gamesLeft+' maç kaldı') : (lang==='en'?'Unranked':'Sırasız'));
    return '<div class="mm-rank-card' + (m.key===_mmMode?' selected':'') + '" onclick="mmSelectMode(\'' + m.key + '\')">'
      + '<div class="mm-rank-card-mode">' + m.emoji + '</div>'
      + '<div class="mm-rank-card-name">' + (lang==='en'?m.labelEn:m.labelTr) + '</div>'
      + '<div style="margin-top:4px"><span class="rank-badge ' + rkClass + '">' + rkEmoji + ' ' + sub + '</span></div>'
      + '</div>';
  }).join('');
}

function mmSelectMode(m) {
  _mmMode = m;
  mmRenderRankGrid();
}

function mpShowMatchmaking() {
  ['mp-screen-main','mp-screen-create','mp-screen-join','mp-screen-lobby-host','mp-screen-lobby-guest','mp-screen-browse'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById('mp-screen-matchmaking').style.display = 'block';
  document.getElementById('mp-mm-select').style.display = 'block';
  document.getElementById('mp-mm-searching').style.display = 'none';
  document.getElementById('mp-mm-expand-box').style.display = 'none';
  _mmExpanded = false; _mmExpandAsked = false;
  mmRenderRankGrid();
}

function mmStartSearch() {
  document.getElementById('mp-mm-select').style.display = 'none';
  document.getElementById('mp-mm-searching').style.display = 'block';
  document.getElementById('mp-mm-error').textContent = '';
  document.getElementById('mp-mm-expand-box').style.display = 'none';
  _mmExpanded = false; _mmExpandAsked = false;
  const modeNames = {world:lang==='en'?'World':'Dünya',europe:lang==='en'?'Europe':'Avrupa',turkey:lang==='en'?'Turkey':'Türkiye',landmark:lang==='en'?'Wonders':'Harikalar',flag:lang==='en'?'Flags':'Bayraklar'};
  const sub = document.getElementById('mp-mm-sub');
  if (sub) sub.textContent = (MM_MODES.find(m=>m.key===_mmMode)||{}).emoji + ' ' + (modeNames[_mmMode]||_mmMode);
  mmStart();
}

function mmExpandRange() {
  _mmExpanded = true;
  document.getElementById('mp-mm-expand-box').style.display = 'none';
  document.getElementById('mp-mm-hint').textContent = lang==='en' ? 'Expanding search…' : 'Arama genişletiliyor…';
}

function mmDismissExpand() {
  // "Hayır" — sadece kutuyu kapat, aramaya devam et (genişletmeden)
  document.getElementById('mp-mm-expand-box').style.display = 'none';
  document.getElementById('mp-mm-hint').textContent = lang==='en' ? 'Looking for an opponent…' : 'Rakip aranıyor…';
  _mmSearchPhaseRef = 'narrow'; // arama devam eder, genişletilmeden
}

let _mmSearchPhaseRef = 'narrow';

async function mmStart() {
  if (!currentUser || !db) return;
  const myName = currentUser.username;
  const myElo  = getElo(currentUser, _mmMode) || 0;
  let cd = 20;
  _mmSearchPhaseRef = 'narrow';
  document.getElementById('mp-mm-timer').textContent = cd;
  document.getElementById('mp-mm-hint').textContent = lang==='en' ? 'Looking for an opponent…' : 'Rakip aranıyor…';
  document.getElementById('mp-mm-spinner').textContent = '🔍';

  // Bekleme kuyruğuna gir
  try {
    _mmDocRef = await (async () => {
      const ref = db.collection('matchmaking').doc();
      await ref.set({ username: myName, mode: _mmMode, elo: myElo, status: 'waiting', createdAt: Date.now() });
      return ref;
    })();
  } catch(e) {
    document.getElementById('mp-mm-error').textContent = 'Hata: ' + e.message;
    return;
  }

  // Listener: biri eşleştirirse
  _mmUnsubscribe = _mmDocRef.onSnapshot(async snap => {
    if (!snap.exists) return;
    const data = snap.data();
    if (data.status === 'matched') {
      clearInterval(_mmInterval);
      if (_mmUnsubscribe) { _mmUnsubscribe(); _mmUnsubscribe = null; }
      document.getElementById('mp-mm-hint').textContent = lang==='en' ? 'Match found! Joining…' : 'Eşleşme bulundu! Katılıyorum…';
      document.getElementById('mp-mm-spinner').textContent = '⚡';
      setTimeout(async () => { await mmJoinLobbyOf(data.matchedBy || data.matchedWith); }, 1000);
    }
  });

  // Countdown + aktif arama döngüsü
  // searchPhase dışarıdan (mmDismissExpand) değiştirilebilsin diye _mmSearchPhaseRef kullanıyoruz
  _mmSearchPhaseRef = 'narrow';
  _mmInterval = setInterval(async () => {
    cd--;
    const timerEl = document.getElementById('mp-mm-timer');
    if (timerEl) timerEl.textContent = cd;

    // 10. saniyede rank aralığı genişletme sor
    if (cd === 10 && !_mmExpandAsked && _mmSearchPhaseRef === 'narrow') {
      _mmExpandAsked = true;
      _mmSearchPhaseRef = 'ask';
      document.getElementById('mp-mm-expand-box').style.display = 'block';
      const expandLabel = document.getElementById('mp-mm-expand-label');
      if (expandLabel) expandLabel.textContent = lang==='en' ? 'No opponent found nearby. Expand rank range?' : 'Yakın rakip bulunamadı. Rank aralığı genişletilsin mi?';
    }

    // 15. saniyede bot eşleştir
    if (cd === 5 && _mmSearchPhaseRef !== 'bot') {
      _mmSearchPhaseRef = 'bot';
      clearInterval(_mmInterval);
      if (_mmUnsubscribe) { _mmUnsubscribe(); _mmUnsubscribe = null; }
      if (_mmDocRef) { _mmDocRef.delete().catch(()=>{}); _mmDocRef = null; }
      const hintEl = document.getElementById('mp-mm-hint');
      const spinEl = document.getElementById('mp-mm-spinner');
      if (hintEl) hintEl.textContent = lang==='en' ? 'No player found. Adding bot…' : 'Oyuncu bulunamadı. Bot ekleniyor…';
      if (spinEl) spinEl.textContent = '🤖';
      document.getElementById('mp-mm-expand-box').style.display = 'none';
      setTimeout(() => mmStartWithBot(), 1000);
      return;
    }

    // Süre doldu (20s — artık ulaşılmaz ama güvenlik için kalsın)
    if (cd <= 0) {
      clearInterval(_mmInterval);
      mmCleanup();
      const errEl = document.getElementById('mp-mm-error');
      if (errEl) errEl.textContent = lang==='en' ? 'No opponent found.' : 'Eşleşme bulunamadı.';
      setTimeout(() => { mpShowMatchmaking(); }, 2000);
      return;
    }

    // Her saniye aktif arama: başka biri var mı?
    if (_mmSearchPhaseRef === 'ask') return; // kullanıcı kararını bekle
    try {
      const snap = await db.collection('matchmaking')
        .where('status', '==', 'waiting')
        .where('mode',   '==', _mmMode)
        .limit(10).get();
      let opponent = null;
      snap.forEach(doc => {
        if (opponent) return;
        const d = doc.data();
        if (d.username === myName) return;
        if (_mmExpanded) { opponent = doc; return; }
        // Dar arama: elo ±40
        if (Math.abs((d.elo||0) - myElo) <= 40) { opponent = doc; }
      });
      if (opponent) {
        clearInterval(_mmInterval);
        const opData = opponent.data();
        // Race condition önleme: atomik update dene
        try {
          await db.runTransaction(async tx => {
            const opRef = opponent.ref;
            const opSnap = await tx.get(opRef);
            if (!opSnap.exists || opSnap.data().status !== 'waiting') throw new Error('already matched');
            tx.update(opRef, { status: 'matched', matchedBy: myName });
          });
        } catch(e) { return; } // başkası kapıyı kapatmış, bekle
        if (_mmUnsubscribe) { _mmUnsubscribe(); _mmUnsubscribe = null; }
        if (_mmDocRef) { _mmDocRef.delete().catch(()=>{}); _mmDocRef = null; }
        document.getElementById('mp-mm-hint').textContent = lang==='en' ? 'Match found! Creating lobby…' : 'Eşleşme bulundu! Lobi oluşturuluyor…';
        document.getElementById('mp-mm-spinner').textContent = '⚡';
        document.getElementById('mp-mm-expand-box').style.display = 'none';
        await mmCreateLobbyWith(opData.username, opponent.id);
      }
    } catch(e) { /* sessizce devam */ }
  }, 1000);
}

// ══════════════════════════════════════════════════════════
// BOT SİSTEMİ
// ══════════════════════════════════════════════════════════

function _getBotConfig(elo, mode) {
  // Rank'a göre bot gücü belirle
  const tier = elo === null ? 'bronze'
    : elo < 140 ? 'bronze'
    : elo < 260 ? 'silver'
    : elo < 380 ? 'gold'
    : 'plat';
  if (mode === 'flag') {
    // Doğru cevap oranı: bronze %30, silver %45, gold %60, plat %72 (%60 * 1.2)
    const rates = { bronze: 0.30, silver: 0.45, gold: 0.60, plat: 0.72 };
    return { tier, rate: rates[tier] };
  } else {
    // Soru başı ortalama puan: bronze 280, silver 410, gold 580, plat 696 (580 * 1.2)
    const avgScores = { bronze: 280, silver: 410, gold: 580, plat: 696 };
    return { tier, avgScore: avgScores[tier] };
  }
}

function _botName(tier) {
  const names = {
    bronze: ['BronzBot', 'RustyBot', 'IronBot', 'CopperBot'],
    silver: ['SilverBot', 'QuickBot', 'SwiftBot', 'NimbleBot'],
    gold:   ['GoldBot', 'EliteBot', 'MasterBot', 'ProBot'],
    plat:   ['PlatBot', 'DiamondBot', 'ApexBot', 'NexusBot'],
  };
  const pool = names[tier] || names.bronze;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function mmStartWithBot() {
  const myElo = getElo(currentUser, _mmMode) || 0;
  const botCfg = _getBotConfig(myElo === 0 ? null : myElo, _mmMode);
  const botName = _botName(botCfg.tier);
  const mode = _mmMode;
  mpMode = mode;

  const questions = mode === 'turkey' ? pickTurkeyQuestions(MP_QUESTION_COUNT)
    : mode === 'europe' ? pickEuropeQuestions(MP_QUESTION_COUNT)
    : mode === 'landmark' ? pickLandmarkQuestions(MP_QUESTION_COUNT)
    : mode === 'flag' ? pickFlagQuestions(12)
    : pickQuestions(MP_QUESTION_COUNT);

  const questionsForFirebase = mode === 'flag'
    ? questions.map(q => ({tr:q.tr,en:q.en,flag:q.flag,code:q.code||'',atr:q.atr||[],aen:q.aen||[]}))
    : questions.map(q => ({name:q.name,name_en:q.name_en||'',country:q.country||'',city:q.city||'',lat:q.lat||0,lon:q.lon||0}));

  // Bot skorları artık oyun sırasında dinamik hesaplanacak (botScores boş başlıyor)
  const lobbyData = {
    code: mpGenerateCode(),
    lobbyName: 'BOT MATCH',
    isPrivate: false, password: '',
    hostId: currentUser.username,
    status: 'playing', // direkt başlat
    mode, isQuickMatch: true, isBot: true,
    botName, botConfig: botCfg,
    maxPlayers: 2,
    questions: questionsForFirebase,
    players: {
      [currentUser.username]: { name: currentUser.username, score: 0, joinedAt: Date.now(), ready: true },
      [botName]: { name: botName, score: 0, joinedAt: Date.now(), ready: true, isBot: true }
    },
    scores: { [currentUser.username]: 0, [botName]: 0 },
    qscores: {},
    botScores: {}, // dinamik olarak doldurulacak
    currentQuestion: 0, showScores: -1, advanceAt: 0,
    photoReady: {}, photoReadyAt: null,
    flagQuestion: 0, flagAnswered: {}, flagStartAt: 0,
    createdAt: Date.now(), startedAt: Date.now(),
  };

  try {
    const ref = await db.collection('mp_lobbies').add(lobbyData);
    mpLobbyId = ref.id;
    mpLobby = lobbyData;
    mpIsHost = true;
    mpMyScore = 0;
    mpQuestions = questions;
    mmCleanup();
    // Bot lobi ekranı göstermeden direkt oyuna başla
    const hintEl = document.getElementById('mp-mm-hint');
    if (hintEl) hintEl.textContent = lang==='en' ? 'Starting vs Bot…' : 'Bot ile başlanıyor…';
    mpSubscribeLobby();
    setTimeout(() => mpStartMultiplayerGame(), 800);
  } catch(e) {
    const errEl = document.getElementById('mp-mm-error');
    if (errEl) errEl.textContent = 'Bot hatası: ' + e.message;
    mpShowMain();
  }
}

function _simulateBotScores(questions, botCfg, mode) {
  const scores = {};
  questions.forEach((q, i) => {
    if (mode === 'flag') {
      // Doğru cevap verirse: rate'e göre puan (tam sayı)
      const correct = Math.random() < botCfg.rate;
      if (correct) {
        const avgSec = botCfg.tier === 'gold' ? 3 : botCfg.tier === 'silver' ? 5 : 7;
        const sec = Math.max(1, Math.min(11, avgSec + (Math.random() * 4 - 2)));
        const timeLeft = Math.floor(Math.max(0, 12 - sec)); // tam sayı
        scores['q' + i] = timeLeft >= 7 ? 1000 : Math.max(0, 1000 - (7 - timeLeft) * 60);
      } else {
        scores['q' + i] = 0;
      }
    } else {
      // Dünya/Türkiye/Harikalar: avg ± %30 rastgele, kesinlikle tam sayı
      const avg = botCfg.avgScore;
      const variance = avg * 0.3;
      scores['q' + i] = Math.max(0, Math.round(avg + (Math.random() * variance * 2 - variance)));
    }
  });
  return scores;
}

// Bot skorlarını MP oyunu sırasında uygula
let _botApplyInterval = null;

function _startBotScoreApplication() {
  if (!mpLobby || !mpLobby.isBot) return;
  if (_botApplyInterval) clearInterval(_botApplyInterval);
  const botName = mpLobby.botName;
  const totalQ = (mpLobby.questions || []).length;

  // Başlangıç bot config'ini kopyala (oyun boyunca mutate edilecek)
  const baseCfg = Object.assign({}, mpLobby.botConfig || {});
  // Dinamik ortalama: her oyun başında orijinal değere döner
  let dynamicAvg = baseCfg.avgScore || 0;        // harita modları için
  let dynamicRate = baseCfg.rate || 0;            // flag modu için

  // Oyuncu ve bot birikimli skorlarını takip et
  let playerTotal = 0;
  let botTotal = 0;

  _botApplyInterval = setInterval(async () => {
    if (!mpGameActive || !mpLobbyId) { clearInterval(_botApplyInterval); return; }
    const currentQ = gameMode === 'flag' ? flagState.qIndex : state.questionIndex;
    if (currentQ >= totalQ) { clearInterval(_botApplyInterval); return; }

    // Oyuncu cevap verdiyse tetikle
    const playerAnswered = gameMode === 'flag' ? flagState.answered : state.answered;
    if (!playerAnswered) return;

    // Bu soru için bot zaten cevap verdiyse geç
    const alreadyAnswered = (() => {
      try {
        const ba = mpLobby[gameMode === 'flag' ? 'flagAnswered' : 'answered'] || {};
        return ba[botName] === currentQ;
      } catch(e) { return false; }
    })();
    if (alreadyAnswered) return;

    // ── Oyuncunun bu sorudaki puanını oku ──────────────────────────
    const playerQScore = (() => {
      try {
        return (mpLobby.qscores || {})[currentUser.username]?.['q' + currentQ] ?? null;
      } catch(e) { return null; }
    })();

    // ── Adaptif güç ayarı (önceki soru bittiyse) ──────────────────
    // İlk soruda oyuncu skoru henüz yazılmamış olabilir; null ise atla
    if (currentQ > 0 && playerQScore !== null) {
      const prevPlayerQ = (() => {
        try {
          const qs = mpLobby.qscores?.[currentUser.username] || {};
          // Son yazılan soru skoru
          let last = null;
          for (let qi = currentQ - 1; qi >= 0; qi--) {
            if (qs['q' + qi] !== undefined) { last = qs['q' + qi]; break; }
          }
          return last;
        } catch(e) { return null; }
      })();

      // Bir önceki sorudaki farka göre bot gücünü ayarla
      const prevBotQ = (() => {
        try {
          return (mpLobby.qscores || {})[botName]?.['q' + (currentQ - 1)] ?? 0;
        } catch(e) { return 0; }
      })();

      if (prevPlayerQ !== null) {
        const diff = prevPlayerQ - prevBotQ; // pozitif = oyuncu önde
        if (Math.abs(diff) > 0) {
          const pct = 0.08 + Math.random() * 0.04; // %8–%12 arası rastgele
          const adjustment = Math.round(diff * pct);
          if (gameMode === 'flag') {
            // Rate'i ±0.03–0.05 arası ayarla, 0.05–0.95 sınırları içinde tut
            const rateAdj = (diff > 0 ? 1 : -1) * (0.03 + Math.random() * 0.02);
            dynamicRate = Math.min(0.95, Math.max(0.05, dynamicRate + rateAdj));
          } else {
            dynamicAvg = Math.max(50, dynamicAvg + adjustment);
          }
        }
      }
    }

    // ── Bu soru için bot skorunu hesapla ──────────────────────────
    let botScore;
    if (gameMode === 'flag') {
      const correct = Math.random() < dynamicRate;
      if (correct) {
        const avgSec = baseCfg.tier === 'gold' ? 3 : baseCfg.tier === 'silver' ? 5 : 7;
        const sec = Math.max(1, Math.min(11, avgSec + (Math.random() * 4 - 2)));
        const timeLeft = Math.floor(Math.max(0, 12 - sec));
        botScore = timeLeft >= 7 ? 1000 : Math.max(0, 1000 - (7 - timeLeft) * 60);
      } else {
        botScore = 0;
      }
    } else {
      const variance = dynamicAvg * 0.3;
      botScore = Math.max(0, Math.round(dynamicAvg + (Math.random() * variance * 2 - variance)));
    }

    // Birikimli toplamı hesapla
    botTotal = 0;
    for (let qi = 0; qi < currentQ; qi++) {
      botTotal += Math.round((mpLobby.qscores?.[botName]?.['q' + qi]) || 0);
    }
    botTotal += botScore;

    if (!mpLobbyId || !mpGameActive) return;
    try {
      const update = {
        [`scores.${botName}`]: botTotal,
        [`qscores.${botName}.q${currentQ}`]: botScore,
      };
      if (gameMode === 'flag') {
        update[`flagAnswered.${botName}`] = currentQ;
      } else {
        update[`answered.${botName}`] = currentQ;
      }
      await db.collection('mp_lobbies').doc(mpLobbyId).update(update);
    } catch(e) {}
  }, 200);
}

async function mmCreateLobbyWith(opponentName, opponentDocId) {
  // Host olarak lobi oluştur, oponenti bekle
  const mode = _mmMode;
  mpMode = mode;
  const questions = mode === 'turkey' ? pickTurkeyQuestions(MP_QUESTION_COUNT)
    : mode === 'europe' ? pickEuropeQuestions(MP_QUESTION_COUNT)
    : mode === 'landmark' ? pickLandmarkQuestions(MP_QUESTION_COUNT)
    : mode === 'flag' ? pickFlagQuestions(12)
    : pickQuestions(MP_QUESTION_COUNT);

  const lobbyData = {
    code: mpGenerateCode(),
    lobbyName: 'QUICK MATCH',
    isPrivate: false, password: '',
    hostId: currentUser.username,
    status: 'waiting',
    mode,
    isQuickMatch: true,
    maxPlayers: 2,
    questions: mode === 'flag'
      ? questions.map(q => ({tr:q.tr,en:q.en,flag:q.flag,code:q.code||'',atr:q.atr||[],aen:q.aen||[]}))
      : questions.map(q => ({name:q.name,name_en:q.name_en||'',country:q.country||'',city:q.city||'',lat:q.lat||0,lon:q.lon||0})),
    players: { [currentUser.username]: { name: currentUser.username, score: 0, joinedAt: Date.now(), ready: true } },
    scores: {}, createdAt: Date.now()
  };

  try {
    const ref = await db.collection('mp_lobbies').add(lobbyData);
    mpLobbyId = ref.id;
    mpLobby = lobbyData;
    mpIsHost = true;
    mpMyScore = 0;
    mpQuestions = questions;
    // Oponent doc'unu güncelle (lobbyId ekle)
    if (opponentDocId) {
      db.collection('matchmaking').doc(opponentDocId).update({ lobbyId: ref.id }).catch(()=>{});
    } else {
      const waitingSnap = await db.collection('matchmaking')
        .where('username', '==', opponentName).where('status', '==', 'matched').limit(1).get();
      waitingSnap.forEach(doc => { doc.ref.update({ lobbyId: ref.id }).catch(()=>{}); });
    }
    if (_mmDocRef) { _mmDocRef.delete().catch(()=>{}); _mmDocRef = null; }
    mmCleanup();
    mpSubscribeLobby();
    mpShowLobbyHost();
    // 2 kişi dolunca otomatik başlat
    const _autoStart = setInterval(async () => {
      if (!mpLobby) { clearInterval(_autoStart); return; }
      const pCount = Object.keys(mpLobby.players || {}).length;
      if (pCount >= 2) { clearInterval(_autoStart); setTimeout(() => mpStartGame(), 500); }
    }, 500);
    setTimeout(() => clearInterval(_autoStart), 30000);
  } catch(e) {
    document.getElementById('mp-mm-error').textContent = 'Lobi hatası: ' + e.message;
  }
}

async function mmJoinLobbyOf(hostName) {
  // Kendi matchmaking doc'unu oku (lobbyId orada)
  let lobbyId = null;
  if (_mmDocRef) {
    try {
      // Biraz bekle host lobi oluşturup lobbyId yazsın
      for (let i = 0; i < 8; i++) {
        const mySnap = await _mmDocRef.get();
        if (mySnap.exists && mySnap.data().lobbyId) { lobbyId = mySnap.data().lobbyId; break; }
        await new Promise(r => setTimeout(r, 500));
      }
    } catch(e) {}
  }
  mmCleanup();
  try {
    if (lobbyId) {
      const docSnap = await db.collection('mp_lobbies').doc(lobbyId).get();
      if (docSnap.exists && docSnap.data().status === 'waiting') { await _mpDoJoin(docSnap, ''); return; }
    }
    // Fallback: hostId ile ara
    const snap = await db.collection('mp_lobbies')
      .where('hostId', '==', hostName).where('status', '==', 'waiting').where('isQuickMatch', '==', true).limit(1).get();
    if (!snap.empty) { await _mpDoJoin(snap.docs[0], ''); }
    else {
      const errEl = document.getElementById('mp-mm-error');
      if (errEl) errEl.textContent = lang==='en' ? 'Could not find lobby.' : 'Lobi bulunamadı.';
      setTimeout(mpShowMain, 2000);
    }
  } catch(e) {
    const errEl = document.getElementById('mp-mm-error');
    if (errEl) errEl.textContent = 'Katılım hatası: ' + e.message;
    setTimeout(mpShowMain, 2000);
  }
}

function mmCancel() {
  clearInterval(_mmInterval);
  mmCleanup();
  mpShowMain();
}

function mmCleanup() {
  clearInterval(_mmInterval); _mmInterval = null;
  if (_mmUnsubscribe) { _mmUnsubscribe(); _mmUnsubscribe = null; }
  if (_mmDocRef) { _mmDocRef.delete().catch(()=>{}); _mmDocRef = null; }
}

function mpShowBrowse() {
  ['mp-screen-main','mp-screen-create','mp-screen-join','mp-screen-lobby-host','mp-screen-lobby-guest'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById('mp-screen-browse').style.display = 'block';
  document.getElementById('mp-browse-error').textContent = '';
  document.getElementById('mp-browse-pw-box').style.display = 'none';
  _mpBrowsePendingDoc = null;
  mpRefreshBrowse();
}

async function mpRefreshBrowse() {
  const listEl = document.getElementById('mp-lobby-list');
  const emptyEl = document.getElementById('mp-browse-empty');
  listEl.innerHTML = '<div class="mp-lobby-empty">Aranıyor…</div>';
  document.getElementById('mp-browse-error').textContent = '';
  document.getElementById('mp-browse-pw-box').style.display = 'none';
  _mpBrowsePendingDoc = null;
  if (!db) { listEl.innerHTML = '<div class="mp-lobby-empty">Bağlantı hatası</div>'; return; }
  try {
    const snap = await db.collection('mp_lobbies')
      .where('status', '==', 'waiting')
      .limit(20)
      .get();
    const modeEmoji = {world:'🌍', europe:'🇪🇺', turkey:'🇹🇷', landmark:'🏛️', flag:'🚩'};
    listEl.innerHTML = '';
    // Client-side sort + eski lobileri filtrele (30dk+)
    const now = Date.now();
    const docs = [];
    snap.forEach(doc => {
      const d = doc.data();
      if (now - (d.createdAt || 0) < 30 * 60 * 1000) docs.push(doc); // 30dk
    });
    docs.sort((a, b) => (b.data().createdAt || 0) - (a.data().createdAt || 0));
    if (!docs.length) { listEl.innerHTML = '<div class="mp-lobby-empty">Şu an açık lobi yok 😴</div>'; return; }
    docs.forEach(doc => {
      const d = doc.data();
      if (d.hostId === currentUser?.username) return; // kendi lobiyi gösterme
      const pCount = Object.keys(d.players || {}).length;
      const locked = d.isPrivate;
      const name   = d.lobbyName || d.code || '???';
      const mode   = modeEmoji[d.mode] || '🌍';
      const card   = document.createElement('div');
      card.className = 'mp-lobby-card' + (locked ? ' locked' : '');
      card.innerHTML =
        '<div><div class="mp-lobby-card-name">' + mode + ' ' + name + '</div>'
        + '<div class="mp-lobby-card-info">Host: ' + d.hostId + '</div></div>'
        + '<div class="mp-lobby-card-right">'
        + '<span class="mp-lobby-card-players">' + pCount + '/5</span>'
        + '<span class="mp-lobby-card-lock">' + (locked ? '🔒' : '🔓') + '</span>'
        + '</div>';
      card.onclick = () => mpBrowseSelectLobby(doc, locked);
      listEl.appendChild(card);
    });
    if (!listEl.children.length) listEl.innerHTML = '<div class="mp-lobby-empty">Katılabileceğin lobi yok</div>';
  } catch(e) {
    listEl.innerHTML = '<div class="mp-lobby-empty">Yükleme hatası: ' + e.message + '</div>';
  }
}

function mpBrowseSelectLobby(doc, locked) {
  document.getElementById('mp-browse-error').textContent = '';
  if (!locked) {
    // Doğrudan gir
    const btn = document.getElementById('mp-browse-refresh');
    btn.disabled = true;
    _mpDoJoin(doc, '').catch(e => {
      document.getElementById('mp-browse-error').textContent = e.message;
      btn.disabled = false;
    }).then(() => { btn.disabled = false; });
  } else {
    // Şifre kutusu aç
    _mpBrowsePendingDoc = doc;
    const d = doc.data();
    document.getElementById('mp-browse-pw-label').textContent = '🔒 "' + (d.lobbyName || d.code) + '" şifreli — şifreyi gir';
    document.getElementById('mp-browse-pw-input').value = '';
    document.getElementById('mp-browse-pw-box').style.display = 'block';
    document.getElementById('mp-browse-pw-input').focus();
  }
}

async function mpBrowseJoinWithPw() {
  if (!_mpBrowsePendingDoc) return;
  const pw = document.getElementById('mp-browse-pw-input').value.trim();
  const btn = document.querySelector('#mp-browse-pw-box .mp-btn');
  btn.disabled = true; btn.textContent = '…';
  try {
    await _mpDoJoin(_mpBrowsePendingDoc, pw);
  } catch(e) {
    document.getElementById('mp-browse-error').textContent = e.message;
    btn.disabled = false; btn.textContent = '✓ GİR';
  }
}

function mpBrowseCancelPw() {
  document.getElementById('mp-browse-pw-box').style.display = 'none';
  _mpBrowsePendingDoc = null;
}

function mpSubscribeLobby() {
  if (mpUnsubscribe) mpUnsubscribe();
  mpUnsubscribe = db.collection('mp_lobbies').doc(mpLobbyId).onSnapshot(snap => {
    if (!snap.exists) {
      // Lobi silindi — sadece guest'e mesaj göster
      if (mpIsHost) { mpCleanup(); return; }
      const wasPlaying = mpGameActive;
      const wasFlag = (gameMode === 'flag');
      mpCleanup();
      if (wasFlag) hideFlagScreen();
      else if (wasPlaying) { stopTimer(); document.getElementById('mp-live-scores').style.display='none'; }
      goToWelcome();
      setTimeout(() => {
        const msg = lang === 'en' ? 'Host left — lobby closed.' : 'Lobi sahibi ayrıldı, lobi kapatıldı.';
        const errEl = document.getElementById('mp-main-error');
        openMultiplayerMenu();
        if (errEl) { errEl.textContent = msg; setTimeout(() => { errEl.textContent = ''; }, 4000); }
      }, 200);
      return;
    }
    const prevLobby = mpLobby;
    mpLobby = snap.data();
    mpQuestions = mpLobby.questions;


    if (mpLobby.status === 'waiting') {
      // Sonuç ekranı açıksa kapat → lobi ekranına dön (Yeni Oyun sonrası)
      if (document.getElementById('mp-result-overlay').classList.contains('show')) {
        document.getElementById('mp-result-overlay').classList.remove('show');
        if (mpIsHost) mpShowLobbyHost(); else mpShowLobbyGuest();
      }
      mpUpdatePlayerList();
    } else if (mpLobby.status === 'playing' && !mpGameActive) {
      // Oyun ilk başlıyor
      mpStartMultiplayerGame();
    } else if (mpLobby.status === 'playing' && mpGameActive) {
      const newQ = mpLobby.currentQuestion || 0;
      const showScoresQ = mpLobby.showScores;
      const advanceAt = mpLobby.advanceAt || null;

      // showScores yazıldı → herkes skor tablosunu aç (-1 başlangıç değeri, atla)
      if (showScoresQ !== undefined && showScoresQ >= 0 && showScoresQ === state.questionIndex) {
        const betweenEl = document.getElementById('mp-between-overlay');
        if (!betweenEl.classList.contains('show')) {
          mpShowBetweenLeaderboard(advanceAt);
        }
      }

      // photoReadyAt geldi → herkes hazır, foto sayacı başlat
      const photoReadyAt = mpLobby.photoReadyAt;
      if (photoReadyAt && photoReadyAt.q === state.questionIndex && state.answered) {
        // Foto hâlâ gösteriliyorsa timestamp ile senkronize başlat
        const overlay = document.getElementById('landmark-photo-overlay');
        if (overlay.classList.contains('show')) {
          lpoStartAt(photoReadyAt.ts);
        }
      }

      // currentQuestion arttı → sonraki soruya geç (herkes, sadece ilerleme)
      if (newQ > state.questionIndex) {
        if (window._mpCountdownInterval) { clearInterval(window._mpCountdownInterval); window._mpCountdownInterval = null; }
        mpCancelAdvance();
        mpShowScoresWriting = false;
        mpAdvancing = false;
        // Foto overlay varsa kapat
        if (_lpoTimer) { clearTimeout(_lpoTimer); _lpoTimer = null; }
        document.getElementById('landmark-photo-overlay').classList.remove('show');
        state.answered = false;
        _lpoOnDone = null;
        document.getElementById('mp-between-overlay').classList.remove('show');
        state.questionIndex = newQ;
        mpLoadQuestion();
      }

      // Host: photoReady alanını kontrol et — herkes hazırsa photoReadyAt yaz
      if (mpIsHost && gameMode === 'landmark') {
        const photoReady = mpLobby.photoReady || {};
        const qIdx = state.questionIndex;
        const players = Object.keys(mpLobby.players || {});
        const allPhotoReady = players.length > 0 && players.every(p => photoReady[p] === qIdx);
        if (allPhotoReady && (!mpLobby.photoReadyAt || mpLobby.photoReadyAt.q !== qIdx)) {
          db.collection('mp_lobbies').doc(mpLobbyId).update({
            photoReadyAt: { q: qIdx, ts: Date.now() }
          }).catch(e => console.error('photoReadyAt write error', e));
        }
      }

      // Skor tablosu açıksa içeriği güncelle
      if (document.getElementById('mp-between-overlay').classList.contains('show')) {
        mpRefreshBetweenScores();
      }
      mpUpdateLiveScores();
      // Bayrak modu güncelleme
      if (gameMode === 'flag') mpHandleFlagUpdate(mpLobby);

      // Bot maçında: bot cevap verince "herkes cevapladı" kontrolü yap
      if (mpLobby.isBot && mpGameActive && state.answered && mpLobby.showScores !== state.questionIndex) {
        const answered = mpLobby.answered || {};
        const players = Object.keys(mpLobby.players || {});
        const qIdx = state.questionIndex;
        const allAnswered = players.length > 0 && players.every(n => answered[n] === qIdx);
        if (allAnswered) {
          mpNextQuestion();
        }
      }
    } else if (mpLobby.status === 'finished') {
      document.getElementById('mp-between-overlay').classList.remove('show');
      mpGameActive = false;
      if (gameMode === 'flag') {
        if (flagState.nextCountdown) clearInterval(flagState.nextCountdown);
        hideFlagScreen();
        mpShowResults();
      } else {
        stopTimer();
        document.getElementById('mp-live-scores').classList.remove('show');
        mpShowResults();
      }
    }
  }, err => console.error('MP listener error:', err));
}

function mpShowLobbyHost() {
  // Lobi adını başlığa yaz
  const h2 = document.getElementById('mp-lobby-h2');
  if (h2 && mpLobby?.lobbyName) h2.textContent = '🏠 ' + mpLobby.lobbyName;
  // Lobi mod butonlarını senkronize et
  ['world','turkey','landmark','flag'].forEach(id => {
    const btn = document.getElementById('lobby-mode-'+id);
    if (btn) btn.classList.toggle('active', id === mpMode);
  });
  const labels = {world:'🌍 DÜNYA', europe:'🇪🇺 AVRUPA', turkey:'🇹🇷 TÜRKİYE', landmark:'🏛️ HARİKALAR', flag:'🚩 BAYRAKLAR'};
  const labelsEn = {world:'🌍 WORLD', europe:'🇪🇺 EUROPE', turkey:'🇹🇷 TURKEY', landmark:'🏛️ WONDERS', flag:'🚩 FLAGS'};
  const lbl = document.getElementById('lobby-mode-label');
  if (lbl) lbl.textContent = lang==='tr' ? (labels[mpMode]||mpMode) : (labelsEn[mpMode]||mpMode);
  ['mp-screen-main','mp-screen-create','mp-screen-join','mp-screen-lobby-guest'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById('mp-screen-lobby-host').style.display = 'block';
  // Şifreli lobide kodu göster, şifresiz lobide gizle
  const codeWrap = document.getElementById('mp-lobby-code-display');
  if (codeWrap) {
    if (mpLobby.isPrivate) {
      codeWrap.textContent = mpLobby.code;
      codeWrap.style.display = 'block';
    } else {
      codeWrap.style.display = 'none';
    }
  }
  const lobbySub = document.getElementById('mp-lobby-sub');
  if (lobbySub) {
    lobbySub.textContent = mpLobby.isPrivate
      ? (lang==='en' ? 'Share code or name with friends' : 'Kodu veya lobi adını arkadaşlarınla paylaş')
      : (lang==='en' ? 'Friends can find you in Active Lobbies' : 'Arkadaşların Aktif Lobiler\u2019den bulabilir');
  }
  mpUpdatePlayerList();
}

function mpShowLobbyGuest() {
  ['mp-screen-main','mp-screen-create','mp-screen-join','mp-screen-lobby-host'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById('mp-screen-lobby-guest').style.display = 'block';
  document.getElementById('mp-guest-sub').textContent = t('mpGuestSub', mpLobby.code, mpLobby.mode);
  mpUpdatePlayerList();
}

function mpUpdatePlayerList() {
  if (!mpLobby) return;
  const players = mpLobby.players || {};
  const playerArr = Object.values(players).sort((a,b) => a.joinedAt - b.joinedAt);
  const count = playerArr.length;

  // Host ekranı
  const hostList = document.getElementById('mp-host-player-list');
  const guestList = document.getElementById('mp-guest-player-list');
  const html = playerArr.map(p => `
    <div class="mp-player-row">
      <div class="mp-player-avatar">${p.name[0].toUpperCase()}</div>
      <div class="mp-player-name">${p.name}${p.name === mpLobby.hostId ? ' <span class="mp-player-host">HOST</span>' : ''}</div>
      <div class="mp-player-ready ready"></div>
    </div>`).join('');

  if (hostList) hostList.innerHTML = html;
  if (guestList) guestList.innerHTML = html;

  const statusText = t('mpPlayerCount', count, mpLobby.mode);
  const hostStatus = document.getElementById('mp-host-status');
  const guestStatus = document.getElementById('mp-guest-status');
  if (hostStatus) hostStatus.textContent = statusText;
  if (guestStatus) guestStatus.textContent = statusText;

  // Başlat butonu: min 2, max 5 kişi
  const startBtn = document.getElementById('mp-start-btn');
  if (startBtn) {
    startBtn.disabled = count < 2;
    startBtn.style.opacity = count < 2 ? '0.5' : '1';
    startBtn.textContent = t('mpStartBtn', count);
  }
}

function mpCopyCode() {
  if (!mpLobby) return;
  navigator.clipboard.writeText(mpLobby.code).then(() => {
    const el = document.getElementById('mp-lobby-code-display');
    const prev = el.textContent;
    el.textContent = t('mpCopied');
    setTimeout(() => { el.textContent = prev; }, 1200);
  }).catch(() => {});
}

async function mpStartGame() {
  if (!mpIsHost || !mpLobbyId) return;
  const playerCount = Object.keys(mpLobby.players || {}).length;
  if (playerCount < 2) { alert(t('mpErrMin2')); return; }

  try {
    // Firebase'den güncel mode'u oku (mpLobbySetMode ile değişmiş olabilir)
    const freshSnap = await db.collection('mp_lobbies').doc(mpLobbyId).get();
    const currentMode = freshSnap.exists ? (freshSnap.data().mode || mpMode || 'world') : (mpMode || 'world');
    mpMode = currentMode;

    // Moda göre taze sorular oluştur
    const questions = currentMode === 'turkey' ? pickTurkeyQuestions(MP_QUESTION_COUNT)
      : currentMode === 'europe' ? pickEuropeQuestions(MP_QUESTION_COUNT)
      : currentMode === 'landmark' ? pickLandmarkQuestions(MP_QUESTION_COUNT)
      : currentMode === 'flag' ? pickFlagQuestions(12)
      : pickQuestions(MP_QUESTION_COUNT);

    const questionsForFirebase = currentMode === 'flag'
      ? questions.map(q => ({tr: q.tr, en: q.en, flag: q.flag, code: q.code||'', atr: q.atr||[], aen: q.aen||[]}))
      : questions.map(q => ({name: q.name, name_en: q.name_en||'', country: q.country||'', city: q.city||'', lat: q.lat||0, lon: q.lon||0}));

    await db.collection('mp_lobbies').doc(mpLobbyId).update({
      status: 'playing',
      mode: currentMode,
      questions: questionsForFirebase,
      startedAt: Date.now(),
      currentQuestion: 0,
      showScores: -1,
      advanceAt: 0,
      photoReady: {},
      photoReadyAt: null,
      flagQuestion: 0,
      flagAnswered: {},
      flagStartAt: 0,
      scores: {},
      qscores: {}
    });
    // listener mpStartMultiplayerGame'i tetikleyecek
  } catch(e) { console.error('Start error:', e); }
}

async function mpStartMultiplayerGame() {
  if (mpGameActive) return;
  mpGameActive = true;
  mpCurrentQ = 0;
  mpMyScore = 0;
  mpQuestions = mpLobby.questions;
  mpMode = mpLobby.mode;

  // mode hâlâ undefined ise Firebase'den taze oku
  if (!mpMode) {
    try {
      const freshSnap = await db.collection('mp_lobbies').doc(mpLobbyId).get();
      if (freshSnap.exists) {
        const freshData = freshSnap.data();
        mpMode = freshData.mode || 'world';
        mpLobby = freshData;
        mpQuestions = freshData.questions;
      }
    } catch(e) { console.error('mpStartMultiplayerGame fresh read error:', e); }
  }
  if (!mpMode) mpMode = 'world'; // son güvenlik ağı

  // Modali kapat, oyunu başlat
  document.getElementById('mp-modal').classList.remove('open');
  document.getElementById('welcome-modal').style.display = 'none';

  // Oyun modunu ayarla
  gameMode = mpMode;

  // State'i multiplayer moduna al (seviye kavramı yok, düz 12 soru)
  state.level = 1;
  state.levelScore = 0;
  state.totalScore = 0;
  state.questionIndex = 0;
  state.questions = mpQuestions;
  state.answered = false;
  state.combo = 0;

  // Overlay'leri kapat
  const ov = document.getElementById('overlay');
  if (ov) { ov.classList.add('hidden'); ov.style.display = 'none'; }

  // Haritayı göster
  clearMarkers();
  if (gameMode === 'turkey') {
    document.getElementById('world-svg').style.display = 'none';
    document.getElementById('turkey-svg').style.display = 'block';
    document.getElementById('europe-svg').style.display = 'none';
    if (!turkeyMapLoaded) loadTurkeyMap();
  } else if (gameMode === 'europe') {
    document.getElementById('world-svg').style.display = 'none';
    document.getElementById('turkey-svg').style.display = 'none';
    document.getElementById('europe-svg').style.display = 'block';
    focusEuropeMap(false);
  } else {
    document.getElementById('world-svg').style.display = 'block';
    document.getElementById('turkey-svg').style.display = 'none';
    document.getElementById('europe-svg').style.display = 'none';
  }

  // Bayrak modu — ayrı ekran
  if (gameMode === 'flag') {
    // Lobby'deki sorulardan FLAG_COUNTRIES objelerini restore et
    // Firebase'de kod+tr+en+flag+atr+aen var — direkt kullan, atr/aen eksikse FLAG_COUNTRIES'ten tamamla
    const lobbyQs = (mpLobby.questions || []).map(q => {
      // code ile kesin eşleştir
      const found = q.code
        ? FLAG_COUNTRIES.find(c => c.code === q.code)
        : FLAG_COUNTRIES.find(c => c.en === q.en && c.tr === q.tr);
      if (found) return found; // orijinal objeyi kullan (atr/aen tam)
      // Yoksa Firebase verisini direkt kullan (atr/aen zaten var)
      return q;
    });
    flagState.questions = lobbyQs;
    flagState.qIndex    = 0;
    flagState.myScore   = 0;
    flagState.answered  = false;
    flagState.solo      = false;
    flagState._allAnsweredTriggered = false;
    showFlagScreen();
    flagLoadQuestion();
    // Bot maçı ise flag bot uygulamasını başlat
    if (mpLobby && mpLobby.isBot) {
      setTimeout(_startBotScoreApplication, 500);
    }
    return;
  }

  mpShowLiveScores();
  // Bot maçı ise bot skor uygulamasını başlat
  if (mpLobby && mpLobby.isBot) {
    setTimeout(_startBotScoreApplication, 500);
  }
  mpLoadQuestion();
}

function mpShowLiveScores() {
  if (!mpLobby) return;
  const liveEl = document.getElementById('mp-live-scores');
  liveEl.classList.add('show');
  mpUpdateLiveScores();
}

function mpUpdateLiveScores() {
  if (!mpLobby) return;
  const liveEl = document.getElementById('mp-live-scores');
  const players = mpLobby.players || {};
  const scores = mpLobby.scores || {};
  const playerArr = Object.values(players).sort((a,b) => {
    const sa = scores[a.name] || 0;
    const sb = scores[b.name] || 0;
    return sb - sa;
  });
  liveEl.innerHTML = playerArr.map(p => {
    const isMe = p.name === currentUser.username;
    const sc = scores[p.name] || 0;
    return `<div class="mp-live-player${isMe?' me':''}">
      <div class="lp-name">${isMe ? '⭐'+p.name : p.name}</div>
      <div class="lp-score">${sc}</div>
    </div>`;
  }).join('<div style="color:#1e2d45;font-size:.8rem;">|</div>');
}

function mpLoadQuestion() {
  if (!mpGameActive) return;
  state.answered = false;
  clearMarkers();
  downX = null; downY = null;

  // Bir önceki sorudan kalan toast ve DEVAM butonunu temizle
  const toast = document.getElementById('result-toast');
  toast.classList.remove('show');
  toast.style.display = 'none';
  const nextBtn = document.getElementById('btn-next-q');
  nextBtn.style.display = 'none'; // MP'de buton yok — geçiş otomatik

  const city = state.questions[state.questionIndex];
  if (!city) { mpEndGame(); return; }

  if (gameMode === 'turkey') {
    document.getElementById('city-name').textContent = city.name.toUpperCase();
    document.getElementById('city-country').textContent = (city.city || '').toUpperCase();
    document.getElementById('question-text').textContent = t('markDistrict');
  } else if (gameMode === 'landmark') {
    const lname = lang === 'en' ? (city.name_en || city.name) : city.name;
    document.getElementById('city-name').textContent = lname.toUpperCase();
    document.getElementById('city-country').textContent = '';
    document.getElementById('question-text').textContent = t('markLandmark');
  } else {
    document.getElementById('city-name').textContent = cityDisplayName(city).toUpperCase();
    document.getElementById('city-country').textContent = countryDisplayName(city).toUpperCase();
    document.getElementById('question-text').textContent = t('markCity');
  }

  // Topbar güncelle
  document.getElementById('level-badge').textContent = '⚔️ MULTI';
  document.getElementById('score-display').textContent = mpMyScore;
  document.getElementById('target-display').textContent = `${state.questionIndex + 1}/${state.questions.length}`;
  document.getElementById('progress-bar-fill').style.width = ((state.questionIndex / state.questions.length) * 100) + '%';
  // Hamburger menüyü gizle
  const menuBtn = document.getElementById('btn-main-menu');
  if (menuBtn) menuBtn.style.display = 'none';
  document.getElementById('progress-text').textContent = `${lang==='tr' ? 'Soru' : 'Q'} ${state.questionIndex + 1} / ${state.questions.length}`;

  // Q dots
  const dots = document.getElementById('q-dots');
  dots.innerHTML = '';
  for (let i = 0; i < state.questions.length; i++) {
    const d = document.createElement('div');
    d.className = 'q-dot' + (i < state.questionIndex ? ' done' : i === state.questionIndex ? ' active' : '');
    dots.appendChild(d);
  }

  if (gameMode !== 'turkey' && gameMode !== 'europe') {
    svgEl.transition().duration(200).call(zoomBehavior.transform, d3.zoomIdentity);
  }
  if (gameMode === 'europe' && europeZoom) {
    europeSvgEl.transition().duration(200).call(europeZoom.transform, d3.zoomIdentity);
  }
  if (gameMode === 'landmark') {
    const _mpCity = state.questions[state.questionIndex];
    if (_mpCity) {
      showLandmarkPhoto(_mpCity, () => startTimer());
    } else {
      startTimer();
    }
  } else {
    startTimer();
  }
}

// Multiplayer'da cevap verildiğinde skoru Firebase'e yaz
async function mpSubmitAnswer(finalScore) {
  mpMyScore += finalScore;
  if (!mpLobbyId) return;
  const qIdx = state.questionIndex;
  try {
    await db.collection('mp_lobbies').doc(mpLobbyId).update({
      [`scores.${currentUser.username}`]: mpMyScore,
      [`qscores.${currentUser.username}.q${qIdx}`]: finalScore,
      [`answered.${currentUser.username}`]: qIdx
    });
  } catch(e) { console.error('Score update error:', e); }
  mpUpdateLiveScores();

  // Herkes cevapladı mı? → erken geç (her oyuncu kontrol eder, ilk yazan kazanır)
  if (mpLobbyId) {
    try {
      const freshSnap = await db.collection('mp_lobbies').doc(mpLobbyId).get();
      if (freshSnap.exists) {
        const freshData = freshSnap.data();
        const players = freshData.players || {};
        const answered = freshData.answered || {};
        const playerNames = Object.keys(players);
        const allAnswered = playerNames.length > 0 &&
          playerNames.every(name => answered[name] === qIdx);
        if (allAnswered && freshData.showScores !== qIdx) {
          stopTimer();
          state.answered = true;
          mpNextQuestion();
        }
      }
    } catch(e) { console.error('Early advance check error:', e); }
  }
}

let mpShowScoresWriting = false; // aynı anda birden fazla yazımı engelle

function mpNextQuestion() {
  if (!mpGameActive) return;
  if (document.getElementById('mp-between-overlay').classList.contains('show')) return;
  if (mpShowScoresWriting) return;
  if (!mpLobbyId) return;

  downX = null; downY = null;
  stopTimer();
  const toast = document.getElementById('result-toast');
  toast.classList.remove('show');
  toast.style.display = 'none';

  const qIdx = state.questionIndex;
  const advanceAt = Date.now() + 5000;

  mpShowScoresWriting = true;
  db.collection('mp_lobbies').doc(mpLobbyId).get().then(snap => {
    if (!snap.exists) { mpShowScoresWriting = false; return; }
    const data = snap.data();
    if (data.showScores === qIdx) { mpShowScoresWriting = false; return; }
    return db.collection('mp_lobbies').doc(mpLobbyId).update({
      showScores: qIdx,
      advanceAt: advanceAt
    });
  }).catch(e => console.error('showScores write error:', e))
    .finally(() => { mpShowScoresWriting = false; });
}

let mpAdvanceTimer = null;

function mpCancelAdvance() {
  if (mpAdvanceTimer) { clearTimeout(mpAdvanceTimer); mpAdvanceTimer = null; }
}

let mpAdvancing = false; // çift advance engelleyici

async function mpHostAdvance() {
  if (!mpLobbyId) return;
  if (mpAdvancing) return;
  mpCancelAdvance();
  mpAdvancing = true;

  const nextQ = state.questionIndex + 1;
  const isFinal = nextQ >= state.questions.length;
  document.getElementById('mp-between-overlay').classList.remove('show');

  try {
    if (isFinal) {
      await mpEndGame();
    } else {
      const snap = await db.collection('mp_lobbies').doc(mpLobbyId).get();
      if (snap.exists && (snap.data().currentQuestion || 0) < nextQ) {
        await db.collection('mp_lobbies').doc(mpLobbyId).update({
          currentQuestion: nextQ,
          showScores: -1,
          advanceAt: 0,
          status: 'playing',
          answeredReset: Date.now(),
          photoReady: {},
          photoReadyAt: null
        });
      }
    }
  } catch(e) { console.error('Advance error:', e); }
  finally { mpAdvancing = false; }
}

function mpRenderBetweenList(qIdx) {
  const scores = mpLobby.scores || {};
  const qscores = mpLobby.qscores || {};
  const players = mpLobby.players || {};
  const playerArr = Object.values(players).sort((a,b) =>
    (scores[b.name]||0) - (scores[a.name]||0)
  );
  const rankEmojis = ['🥇','🥈','🥉'];
  return playerArr.map((p, i) => {
    const isMe = p.name === currentUser.username;
    const total = scores[p.name] || 0;
    const thisQ = (qscores[p.name] && qscores[p.name][`q${qIdx}`] !== undefined)
      ? qscores[p.name][`q${qIdx}`] : '—';
    const thisQStr = thisQ === '—' ? t('mpNoAns') : t('mpThisQ', thisQ);
    return `<div class="mp-bq-row${isMe?' me':''}">
      <div class="mp-bq-rank">${rankEmojis[i] || '#'+(i+1)}</div>
      <div class="mp-bq-name" style="${isMe?'color:var(--accent);font-weight:700':''}">${p.name}${isMe?' '+t('mpYou'):''}</div>
      <div class="mp-bq-scores">
        <div class="mp-bq-total">${total.toLocaleString()}</div>
        <div class="mp-bq-this">${thisQStr}</div>
      </div>
    </div>`;
  }).join('');
}

function mpRefreshBetweenScores() {
  if (!mpLobby) return;
  const qIdx = state.questionIndex;
  document.getElementById('mp-bq-list').innerHTML = mpRenderBetweenList(qIdx);
}

function mpShowBetweenLeaderboard(advanceAt) {
  if (!mpLobby) return;
  const qIdx = state.questionIndex;
  const isFinal = (qIdx + 1) >= state.questions.length;
  const qNum = qIdx + 1;
  const total = state.questions.length;

  document.getElementById('mp-bq-list').innerHTML = mpRenderBetweenList(qIdx);
  document.getElementById('mp-bq-title').textContent = isFinal ? t('mpBetweenFinal') : t('mpBetweenQ', qNum);
  document.getElementById('mp-bq-sub').textContent = isFinal ? t('mpBetweenFinalSub', total) : t('mpBetweenSub', qNum, total);

  const nextBtn = document.getElementById('mp-bq-next-btn');
  const waitMsg = document.getElementById('mp-bq-waiting');
  nextBtn.style.display = 'none';
  waitMsg.style.display = 'block';

  // Geri sayım: advanceAt timestamp'e göre senkronize
  if (window._mpCountdownInterval) { clearInterval(window._mpCountdownInterval); window._mpCountdownInterval = null; }

  const target = advanceAt || (Date.now() + 5000);
  const updateCountdown = () => {
    const remaining = Math.ceil((target - Date.now()) / 1000);
    if (remaining > 0) {
      waitMsg.textContent = isFinal
        ? (lang==='tr' ? 'Sonuçlar hesaplanıyor…' : 'Calculating results…')
        : (lang==='tr' ? `Sonraki soru ${remaining} saniye sonra…` : `Next question in ${remaining} seconds…`);
    } else {
      waitMsg.textContent = isFinal
        ? (lang==='tr' ? 'Sonuçlar hesaplanıyor…' : 'Calculating results…')
        : (lang==='tr' ? 'Geçiliyor…' : 'Moving on…');
      clearInterval(window._mpCountdownInterval);
      window._mpCountdownInterval = null;
    }
  };
  updateCountdown();
  window._mpCountdownInterval = setInterval(updateCountdown, 250);

  // 5 sn sonra hepsi ilerler ama sadece biri Firebase'e yazar (mpHostAdvance içinde kontrol var)
  mpCancelAdvance();
  const delay = Math.max(0, target - Date.now());
  mpAdvanceTimer = setTimeout(() => { mpAdvanceTimer = null; mpHostAdvance(); }, delay);

  document.getElementById('mp-between-overlay').classList.add('show');
}

async function mpEndGame() {
  if (!mpLobbyId) return;
  try {
    const snap = await db.collection('mp_lobbies').doc(mpLobbyId).get();
    if (!snap.exists || snap.data().status === 'finished') return;
    await db.collection('mp_lobbies').doc(mpLobbyId).update({
      status: 'finished',
      finishedAt: Date.now()
    });
  } catch(e) { console.error('Finish error:', e); }
}

let _mpResultsShownForLobby = null; // aynı lobi için iki kez çalışmasın

function mpShowResults() {
  // Aynı lobi için iki kez çalışma
  if (_mpResultsShownForLobby && _mpResultsShownForLobby === mpLobbyId) return;
  _mpResultsShownForLobby = mpLobbyId;

  // Hamburger menüyü geri getir
  const menuBtn = document.getElementById('btn-main-menu');
  if (menuBtn) menuBtn.style.display = '';
  if (!mpLobby) return;
  // MP maç skorunu liderlik tablosuna kaydet
  if (currentUser) {
    const myMpScore = (mpLobby.scores || {})[currentUser.username] || 0;
    if (myMpScore > 0) {
      const prevMode = gameMode;
      gameMode = mpLobby.mode || 'world';
      saveScore(myMpScore, 0).catch(()=>{});
      gameMode = prevMode;
    }
  }
  const scores = mpLobby.scores || {};
  const qscores = mpLobby.qscores || {};
  const players = mpLobby.players || {};
  const totalQ = (mpLobby.questions || []).length;
  const lastQIdx = totalQ - 1;

  const playerArr = Object.values(players).sort((a,b) =>
    (scores[b.name]||0) - (scores[a.name]||0)
  );
  const rankEmojis = ['🥇','🥈','🥉'];
  const resultList = document.getElementById('mp-result-list');
  resultList.innerHTML = playerArr.map((p, i) => {
    const isMe = p.name === currentUser.username;
    const total = scores[p.name] || 0;
    // Son sorudan puan bul
    let lastQ = '';
    for (let qi = totalQ - 1; qi >= 0; qi--) {
      if (qscores[p.name] && qscores[p.name][`q${qi}`] !== undefined) {
        lastQ = `+${qscores[p.name][`q${qi}`]}`;
        break;
      }
    }
    const isWinner = i === 0;
    return `<div class="mp-result-row${isWinner ? ' winner' : ''}">
      <div class="mp-result-rank">${rankEmojis[i] || '#'+(i+1)}</div>
      <div class="mp-result-name" style="${isMe?'color:var(--accent);font-weight:700':''}">${p.name}${isMe?' '+t('mpYou'):''}</div>
      <div class="mp-bq-scores">
        <div class="mp-result-score">${total.toLocaleString()}</div>
        ${lastQ ? `<div style="font-size:.72rem;color:var(--muted);text-align:right;">${lastQ}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  const winner = playerArr[0];
  const isIWinner = winner && winner.name === currentUser.username;
  const winnerLabel = gameMode === 'flag'
    ? (isIWinner
        ? (lang==='en' ? '🏆 YOU WIN!' : '🏆 SEN KAZANDIN!')
        : (lang==='en' ? `🏆 Winner: ${winner?.name||'—'}` : `🏆 Kazanan: ${winner?.name||'—'}`))
    : (isIWinner ? t('mpYouWin') : t('mpWinner', winner ? winner.name : '—'));
  document.getElementById('mp-result-title').textContent = winnerLabel;

  // Butonlar: Rastgele eşleşme → Yeniden Eşleştir + Ana Menü | Normal lobi → Yeni Oyun + Ana Menü
  const resultBtns = document.getElementById('mp-result-btns');
  if (resultBtns) {
    if (mpLobby && mpLobby.isQuickMatch) {
      // Rastgele eşleşme (bot dahil): Yeniden Eşleştir + Ana Menü
      resultBtns.innerHTML =
        '<button type="button" class="mp-btn" onclick="mpRematch()" style="flex:1">' + (lang==='en'?'⚡ REMATCH':'⚡ YENİDEN EŞLEŞTİR') + '</button>'
        + '<button type="button" class="mp-btn secondary" onclick="mpBackToMenu()" style="flex:1">' + (lang==='en'?'MENU':'ANA MENÜ') + '</button>';
    } else {
      resultBtns.innerHTML = mpIsHost
        ? '<button type="button" class="mp-btn" onclick="mpPlayAgain()" style="flex:1">' + (lang==='en'?'▶ PLAY AGAIN':'▶ YENİ OYUN') + '</button>'
          + '<button type="button" class="mp-btn secondary" onclick="mpBackToMenu()" style="flex:1">' + (lang==='en'?'MENU':'ANA MENÜ') + '</button>'
        : '<button type="button" class="mp-btn secondary" onclick="mpBackToMenu()">' + (lang==='en'?'MENU':'ANA MENÜ') + '</button>';
    }
  }
  document.getElementById('mp-result-overlay').classList.add('show');

  // Rank güncelle (sadece rastgele eşleşme lobilerinde)
  const rankChangeEl = document.getElementById('mp-rank-change');
  if (rankChangeEl) rankChangeEl.innerHTML = '';
  if (mpLobby && mpLobby.isQuickMatch) {
    const scores = mpLobby.scores || {};
    const playerArr2 = Object.keys(scores).sort((a,b) => (scores[b]||0) - (scores[a]||0));
    const myRank = playerArr2.indexOf(currentUser.username);
    const won = myRank === 0;
    updateRankAfterMatch(won, mpLobby.mode || 'world').then(result => {
      if (!rankChangeEl) return;
      const { oldRank, newRank, delta, games, placed, newElo, oldElo } = result;

      if (games <= RANK_PLACEMENT_GAMES) {
        // Yerleşme maçı
        if (placed) {
          // Yerleşim tamamlandı — büyük modal göster
          rankChangeEl.innerHTML = getRankCardHTML(newElo);
          setTimeout(() => showRankUpModal('placed', null, newElo, delta), 600);
        } else {
          const remaining = RANK_PLACEMENT_GAMES - games;
          rankChangeEl.innerHTML = `<div style="color:var(--muted);font-size:.82rem;margin-top:6px">
            ${lang==='en'?'Placement match':'Yerleşme maçı'} ${games}/${RANK_PLACEMENT_GAMES}
            &nbsp;·&nbsp; ${remaining} ${lang==='en'?'left':'kaldı'}
          </div>`;
        }
      } else {
        // Normal maç — rank değişimi
        const sign = delta >= 0 ? '+' : '';
        if (newRank && oldRank && newRank.key !== oldRank.key) {
          const up = RANK_TIERS.findIndex(t=>t.key===newRank.key) > RANK_TIERS.findIndex(t=>t.key===oldRank.key);
          // Sonuç ekranına küçük rank kartı koy
          rankChangeEl.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:6px">
            <span class="rank-badge ${getRankClass(oldElo)}">${getRankEmoji(oldElo)} ${getRankLabel(oldElo,lang)}</span>
            <span style="color:var(--accent);font-size:1.2rem">${up?'→':'→'}</span>
            <span class="rank-badge ${getRankClass(newElo)}">${getRankEmoji(newElo)} ${getRankLabel(newElo,lang)}</span>
          </div>`;
          // Büyük rank modal'ı biraz gecikmeli göster
          setTimeout(() => showRankUpModal(up ? 'up' : 'down', oldElo, newElo, delta), 700);
        } else {
          // Aynı rank, sadece elo değişimi
          const cls = delta >= 0 ? 'rank-up' : 'rank-down';
          const eloIcon = delta >= 0 ? '▲' : '▼';
          rankChangeEl.innerHTML = `<div class="${cls}" style="font-size:.9rem;margin-top:6px">
            ${eloIcon} ${sign}${delta} ELO
            &nbsp;·&nbsp;
            <span class="rank-badge ${getRankClass(newElo)}">${getRankEmoji(newElo)} ${getRankLabel(newElo,lang)}</span>
          </div>`;
        }
      }
    });
  }
} // end mpShowResults

// ── Rank atlama / yerleşim modali ──────────────────────────────
function showRankUpModal(type, oldElo, newElo, delta) {
  const modal   = document.getElementById('rank-up-modal');
  const titleEl = document.getElementById('rup-title');
  const subEl   = document.getElementById('rup-sub');
  const cardsEl = document.getElementById('rup-cards');
  const closeBtn= document.getElementById('rank-up-close');
  if (!modal) return;

  if (type === 'placed') {
    titleEl.textContent = lang==='en' ? '🎉 PLACEMENT COMPLETE!' : '🎉 YERLEŞİM TAMAMLANDI!';
    titleEl.style.color = '#f0a500';
    subEl.textContent   = lang==='en' ? 'Your starting rank:' : 'Başlangıç rankın:';
    cardsEl.innerHTML   = getRankCardHTML(newElo);
    closeBtn.textContent= lang==='en' ? 'LET\'S GO!' : 'HARIKA!';
  } else if (type === 'up') {
    titleEl.textContent = lang==='en' ? '⬆ RANK UP!' : '⬆ RANK ATLADINIZ!';
    titleEl.style.color = '#4caf50';
    subEl.textContent   = lang==='en' ? `+${delta} ELO — New rank:` : `+${delta} ELO — Yeni rankın:`;
    cardsEl.innerHTML   = getRankCardHTML(oldElo) + '<div class="rup-arrow">→</div>' + getRankCardHTML(newElo);
    closeBtn.textContent= lang==='en' ? 'AWESOME!' : 'SÜPER!';
  } else if (type === 'down') {
    titleEl.textContent = lang==='en' ? '⬇ RANK DOWN' : '⬇ RANK DÜŞTÜNÜZ';
    titleEl.style.color = '#f44336';
    subEl.textContent   = lang==='en' ? `${delta} ELO — New rank:` : `${delta} ELO — Yeni rankın:`;
    cardsEl.innerHTML   = getRankCardHTML(oldElo) + '<div class="rup-arrow" style="color:#f44336">→</div>' + getRankCardHTML(newElo);
    closeBtn.textContent= lang==='en' ? 'GOT IT' : 'TAMAM';
  }

  modal.classList.add('show');
}

function closeRankUpModal() {
  const modal = document.getElementById('rank-up-modal');
  if (modal) modal.classList.remove('show');
}

async function mpPlayAgain() {
  document.getElementById('mp-result-overlay').classList.remove('show');
  if (typeof hideFlagScreen === 'function') hideFlagScreen();
  // Overlay'leri temizle
  document.getElementById('mp-between-overlay').classList.remove('show');
  const menuBtn = document.getElementById('btn-main-menu');
  if (menuBtn) menuBtn.style.display = '';
  // State sıfırla
  mpGameActive = false;
  mpCurrentQ = 0;
  mpMyScore = 0;
  _mpResultsShownForLobby = null; // guard sıfırla — yeni oyun başlayabilsin
  if (mpIsHost && mpLobbyId) {
    try {
      // Mode'u taze oku
      const freshSnap = await db.collection('mp_lobbies').doc(mpLobbyId).get();
      const currentMode = freshSnap.exists ? (freshSnap.data().mode || mpMode || 'world') : mpMode;
      mpMode = currentMode;
      const questions = currentMode === 'turkey' ? pickTurkeyQuestions(MP_QUESTION_COUNT)
        : currentMode === 'europe' ? pickEuropeQuestions(MP_QUESTION_COUNT)
        : currentMode === 'landmark' ? pickLandmarkQuestions(MP_QUESTION_COUNT)
        : currentMode === 'flag' ? pickFlagQuestions(12)
        : pickQuestions(MP_QUESTION_COUNT);
      const questionsForFirebase = currentMode === 'flag'
        ? questions.map(q => ({tr:q.tr,en:q.en,flag:q.flag,code:q.code||'',atr:q.atr||[],aen:q.aen||[]}))
        : questions.map(q => ({name:q.name,name_en:q.name_en||'',country:q.country||'',city:q.city||'',lat:q.lat||0,lon:q.lon||0}));
      await db.collection('mp_lobbies').doc(mpLobbyId).update({
        status: 'waiting',
        mode: currentMode,
        questions: questionsForFirebase,
        scores: {}, qscores: {}, answered: {},
        flagAnswered: {}, flagQuestion: 0, flagStartAt: 0,
        flagShowScores: -1, currentQuestion: 0, showScores: -1,
      });
      mpQuestions = questions;
      mpShowLobbyHost();
    } catch(e) { console.error('playAgain error', e); mpBackToMenu(); }
  } else if (!mpIsHost && mpLobbyId) {
    // Guest: sadece result overlay'i kapat, lobi ekranına geç
    mpShowLobbyGuest();
  }
}

function mpBackToMenu() {
  document.getElementById('mp-result-overlay').classList.remove('show');
  document.getElementById('mp-between-overlay').classList.remove('show');
  if (typeof hideFlagScreen === 'function') hideFlagScreen();
  const menuBtn = document.getElementById('btn-main-menu');
  if (menuBtn) menuBtn.style.display = '';
  mpCleanup();
  goToWelcome();
}

function mpRematch() {
  // Mevcut modu hatırla, temizle, matchmaking ekranına geri dön
  const prevMode = (mpLobby && mpLobby.mode) || _mmMode || 'world';
  document.getElementById('mp-result-overlay').classList.remove('show');
  document.getElementById('mp-between-overlay').classList.remove('show');
  if (typeof hideFlagScreen === 'function') hideFlagScreen();
  const menuBtn = document.getElementById('btn-main-menu');
  if (menuBtn) menuBtn.style.display = '';
  mpCleanup();
  goToWelcome();
  // Welcome kapandıktan sonra multiplayer menüsünü aç
  setTimeout(() => {
    openMultiplayerMenu();
    // Matchmaking ekranına geç, önceki mod seçili olsun
    _mmMode = prevMode;
    mpShowMatchmaking();
    // Otomatik aramayı başlat
    mmStartSearch();
  }, 150);
}

async function mpLeaveLobby() {
  if (!mpLobbyId) { mpCleanup(); closeMultiplayerMenu(); return; }
  try {
    if (mpIsHost) {
      // Host ayrılırsa lobi silinir
      await db.collection('mp_lobbies').doc(mpLobbyId).delete();
    } else {
      await db.collection('mp_lobbies').doc(mpLobbyId).update({
        [`players.${currentUser.username}`]: firebase.firestore.FieldValue.delete()
      });
    }
  } catch(e) { console.error('Leave error:', e); }
  mpCleanup();
  mpShowMain();
}

function mpCleanup() {
  _mpResultsShownForLobby = null;
  if (_botApplyInterval) { clearInterval(_botApplyInterval); _botApplyInterval = null; }
  if (mpUnsubscribe) { mpUnsubscribe(); mpUnsubscribe = null; }
  if (typeof mpCancelAdvance === 'function') mpCancelAdvance();
  if (window._mpCountdownInterval) { clearInterval(window._mpCountdownInterval); window._mpCountdownInterval = null; }
  mpLobbyId = null;
  mpLobby = null;
  mpIsHost = false;
  mpGameActive = false;
  mpMyScore = 0;
  mpCurrentQ = 0;
  mpQuestions = [];
  document.getElementById('mp-live-scores').classList.remove('show');
  document.getElementById('mp-between-overlay').classList.remove('show');
}

// ===== MULTİPLAYER: handleClickAtLonLat VE handleMapClick'İ OVERRIDE ET =====
// Multiplayer modundayken farklı nextQuestion çağır

const _origHandleClickAtLonLat = handleClickAtLonLat;
window.handleClickAtLonLat = function(lon, lat) {
  if (!mpGameActive) { _origHandleClickAtLonLat(lon, lat); return; }
  if (state.answered) return;
  state.answered = true;
  stopTimer();

  const city = state.questions[state.questionIndex];
  const km = Math.round(haversine(lat, lon, city.lat, city.lon));
  const baseScore = gameMode === 'turkey' ? distanceToScoreTurkey(km) : distanceToScore(km);
  const timeMult = getTimeMult();
  const finalScore = Math.round(baseScore * timeMult);

  const gPos = addMarker(lat, lon, 'marker-guess');
  const rPos = addMarker(city.lat, city.lon, 'marker-real');
  addLine(gPos.x, gPos.y, rPos.x, rPos.y);

  mpSubmitAnswer(finalScore);

  const dLabel = gameMode === 'turkey' ? `${city.name}, ${city.city}` : `${cityDisplayName(city)}, ${countryDisplayName(city)}`;
  const toast = document.getElementById('result-toast');
  toast.style.display = 'flex';
  document.getElementById('toast-score').textContent = `+${finalScore}`;
  document.getElementById('toast-score').style.color = finalScore > 500 ? 'var(--green)' : finalScore > 200 ? 'var(--accent)' : 'var(--red)';
  document.getElementById('toast-dist').textContent = `${dLabel} — ${km.toLocaleString()} km`;
  toast.classList.add('show');

  // Cevap verildi, mpSubmitAnswer herkesin cevapladığını kontrol edecek

  // Zoom
  const midLat = (lat + city.lat) / 2, midLon = (lon + city.lon) / 2;
  const mProj = (gameMode === 'turkey' && window.turkeyProj) ? window.turkeyProj
    : (gameMode === 'europe' && europeProj) ? europeProj
    : projection;
  const [mx, my] = mProj([midLon, midLat]);
  const cont = document.getElementById('map-container');
  const W = cont.clientWidth, H = cont.clientHeight;
  const zTarget = Math.min(4, Math.max(1.5, 600 / Math.max(km, 50)));
  const tx = W / 2 - mx * zTarget;
  const ty = H / 2 - my * zTarget;
  if (gameMode === 'turkey' && window.turkeyZoom) {
    d3.select('#turkey-svg').transition().duration(700).call(window.turkeyZoom.transform, d3.zoomIdentity.translate(tx, ty).scale(zTarget));
  } else if (gameMode === 'europe' && europeZoom) {
    europeSvgEl.transition().duration(700).call(europeZoom.transform, d3.zoomIdentity.translate(tx, ty).scale(zTarget));
  } else {
    svgEl.transition().duration(700).call(zoomBehavior.transform, d3.zoomIdentity.translate(tx, ty).scale(zTarget));
  }
};

// handleMapClick için de aynı şeyi yap
const _origHandleMapClick = handleMapClick;
window.handleMapClick = function(evt) {
  if (!mpGameActive) { _origHandleMapClick(evt); return; }
  if (state.answered) return;
  if (gameMode === 'turkey') return; // turkey kendi click handler'ı var
  if (gameMode === 'europe') return; // europe kendi bindMapTapHandlers'ı var
  if (!evt || (!evt.clientX && !evt.changedTouches)) return;

  if (evt.changedTouches) {
    evt.preventDefault();
    const touch = evt.changedTouches[0];
    evt.clientX = touch.clientX;
    evt.clientY = touch.clientY;
  }

  let px, py;
  try { [px, py] = d3.pointer(evt, svgEl.node()); }
  catch(e) {
    const rect = svgEl.node().getBoundingClientRect();
    px = evt.clientX - rect.left;
    py = evt.clientY - rect.top;
  }
  const bx = (px - currentTransform.x) / currentTransform.k;
  const by = (py - currentTransform.y) / currentTransform.k;
  const result = projection.invert([bx, by]);
  if (!result || isNaN(result[0]) || isNaN(result[1])) return;
  const [lon, lat] = result;
  if (lon < -180 || lon > 180 || lat < -90 || lat > 90) return;

  handleClickAtLonLat(lon, lat);
};

// nextQuestion override
const _origNextQuestion = nextQuestion;
window.nextQuestion = function() {
  // MP'de DEVAM butonu gizli — klavye kısayolu da çalışmasın
  if (mpGameActive) return;
  _origNextQuestion();
};

// mp-join-code için enter key
document.addEventListener('DOMContentLoaded', () => {
  const joinInput = document.getElementById('mp-join-code');
  if (joinInput) joinInput.addEventListener('keydown', e => { if (e.key === 'Enter') mpJoinLobby(); });
});

// iOS güvenilir buton fix — onclick yerine touchend + click ikisi birden
// Bu pattern iOS Safari'de butonların çalışmaması sorununu çözer
(function() {
  function iosFix(id, fn) {
    const el = document.getElementById(id);
    if (!el) return;
    // Çift tetiklenmeyi önle
    let lastTouch = 0;
    el.addEventListener('touchend', function(e) {
      const now = Date.now();
      if (now - lastTouch < 400) return; // debounce
      lastTouch = now;
      e.preventDefault();
      fn();
    }, { passive: false });
  }

  document.addEventListener('DOMContentLoaded', function() {
    // Auth ekranı
    iosFix('auth-lang-tr', () => setLang('tr'));
    iosFix('auth-lang-en', () => setLang('en'));
    // Welcome ekranı
    iosFix('btn-play-world',    () => welcomeStart('world'));
    iosFix('btn-play-europe',   () => welcomeStart('europe'));
    iosFix('btn-play-turkey',   () => welcomeStart('turkey'));
    iosFix('btn-play-landmark', () => welcomeStart('landmark'));
    iosFix('btn-multiplayer',   () => openMultiplayerMenu());
    iosFix('btn-welcome-lb',    () => showLeaderboard('welcome'));
    iosFix('btn-options-welcome', () => openOptions('welcome'));
    iosFix('btn-welcome-logout',  () => authLogout());
    // Ana menü
    iosFix('mm-btn-world',       () => mainMenuStart('world'));
    iosFix('mm-btn-europe',      () => mainMenuStart('europe'));
    iosFix('mm-btn-turkey',      () => mainMenuStart('turkey'));
    iosFix('mm-btn-landmark',    () => mainMenuStart('landmark'));
    iosFix('mm-btn-multiplayer', () => { closeMainMenu(); openMultiplayerMenu(); });
    iosFix('btn-next-q',        () => nextQuestion());
    iosFix('btn-main-menu',      () => openMainMenu());
    // MP butonları
    iosFix('mp-mode-world',    () => mpSelectMode('world'));
    iosFix('mp-mode-turkey',   () => mpSelectMode('turkey'));
    iosFix('mp-mode-landmark', () => mpSelectMode('landmark'));
    iosFix('mp-mode-flag',     () => mpSelectMode('flag'));
    iosFix('btn-play-flag',    () => startFlagSolo());
    iosFix('mm-btn-flag',      () => { closeMainMenu(); startFlagSolo(); });
    iosFix('mp-btn-create',  () => mpShowCreate());
    iosFix('mp-btn-join',    () => mpShowJoin());
    iosFix('mp-create-go',   () => mpCreateLobby());
    iosFix('mp-join-go',     () => mpJoinLobby());
    iosFix('mp-start-btn',   () => mpStartGame());
    iosFix('mp-back-menu-btn', () => mpBackToMenu());
  });
})();
