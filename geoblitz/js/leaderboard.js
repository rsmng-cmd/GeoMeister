// ===== LİDERLİK TABLOSU =====
async function showLeaderboard(origin, lbMode) {
  if (origin !== undefined) lbOrigin = origin || lbOrigin;
  const mode = lbMode || lbCurrentMode || 'world';
  lbCurrentMode = mode;
  lbCurrentPage = 0;
  if (origin === 'welcome') document.getElementById('welcome-modal').style.display = 'none';
  document.getElementById('lb-modal').classList.remove('hidden');

  const orientNote = document.getElementById('lb-orientation-note');
  if (orientNote) {
    orientNote.style.display = window.innerWidth > window.innerHeight ? 'block' : 'none';
    orientNote.textContent = t('lbOrientationNote');
  }
  // Tab aktiflik
  ['world','europe','turkey','landmark','flag'].forEach(m => {
    const btn = document.getElementById('lb-tab-'+m);
    if (btn) btn.classList.toggle('active', m === mode);
  });

  const titles = {
    turkey:   '🇹🇷 ' + (lang==='tr'?'TÜRKİYE SKOR TABLOSU':'TURKEY LEADERBOARD'),
    europe:   '🇪🇺 ' + (lang==='tr'?'AVRUPA SKOR TABLOSU':'EUROPE LEADERBOARD'),
    landmark: '🏛️ ' + (lang==='tr'?'DÜNYA HARİKALARI SKOR TABLOSU':'WORLD WONDERS LEADERBOARD'),
    flag:     '🚩 ' + (lang==='tr'?'BAYRAK YARIŞI SKOR TABLOSU':'FLAG QUIZ LEADERBOARD'),
  };
  document.querySelector('#lb-box h2').textContent = titles[mode] || t('lbTitle');
  (document.getElementById('lb-subtitle')||{}).textContent = t('lbSub');

  const scoreField = {turkey:'bestScoreTurkey', europe:'bestScoreEurope', landmark:'bestScoreLandmark', flag:'bestScoreFlag'}[mode] || 'bestScore';
  const levelField = {turkey:'bestLevelTurkey', europe:'bestLevelEurope', landmark:'bestLevelLandmark', flag:'bestLevelFlag'}[mode] || 'bestLevel';
  const gamesField = {turkey:'gamesPlayedTurkey', europe:'gamesPlayedEurope', landmark:'gamesPlayedLandmark', flag:'gamesPlayedFlag'}[mode] || 'gamesPlayedWorld';

  const listEl = document.getElementById('lb-list');
  listEl.innerHTML = '<div class="lb-loading">' + t('lbLoading') + '</div>';
  document.getElementById('lb-pagination').style.display = 'none';

  try {
    const snap = await db.collection('users').orderBy(scoreField, 'desc').limit(200).get();
    lbAllUsers = [];
    snap.forEach(d => {
      const u=d.data();
      // Sadece Firebase Auth ile oluşturulmuş yeni hesaplar (uid alanı var)
      if(u.uid && (u[scoreField]||0)>0) lbAllUsers.push({...u, _sf:scoreField, _lf:levelField, _gf:gamesField});
    });
    lbRenderPage(0);
  } catch(e) {
    listEl.innerHTML = '<div class="lb-loading">' + t('lbFail') + ': ' + e.message + '</div>';
  }
}

function lbRenderPage(page) {
  lbCurrentPage = page;
  const listEl = document.getElementById('lb-list');
  const pagEl  = document.getElementById('lb-pagination');
  if (lbAllUsers.length === 0) {
    listEl.innerHTML = '<div class="lb-loading">' + t('lbEmpty') + '</div>';
    pagEl.style.display = 'none'; return;
  }
  const totalPages = Math.ceil(lbAllUsers.length / LB_PAGE_SIZE);
  const start = page * LB_PAGE_SIZE;
  const slice = lbAllUsers.slice(start, start + LB_PAGE_SIZE);
  const rankEmojis = ['🥇','🥈','🥉'];
  listEl.innerHTML = slice.map((u, i) => {
    const globalRank = start + i;
    const isMe = currentUser && u.username.toLowerCase() === currentUser.username.toLowerCase();
    const rankClass = globalRank < 3 ? ['gold','silver','bronze'][globalRank] : 'other';
    const rankLabel = globalRank < 3 ? rankEmojis[globalRank] : '#'+(globalRank+1);
    return '<div class="lb-row'+(isMe?' lb-me-row':'')+'">'+
      '<div class="lb-rank '+rankClass+'">'+rankLabel+'</div>'+
      '<div class="lb-avatar">'+u.username[0].toUpperCase()+'</div>'+
      '<div class="lb-name'+(isMe?' me':'')+'">'+u.username+(isMe?' ('+(lang==='tr'?'Sen':'You')+')':'')+'</div>'+
      '<div style="text-align:right">'+
      '<div class="lb-score">'+(u[u._sf]||0).toLocaleString()+'</div>'+
      '<div class="lb-level">'+t('level')+(u[u._lf]||0)+' &middot; '+(u[u._gf]||0)+' '+t('games')+'</div>'+
      '</div></div>';
  }).join('');

  // Sayfalama butonları
  if (totalPages > 1) {
    pagEl.style.display = 'flex';
    const prevDisabled = page === 0;
    const nextDisabled = page >= totalPages - 1;
    const rangeStart   = page * LB_PAGE_SIZE + 1;
    const rangeEnd     = Math.min((page+1)*LB_PAGE_SIZE, lbAllUsers.length);
    const btnStyle = (disabled, active) =>
      'padding:7px 14px;border-radius:8px;border:1px solid '+(active?'var(--accent)':disabled?'rgba(255,255,255,.08)':'var(--border)')+
      ';background:'+(active?'rgba(240,165,0,.15)':'transparent')+
      ';color:'+(disabled?'rgba(255,255,255,.2)':active?'var(--accent)':'var(--muted)')+
      ';font-family:Lato,sans-serif;font-size:.85rem;cursor:'+(disabled?'default':'pointer')+
      ';pointer-events:'+(disabled?'none':'auto')+';';
    let btns = '<button type="button" onclick="lbRenderPage('+(page-1)+')" style="'+btnStyle(prevDisabled,false)+'">‹ '+(lang==='en'?'Prev':'Önceki')+'</button>';
    btns += '<span style="color:var(--muted);font-size:.8rem;padding:7px 10px;align-self:center;">'+(lang==='en'?'Page':'Sayfa')+' '+(page+1)+' / '+totalPages+'<br><span style="font-size:.7rem;opacity:.6">'+rangeStart+'–'+rangeEnd+'</span></span>';
    btns += '<button type="button" onclick="lbRenderPage('+(page+1)+')" style="'+btnStyle(nextDisabled,false)+'">'+(lang==='en'?'Next':'Sonraki')+' ›</button>';
    pagEl.innerHTML = btns;
  } else {
    pagEl.style.display = 'none';
  }
}


function showEndMainMenu() {
  goToWelcome();
}

function closeLeaderboard() {
  document.getElementById('lb-modal').classList.add('hidden');
  if (lbOrigin === 'welcome') {
    document.getElementById('welcome-modal').style.display = 'flex';
    document.getElementById('welcome-modal').style.visibility = 'visible';
    document.getElementById('welcome-modal').style.zIndex = '450';
  } else if (lbOrigin === 'overlay') {
    // Seviye sonu/fail overlay'den açıldıysa overlay'e geri dön
    const ov = document.getElementById('overlay');
    ov.classList.remove('hidden');
    ov.style.setProperty('display', 'flex', 'important');
  }
  // lbOrigin === 'game' ise oyun devam ediyor, sadece lb'yi kapat yeterli
  lbOrigin = null;
}

async function resetMyScore() {
  if (!currentUser) return;
  const btn = document.getElementById('btn-reset-score');
  if (btn.dataset.confirm !== '1') {
    btn.textContent = t('confirmReset');
    btn.dataset.confirm = '1';
    setTimeout(() => { btn.textContent = 'SKORUMU SIFIRLA'; btn.dataset.confirm = '0'; }, 3000);
    return;
  }
  btn.dataset.confirm = '0';
  btn.textContent = 'SKORUMU SIFIRLA';
  const key = currentUser.username.toLowerCase();
  try {
    const userRef = db.collection('users').doc(key);
    const snap = await userRef.get();
    let userData = snap.exists ? snap.data() : Object.assign({}, currentUser);
    userData.bestScore = 0;
    userData.bestLevel = 0;
    userData.gamesPlayed = 0;
    await userRef.set(userData);
    currentUser = userData;
    showLeaderboard();
  } catch(e) { console.error(e); }
}

// Enter key support & init
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('auth-modal').dataset.tab = 'login';
  ['auth-identifier','auth-email','auth-password'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') { const scr = document.getElementById('auth-screen-username'); if(scr && scr.style.display !== 'none') authSetUsername(); else authSubmit(); }
    });
    // Mobilde klavye açılınca input görünür kalsın
    el.addEventListener('focus', () => {
      // iOS: delay longer to let keyboard fully animate in
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Also scroll the auth modal container
        const modal = document.getElementById('auth-modal');
        if (modal) modal.scrollTop = Math.max(0, el.offsetTop - 80);
      }, 400);
    });
  });
});

// ===== TAM EKRAN =====
function toggleFullscreen() {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
  const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
  const isFs = document.fullscreenElement || document.webkitFullscreenElement;
  if (!isFs) {
    if (req) req.call(el).catch(()=>{});
  } else {
    if (exit) exit.call(document);
  }
}

function acceptFullscreen() {
  document.getElementById('fs-modal').style.display = 'none';
  document.getElementById('auth-modal').classList.remove('hidden');
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen;
  if (req) req.call(el).catch(()=>{});
}

function declineFullscreen() {
  document.getElementById('fs-modal').style.display = 'none';
  document.getElementById('auth-modal').classList.remove('hidden');
}

(function() {
  const btn = document.getElementById('btn-fullscreen');
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || ('ontouchstart' in window);

  if (isMobile) {
    btn.style.display = 'block';
    // Tam ekran sorusu — sadece mobilde, oturumda bir kez
    const fsSupported = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
    if (fsSupported && !sessionStorage.getItem('fs-asked')) {
      sessionStorage.setItem('fs-asked', '1');
      // Auth modal'ı geçici gizle, önce fs sorusunu sor
      document.getElementById('auth-modal').classList.add('hidden');
      const fsModal = document.getElementById('fs-modal');
      fsModal.style.display = 'flex';
    }
  }

  const fsChange = () => {
    const isFs = document.fullscreenElement || document.webkitFullscreenElement;
    btn.style.display = isFs ? 'none' : (isMobile ? 'block' : 'none');
    btn.textContent = isFs ? '✕ ÇIKIŞ' : '⛶ TAM EKRAN';
  };
  document.addEventListener('fullscreenchange', fsChange);
  document.addEventListener('webkitfullscreenchange', fsChange);
})();

// ===== iOS KEYBOARD / VISUAL VIEWPORT FIX =====
// When the keyboard opens on iOS, the auth modal can get pushed behind it.
// We listen to visualViewport resize and scroll the focused input into view.
(function() {
  if (!window.visualViewport) return;
  window.visualViewport.addEventListener('resize', function() {
    const active = document.activeElement;
    if (!active) return;
    const tag = active.tagName.toLowerCase();
    if (tag !== 'input' && tag !== 'textarea') return;
    const authModal = document.getElementById('auth-modal');
    if (!authModal || authModal.classList.contains('hidden')) return;
    setTimeout(() => {
      active.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });
})();

// ===== END AUTH =====

