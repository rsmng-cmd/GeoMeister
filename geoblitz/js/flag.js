// ===== BAYRAK MODU =====

// ═══════════════════════════════════════════════════════════════════
// BAYRAK MODU
// ═══════════════════════════════════════════════════════════════════

// Levenshtein mesafesi — tek harf toleransı için
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m+1}, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function normalize(s) {
  return s.toLowerCase()
    .replace(/[ğ]/g,'g').replace(/[ü]/g,'u').replace(/[ş]/g,'s')
    .replace(/[ı]/g,'i').replace(/[ö]/g,'o').replace(/[ç]/g,'c')
    .replace(/[àáâãäå]/g,'a').replace(/[èéêë]/g,'e')
    .replace(/[ìíîï]/g,'i').replace(/[òóôõ]/g,'o')
    .replace(/[ùúûü]/g,'u').replace(/[ñ]/g,'n')
    .replace(/[^a-z0-9 ]/g,'').trim();
}

function checkFlagAnswer(input, country) {
  const inp = normalize(input);
  if (!inp) return false;
  const atr = Array.isArray(country.atr) ? country.atr : [];
  const aen = Array.isArray(country.aen) ? country.aen : [];
  const allAnswers = [
    ...(atr.length ? atr : [country.tr]),
    ...(aen.length ? aen : [country.en]),
    country.tr, country.en
  ].filter(Boolean);
  for (const ans of allAnswers) {
    const norm = normalize(ans);
    if (norm === inp) return true;
    // Kısa cevaplar için tolerans: ≤4 karakter → sadece tam eşleşme
    // 5-7 karakter → 1 hata; 8+ → 1 hata (max 1 tolerans)
    const maxDist = norm.length <= 4 ? 0 : 1;
    if (maxDist > 0 && levenshtein(inp, norm) <= maxDist) return true;
  }
  return false;
}

function pickFlagQuestions(n) {
  const pool = [...FLAG_COUNTRIES];
  for (let i = pool.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [pool[i],pool[j]] = [pool[j],pool[i]];
  }
  return pool.slice(0, Math.min(n, pool.length));
}

// ══════════════════════════════════════════════════════════════════════
// BAYRAK MODU — Tek oyunculu + Çok oyunculu
// ══════════════════════════════════════════════════════════════════════

let flagState = {
  questions: [],
  qIndex: 0,
  myScore: 0,
  answered: false,
  timerInterval: null,
  timeLeft: 12,
  playerAnswers: {},
  nextCountdown: null,
  solo: false,
  soloResults: [],
  currentLevel: 1,
  grandTotal: 0,
  _allAnsweredTriggered: false,
  _betweenTimeout: null,
};

const FLAG_Q_COUNT    = 15;
const FLAG_SOLO_COUNT = 15;
const FLAG_MAX_SCORE  = 1000;
const FLAG_FULL_TIME  = 12;  // toplam süre
const FLAG_FULL_SECS  = 7;   // ilk 7 saniye tam puan
const FLAG_STEP       = 60;  // her saniye azalma

function flagCalcScore(timeLeft) {
  // 12→7s: 1000 puan  |  6s→0s: her saniye -60
  if (timeLeft > FLAG_FULL_SECS - 1) return FLAG_MAX_SCORE;  // 7+ saniye kaldı
  return Math.max(0, FLAG_MAX_SCORE - (FLAG_FULL_SECS - timeLeft) * FLAG_STEP);
}

function showFlagScreen() {
  document.getElementById('flag-screen').classList.add('show');
  const menuBtn = document.getElementById('btn-main-menu');
  if (menuBtn) menuBtn.style.display = 'none';
  // Mobilde klavye otomatik açılmasın
  const inp = document.getElementById('flag-input');
  if (inp) { inp.blur(); }
  // Dikey ekran önerisi — mobil ve landscape ise göster
  const hint = document.getElementById('flag-portrait-hint');
  if (hint) {
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const isLandscape = window.innerWidth > window.innerHeight;
    hint.style.display = (isMobile && isLandscape) ? 'block' : 'none';
  }
}

function hideFlagScreen() {
  // Timer'ları ve countdown'ları temizle
  flagStopTimer();
  if (flagState.nextCountdown) { clearInterval(flagState.nextCountdown); flagState.nextCountdown = null; }
  if (flagState._betweenTimeout) { clearTimeout(flagState._betweenTimeout); flagState._betweenTimeout = null; }
  // Answered true yap ki flagTimesUp/flagSubmit artık tetiklenmesin
  flagState.answered = true;
  document.getElementById('flag-screen').classList.remove('show');
  document.getElementById('flag-between-overlay').style.display = 'none';
  const menuBtn = document.getElementById('btn-main-menu');
  if (menuBtn) menuBtn.style.display = '';
}

// Tek oyunculu başlatıcı
function _showPortraitTip() {
  // Mobilde landscape ise dikey ekran önerisi göster (engelleme değil, bilgi)
  if (!/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) return;
  const isLandscape = window.innerWidth > window.innerHeight;
  if (!isLandscape) return;
  // Toast tarzı uyarı
  let tip = document.getElementById('portrait-tip-toast');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'portrait-tip-toast';
    tip.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#1a3a2a;border:1px solid #2e7d52;color:#81c784;padding:8px 18px;border-radius:20px;font-size:.8rem;z-index:9999;white-space:nowrap;pointer-events:none;transition:opacity .4s;';
    document.body.appendChild(tip);
  }
  tip.textContent = lang==='en' ? '📱 Best in portrait mode' : '📱 Dikey ekranda daha iyi görünür';
  tip.style.opacity = '1';
  setTimeout(() => { tip.style.opacity = '0'; }, 3500);
}

function startFlagSolo() {
  document.getElementById('welcome-modal').style.display = 'none';
  const mm = document.getElementById('main-menu-modal');
  if (mm) mm.style.display = 'none';
  flagState.currentLevel = 1;
  flagState.grandTotal   = 0;
  flagState.questions    = pickFlagQuestions(FLAG_LEVELS[0].questions);
  flagState.qIndex       = 0;
  flagState.myScore      = 0;
  flagState.answered     = false;
  flagState.solo         = true;
  flagState.soloResults  = [];
  showFlagScreen();
  flagLoadQuestion();
}

function flagLoadQuestion() {

  if (flagState.qIndex >= flagState.questions.length) {
    flagEndRound(); return;
  }
  const country = flagState.questions[flagState.qIndex];
  flagState.answered  = false;
  flagState.playerAnswers = {};
  flagState.timeLeft  = FLAG_FULL_TIME;

  const flagImg = document.getElementById('flag-img');
  flagImg.style.display = 'block'; // her soruda sıfırla
  if (country.code) {
    flagImg.src = `https://flagcdn.com/w320/${country.code}.png`;
    flagImg.srcset = `https://flagcdn.com/w160/${country.code}.png 160w, https://flagcdn.com/w320/${country.code}.png 320w`;
    flagImg.alt = country.en;
  } else {
    flagImg.src = '';
    flagImg.style.display = 'none';
    flagImg.alt = country.en;
  }
  const lvlTxt = flagState.solo ? ` · ${lang==='en'?'Lv':'Sv'} ${flagState.currentLevel}` : '';
  const qWord = lang === 'en' ? 'Q' : 'SORU';
  document.getElementById('flag-round-info').textContent =
    `${qWord} ${flagState.qIndex + 1} / ${flagState.questions.length}${lvlTxt}`;
  document.getElementById('flag-feedback').textContent = '';
  document.getElementById('flag-feedback').className = '';
  document.getElementById('flag-input').value = '';
  document.getElementById('flag-input').disabled = false;
  document.getElementById('flag-submit-btn').disabled = false;
  document.getElementById('flag-hint-text').textContent =
    lang === 'en' ? 'Type the country name' : 'Ülke adını yaz';
  const lvl    = flagState.solo ? flagState.currentLevel : null;
  const target = flagState.solo ? flagLevelTarget() : null;
  document.getElementById('flag-score-info').textContent = flagState.solo
    ? (lang === 'en'
        ? `Level ${lvl} · Target: ${(target||0).toLocaleString()} pts | First ${FLAG_FULL_SECS}s=1000, then -${FLAG_STEP}/s`
        : `${lvl}. Seviye · Hedef: ${(target||0).toLocaleString()} puan | İlk ${FLAG_FULL_SECS}s=1000, sonra -${FLAG_STEP}/s`)
    : (lang === 'en'
        ? `First ${FLAG_FULL_SECS}s = 1000pts, then -${FLAG_STEP}pts/s`
        : `İlk ${FLAG_FULL_SECS}s = 1000 puan, sonra saniyede -${FLAG_STEP}`);

  // Solo: oyuncu chip'lerini gizle
  document.getElementById('flag-players-scores').innerHTML = '';
  document.getElementById('flag-live-scores').innerHTML = '';

  if (!flagState.solo) flagUpdatePlayerChips();

  if (flagState.solo) {
    flagStartTimer();
  } else {
    // MP: host flagStartAt timestamp yazar, herkes o zamana göre başlar
    if (mpIsHost) {
      db.collection('mp_lobbies').doc(mpLobbyId).update({
        flagStartAt: Date.now()
      }).catch(e => console.error('flagStartAt write error', e));
    }
    // mpHandleFlagUpdate flagStartAt'i alınca flagStartTimerAt() çağıracak
  }

  // Masaüstünde otomatik focus, mobilde değil (klavye açılmasın)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    setTimeout(() => { const inp = document.getElementById('flag-input'); if (inp) inp.focus(); }, 100);
  }
}

function flagStartTimerAt(startTs) {
  // Sunucu timestamp'ine göre kaç saniye geçmiş hesapla
  const elapsed = Math.floor((Date.now() - startTs) / 1000);
  const remaining = Math.max(0, FLAG_FULL_TIME - elapsed);
  flagState.timeLeft = remaining;
  if (flagState.timerInterval) clearInterval(flagState.timerInterval);
  const bar = document.getElementById('flag-timer-bar');
  const pct = (remaining / FLAG_FULL_TIME) * 100;
  bar.style.transition = 'none';
  bar.style.width = pct + '%';
  document.getElementById('flag-time-left').textContent = remaining;
  if (remaining <= 0) { flagTimesUp(); return; }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    bar.style.transition = `width ${remaining}s linear`;
    bar.style.width = '0%';
  }));
  flagState.timerInterval = setInterval(() => {
    flagState.timeLeft--;
    document.getElementById('flag-time-left').textContent = flagState.timeLeft;
    if (flagState.timeLeft <= 0) {
      clearInterval(flagState.timerInterval);
      flagState.timerInterval = null;
      flagTimesUp();
    }
  }, 1000);
}

function flagStartTimer() {
  if (flagState.timerInterval) clearInterval(flagState.timerInterval);
  const bar = document.getElementById('flag-timer-bar');
  bar.style.transition = 'none';
  bar.style.width = '100%';
  document.getElementById('flag-time-left').textContent = FLAG_FULL_TIME;

  requestAnimationFrame(() => requestAnimationFrame(() => {
    bar.style.transition = `width ${FLAG_FULL_TIME}s linear`;
    bar.style.width = '0%';
  }));

  flagState.timerInterval = setInterval(() => {
    flagState.timeLeft--;
    document.getElementById('flag-time-left').textContent = flagState.timeLeft;
    if (flagState.timeLeft <= 0) {
      clearInterval(flagState.timerInterval);
      flagState.timerInterval = null;
      flagTimesUp();
    }
  }, 1000);
}

function flagStopTimer() {
  if (flagState.timerInterval) { clearInterval(flagState.timerInterval); flagState.timerInterval = null; }
  // Bar animasyonu durdur
  const bar = document.getElementById('flag-timer-bar');
  const w = bar.getBoundingClientRect().width;
  const wrap = document.getElementById('flag-timer-bar-wrap').getBoundingClientRect().width;
  bar.style.transition = 'none';
  bar.style.width = (wrap > 0 ? (w/wrap*100) : 0) + '%';
}

function flagTimesUp() {
  if (flagState.answered) return;
  flagState.answered = true;
  document.getElementById('flag-input').disabled = true;
  document.getElementById('flag-submit-btn').disabled = true;
  const feedback = document.getElementById('flag-feedback');
  feedback.className = 'wrong';
  const country = flagState.questions[flagState.qIndex];
  feedback.textContent = lang === 'en'
    ? `⏱ Time's up! Answer: ${country.en}`
    : `⏱ Süre doldu! Cevap: ${country.tr}`;
  if (flagState.solo) {
    flagState.soloResults.push({country, score: 0, correct: false});
    flagState._betweenTimeout = setTimeout(() => { flagState._betweenTimeout = null; flagShowBetween(0, false); }, 1000);
  } else if (typeof mpGameActive !== 'undefined' && mpGameActive && mpLobbyId) {
    flagShowBetween(0, false);
    flagMpSubmit(0);
  } else {
    flagShowBetween(0, false);
  }
}

function flagSubmit() {
  if (flagState.answered) return;
  const inp = document.getElementById('flag-input').value.trim();
  if (!inp) return;

  const country = flagState.questions[flagState.qIndex];
  const correct  = checkFlagAnswer(inp, country);
  const score    = correct ? flagCalcScore(flagState.timeLeft) : 0;

  flagState.answered = true;
  flagStopTimer();

  document.getElementById('flag-input').disabled = true;
  document.getElementById('flag-submit-btn').disabled = true;

  const feedback = document.getElementById('flag-feedback');
  if (correct) {
    feedback.textContent = `✓ +${score}`;
    feedback.className = 'correct';
    flagState.myScore += score;
  } else {
    feedback.textContent = lang === 'en'
      ? `✗ Wrong — ${country.en}`
      : `✗ Yanlış — ${country.tr}`;
    feedback.className = 'wrong';
  }

  if (flagState.solo) {
    flagState.soloResults.push({country, score, correct});
    flagState._betweenTimeout = setTimeout(() => { flagState._betweenTimeout = null; flagShowBetween(score, correct); }, 800);
  } else if (typeof mpGameActive !== 'undefined' && mpGameActive && mpLobbyId) {
    // Between'i hemen aç, Firebase'i arka planda yaz
    flagShowBetween(score, correct);
    flagMpSubmit(score);
  } else {
    setTimeout(() => flagShowBetween(score, correct), 800);
  }
}

// enter tuşu
document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('flag-input');
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') flagSubmit(); });
});

// ── MP ───────────────────────────────────────────────────────────────────────
async function flagMpSubmit(score) {

  if (!mpLobbyId) return;
  const qIdx   = flagState.qIndex;
  const myName = currentUser.username;
  flagState.myScore += score; // local skoru güncelle
  try {
    await db.collection('mp_lobbies').doc(mpLobbyId).update({
      [`scores.${myName}`]:           (mpLobby.scores?.[myName] || 0) + score,
      [`qscores.${myName}.q${qIdx}`]: score,
      [`flagAnswered.${myName}`]:      qIdx,
    });
  } catch(e) { console.error('flagMpSubmit error', e); }
}

function flagUpdatePlayerChips() {
  if (flagState.solo) return;
  const players  = mpLobby ? Object.keys(mpLobby.players || {}) : [];
  const answered = mpLobby?.flagAnswered || {};
  const qIdx     = flagState.qIndex;
  document.getElementById('flag-players-scores').innerHTML = players.map(p => {
    const done = answered[p] === qIdx;
    return `<span class="flag-player-chip${done?' answered':''}">${done?'✓ ':''}${p}</span>`;
  }).join('');
  const scores = mpLobby?.scores || {};
  document.getElementById('flag-live-scores').innerHTML = players.map(p =>
    `<span style="font-size:.8rem;color:var(--muted)">${p} <b style="color:var(--text)">${scores[p]||0}</b></span>`
  ).join(' · ');
}

// ── Arası ekran ──────────────────────────────────────────────────────────────
function flagShowBetween(myScore, correct) {
  const country = flagState.questions[flagState.qIndex];
  const overlay = document.getElementById('flag-between-overlay');
  overlay.style.display = 'flex';
  const titleEl = document.getElementById('flag-between-title');
  if (titleEl) titleEl.textContent = lang === 'en' ? 'SCORE' : 'SKOR';

  // Cevap
  const bCode = country.code || 'un';
  const primaryName   = lang === 'en' ? country.en : country.tr;
  const secondaryName = lang === 'en' ? country.tr : country.en;
  document.getElementById('flag-between-answer').innerHTML =
    `<img src="https://flagcdn.com/w160/${bCode}.png" style="height:60px;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.4);margin-bottom:8px;" /><br>`
    + `<b style="font-size:1.8rem">${primaryName}</b><br>`
    + `<span style="color:var(--muted);font-size:1.1rem">${secondaryName}</span>`;

  // Skor satırları
  let listHtml = '';
  if (flagState.solo) {
    // Solo: tek satır
    listHtml = `<div style="background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:12px 16px;text-align:center;">
      <span style="font-size:1.1rem">${correct ? '✓' : '✗'} ${currentUser?.username || '—'}</span>
      &nbsp;
      <b style="color:${correct?'#4caf50':'var(--muted)'}">+${myScore}</b>
      &nbsp;·&nbsp;
      <span style="color:var(--accent)">${lang==='en'?'Total':'Toplam'}: ${flagState.myScore}</span>
    </div>`;
  } else {
    const scores  = mpLobby?.scores  || {};
    const qscores = mpLobby?.qscores || {};
    const players = Object.keys(mpLobby?.players || {});
    const qIdx    = flagState.qIndex;
    listHtml = players
      .map(p => ({ name: p, total: scores[p]||0, q: qscores[p]?.[`q${qIdx}`] }))
      .sort((a,b) => b.total - a.total)
      .map((p,i) => {
        const isMe = p.name === currentUser?.username;
        const qPts = p.q !== undefined ? p.q : null;
        const qLine = qPts !== null
          ? `<div style="font-size:.72rem;color:${qPts>0?'var(--accent)':'var(--muted)'}">+${qPts} ${lang==='en'?'this round':'bu soruda'}</div>`
          : `<div style="font-size:.72rem;color:var(--muted)">${lang==='en'?'no answer':'cevap yok'}</div>`;
        return `<div style="display:flex;justify-content:space-between;align-items:center;background:var(--panel);border:1px solid ${isMe?'var(--accent)':'var(--border)'};border-radius:10px;padding:10px 16px;">
          <span style="${isMe?'color:var(--accent);font-weight:700':''}">${['🥇','🥈','🥉'][i]||'#'+(i+1)} ${p.name}</span>
          <div style="text-align:right"><div style="font-family:'Bebas Neue',cursive;font-size:1.2rem">${p.total.toLocaleString()}</div>${qLine}</div>
        </div>`;
      }).join('');

  }
  document.getElementById('flag-between-list').innerHTML = listHtml;

  // MP'de: diğer oyuncu hâlâ cevaplamazsa sayacı askıya al
  // Solo'da: normal 3s sayaç
  if (flagState.nextCountdown) clearInterval(flagState.nextCountdown);
  const _isMpMode = typeof mpGameActive !== 'undefined' && mpGameActive;
  const _nextEl = document.getElementById('flag-between-next');

  if (flagState.solo) {
    let cd = 3;
    if (_nextEl) _nextEl.textContent = (lang==='en'?'Next in':'Sonraki') + ' ' + cd + 's';
    flagState.nextCountdown = setInterval(() => {
      cd--;
      if (_nextEl) _nextEl.textContent = cd > 0 ? (lang==='en'?'Next in':'Sonraki')+' '+cd+'s' : '…';
      if (cd <= 0) {
        clearInterval(flagState.nextCountdown); flagState.nextCountdown = null;
        overlay.style.display = 'none';
        flagState.qIndex++; flagState.answered = false; flagLoadQuestion();
      }
    }, 1000);
  } else if (_isMpMode) {
    // MP: sayacı gösterme — _allAnsweredTriggered olunca host'un countdown'ı devreye girer
    if (_nextEl) _nextEl.textContent = lang==='en' ? 'Waiting for others…' : 'Diğerleri bekleniyor…';
    // overlay açık kalır, mpHandleFlagUpdate kapatacak
  }
}

// Bayrak seviye tablosu
const FLAG_LEVELS = [
  { level:1, questions:3,  target:1000 },
  { level:2, questions:4,  target:2000 },
  { level:3, questions:5,  target:2800 },
  { level:4, questions:6,  target:4000 },
  { level:5, questions:8,  target:6500 },
];

function flagLevelQuestionCount() {
  return FLAG_LEVELS[flagState.currentLevel - 1]?.questions || 3;
}
function flagLevelTarget() {
  return FLAG_LEVELS[flagState.currentLevel - 1]?.target || 1000;
}

function flagEndRound() {
  flagStopTimer();
  if (flagState.nextCountdown) { clearInterval(flagState.nextCountdown); flagState.nextCountdown = null; }

  if (flagState.solo) {
    hideFlagScreen();
    flagShowSoloResults();
  } else if (typeof mpGameActive !== 'undefined' && mpGameActive) {
    if (mpIsHost) mpEndGame();
    // guest: mpSubscribeLobby 'finished' bekleniyor
  }
}

function flagBackToMenu() {
  if (mpGameActive && mpLobbyId) {
    // MP flag oyunundayken çıkış → lobiden ayrıl
    mpLeaveLobby();
  } else {
    goToWelcome();
  }
}

function openFlagMenu() {
  // Bayrak modunda ☰ → main-menu-modal'ı göster
  // "Devam Et" butonu flagı kapatmaz, sadece modal kapanır
  const resumeBtn = document.getElementById('mm-btn-resume');
  if (resumeBtn) {
    resumeBtn.textContent = t('mpResume');
    resumeBtn.onclick = () => closeMainMenu(); // sadece modal kapat, flag devam eder
  }
  // Yeni oyun butonları flag moduna geçmemeli, flag çıkışını halledelim
  const mmWorld = document.getElementById('mm-btn-world');
  if (mmWorld) mmWorld.onclick = () => { if (mpGameActive && mpLobbyId) mpLeaveLobby(); else hideFlagScreen(); mainMenuStart('world'); };
  const mmTurkey = document.getElementById('mm-btn-turkey');
  if (mmTurkey) mmTurkey.onclick = () => { if (mpGameActive && mpLobbyId) mpLeaveLobby(); else hideFlagScreen(); mainMenuStart('turkey'); };
  const mmLandmark = document.getElementById('mm-btn-landmark');
  if (mmLandmark) mmLandmark.onclick = () => { if (mpGameActive && mpLobbyId) mpLeaveLobby(); else hideFlagScreen(); mainMenuStart('landmark'); };
  const mmFlag = document.getElementById('mm-btn-flag');
  if (mmFlag) mmFlag.onclick = () => { closeMainMenu(); hideFlagScreen(); startFlagSolo(); };
  document.getElementById('main-menu-modal').style.display = 'flex';
}

function flagShowSoloResults() {
  const levelDef  = FLAG_LEVELS[flagState.currentLevel - 1];
  const target    = levelDef?.target || 0;
  const levelScore = flagState.myScore;       // bu level'da kazanılan
  const totalAll  = flagState.grandTotal;     // tüm levellardaki toplam
  const correct   = flagState.soloResults.filter(r => r.correct).length;
  const n         = flagState.soloResults.length;
  const passed    = levelScore >= target;
  const isLastLevel = flagState.currentLevel >= FLAG_LEVELS.length;
  const isWin     = passed && isLastLevel;

  // Skoru kaydet
  gameMode = 'flag';
  saveScore(totalAll, passed ? flagState.currentLevel : flagState.currentLevel - 1);

  const ov    = document.getElementById('overlay');
  const title = document.getElementById('overlay-title');
  const desc  = document.getElementById('overlay-desc');
  const btns  = document.getElementById('overlay-buttons');

  if (isWin) {
    title.textContent = lang === 'en' ? '🏆 YOU WIN!' : '🏆 KAZANDIN!';
  } else if (passed) {
    title.textContent = lang === 'en' ? `✅ LEVEL ${flagState.currentLevel} PASSED!` : `✅ ${flagState.currentLevel}. SEVİYE GEÇILDI!`;
  } else {
    title.textContent = lang === 'en' ? `❌ LEVEL ${flagState.currentLevel} FAILED` : `❌ ${flagState.currentLevel}. SEVİYE BAŞARISIZ`;
  }

  const targetLine = passed
    ? `<div style="color:#4caf50;font-size:.9rem;margin:4px 0">${lang==='en'?'Target':'Hedef'}: ${target.toLocaleString()} ✓</div>`
    : `<div style="color:#f44336;font-size:.9rem;margin:4px 0">${lang==='en'?'Target':'Hedef'}: ${target.toLocaleString()} — ${lang==='en'?'You got':'Aldın'}: ${levelScore.toLocaleString()}</div>`;

  desc.innerHTML =
    `<div style="font-size:2rem;font-weight:700;color:var(--accent)">${levelScore.toLocaleString()} ${lang==='en'?'pts':'puan'}</div>`
    + targetLine
    + `<div style="color:var(--muted);font-size:.85rem;margin:2px 0">${correct}/${n} ${lang==='en'?'correct':'doğru'} &nbsp;|&nbsp; ${lang==='en'?'Total':'Toplam'}: ${totalAll.toLocaleString()}</div>`
    + `<div style="max-height:200px;overflow-y:auto;margin-top:10px;display:flex;flex-direction:column;gap:5px;">`
    + flagState.soloResults.map(r =>
        `<div style="display:flex;justify-content:space-between;align-items:center;background:var(--panel);border:1px solid ${r.correct?'#4caf50':'var(--border)'};border-radius:8px;padding:6px 12px;font-size:.85rem;">
          <span><img src="https://flagcdn.com/w40/${r.country.code||'un'}.png" style="height:16px;vertical-align:middle;margin-right:5px;border-radius:2px;"/>${lang==='en'?r.country.en:r.country.tr}</span>
          <b style="color:${r.correct?'#4caf50':'#f44336'}">+${r.score}</b>
        </div>`
      ).join('')
    + `</div>`;

  // Butonlar
  if (isWin) {
    btns.innerHTML =
      `<button type="button" class="overlay-btn" onclick="startFlagSolo()">${lang==='en'?'▶ PLAY AGAIN':'▶ TEKRAR OYNA'}</button>`
      + `<button type="button" class="overlay-btn secondary" onclick="flagBackToMenu()">${lang==='en'?'MENU':'ANA MENÜ'}</button>`;
  } else if (passed) {
    btns.innerHTML =
      `<button type="button" class="overlay-btn" onclick="flagNextLevel()">${lang==='en'?`▶ LEVEL ${flagState.currentLevel+1}`:`▶ ${flagState.currentLevel+1}. SEVİYE`}</button>`
      + `<button type="button" class="overlay-btn secondary" onclick="startFlagSolo()">${lang==='en'?'↺ RESTART':'↺ BAŞTAN BAŞLA'}</button>`
      + `<button type="button" class="overlay-btn secondary" onclick="flagBackToMenu()">${lang==='en'?'MENU':'ANA MENÜ'}</button>`;
  } else {
    btns.innerHTML =
      `<button type="button" class="overlay-btn" onclick="flagRetryLevel()">${lang==='en'?'↺ TRY AGAIN':'↺ TEKRAR DENE'}</button>`
      + `<button type="button" class="overlay-btn secondary" onclick="startFlagSolo()">${lang==='en'?'RESTART':'BAŞTAN BAŞLA'}</button>`
      + `<button type="button" class="overlay-btn secondary" onclick="flagBackToMenu()">${lang==='en'?'MENU':'ANA MENÜ'}</button>`;
  }

  ov.classList.remove('hidden');
  ov.style.display = 'flex';
}

function flagNextLevel() {
  flagState.currentLevel++;
  flagState.grandTotal = (flagState.grandTotal || 0) + flagState.myScore;
  flagState.myScore    = 0;
  flagState.qIndex     = 0;
  flagState.answered   = false;
  flagState.soloResults = [];
  flagState.questions  = pickFlagQuestions(flagLevelQuestionCount());
  const ov = document.getElementById('overlay');
  if (ov) { ov.classList.add('hidden'); ov.style.display = 'none'; }
  showFlagScreen();
  flagLoadQuestion();
}

function flagRetryLevel() {
  flagState.myScore    = 0;
  flagState.qIndex     = 0;
  flagState.answered   = false;
  flagState.soloResults = [];
  flagState.questions  = pickFlagQuestions(flagLevelQuestionCount());
  const ov = document.getElementById('overlay');
  if (ov) { ov.classList.add('hidden'); ov.style.display = 'none'; }
  showFlagScreen();
  flagLoadQuestion();
}


function mpHandleFlagUpdate(lobbyData) {
  if (gameMode !== 'flag') return;
  const qIdx = flagState.qIndex;


  // ── flagAnswered güncellemesi: between ekranı açıksa skoru güncelle ──────
  if (document.getElementById('flag-between-overlay').style.display === 'flex') {
    // Skor listesini güncelle (diğer oyuncu cevap verdi)
    const scores  = lobbyData.scores  || {};
    const qscores = lobbyData.qscores || {};
    const players = Object.keys(lobbyData.players || {});
    const listHtml = players
      .map(p => ({ name: p, total: scores[p]||0, q: qscores[p]?.[`q${qIdx}`] }))
      .sort((a,b) => b.total - a.total)
      .map((p,i) => {
        const isMe = p.name === currentUser?.username;
        const qPts = p.q !== undefined ? p.q : null;
        const qLine = qPts !== null
          ? `<div style="font-size:.72rem;color:${qPts>0?'var(--accent)':'var(--muted)'}">+${qPts} ${lang==='en'?'this round':'bu soruda'}</div>`
          : `<div style="font-size:.72rem;color:var(--muted)">${lang==='en'?'waiting...':'bekleniyor...'}</div>`;
        return `<div style="display:flex;justify-content:space-between;align-items:center;background:var(--panel);border:1px solid ${isMe?'var(--accent)':'var(--border)'};border-radius:10px;padding:10px 16px;">
          <span style="${isMe?'color:var(--accent);font-weight:700':''}">${['🥇','🥈','🥉'][i]||'#'+(i+1)} ${p.name}</span>
          <div style="text-align:right"><div style="font-family:'Bebas Neue',cursive;font-size:1.2rem">${p.total.toLocaleString()}</div>${qLine}</div>
        </div>`;
      }).join('');
    const listEl = document.getElementById('flag-between-list');
    if (listEl) listEl.innerHTML = listHtml;
  }

  // ── Herkes cevapladı mı? → host countdown başlatır ────────────────────────
  if (mpIsHost && !flagState._allAnsweredTriggered) {
    const fa = lobbyData.flagAnswered || {};
    const players = Object.keys(lobbyData.players || {});
    const allDone = players.length > 0 && players.every(p => fa[p] === qIdx);
    if (allDone) {
      flagState._allAnsweredTriggered = true;
      // Süreyi durdur
      flagStopTimer();
      if (!flagState.answered) {
        flagState.answered = true;
        document.getElementById('flag-input').disabled = true;
        document.getElementById('flag-submit-btn').disabled = true;
      }
      // Between açıksa sadece listeyi güncelle (sayacı sıfırlama!)
      // Açık değilse aç
      const _betweenOpen = document.getElementById('flag-between-overlay').style.display === 'flex';
      if (!_betweenOpen) {
        const myQ = (lobbyData.qscores?.[currentUser.username]?.[`q${qIdx}`]) ?? 0;
        flagShowBetween(myQ, myQ > 0);
      }
      // Her iki durumda da sayacı yeniden başlat (herkes cevapladı → 3s sonra geç)
      // Ama sadece host için — host Firebase'e yazacak
      if (mpIsHost) {
        let _aaCd = 3;
        const _aaEl = document.getElementById('flag-between-next');
        if (_aaEl) _aaEl.textContent = (lang==='en'?'Next in':'Sonraki') + ' ' + _aaCd + 's';
        if (flagState.nextCountdown) clearInterval(flagState.nextCountdown);
        flagState.nextCountdown = setInterval(() => {
          _aaCd--;
          if (_aaEl) _aaEl.textContent = _aaCd > 0 ? (lang==='en'?'Next in':'Sonraki')+' '+_aaCd+'s' : '…';
          if (_aaCd <= 0) {
            clearInterval(flagState.nextCountdown);
            flagState.nextCountdown = null;
            document.getElementById('flag-between-overlay').style.display = 'none';
            const nextQ = flagState.qIndex + 1;
            db.collection('mp_lobbies').doc(mpLobbyId).update({
              flagQuestion: nextQ,
              flagAnswered: {},
            }).catch(e => console.error('flag advance error', e));
          }
        }, 1000);
      }
    }
  }

  // ── flagStartAt: herkes aynı anda timer başlatsın ──────────────────────────
  const fStartAt = lobbyData.flagStartAt || 0;
  if (fStartAt > 0 && !flagState.timerInterval && !flagState.answered) {
    // timestamp'e göre senkronize başlat
    flagStartTimerAt(fStartAt);
  }

  // ── flagQuestion: TÜM oyuncular (host dahil) sonraki soruya geç ───────────
  const fq = lobbyData.flagQuestion ?? 0;
  if (fq > flagState.qIndex) {
    if (flagState.nextCountdown) { clearInterval(flagState.nextCountdown); flagState.nextCountdown = null; }
    document.getElementById('flag-between-overlay').style.display = 'none';
    flagState.qIndex = fq;
    flagState.answered = false;
    flagState._allAnsweredTriggered = false;
    if (fq >= flagState.questions.length) {
      flagEndRound();
    } else {
      flagLoadQuestion();
    }
  }

  flagUpdatePlayerChips();
}


