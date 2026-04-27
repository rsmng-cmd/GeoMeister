(function () {
  if (typeof firebase === "undefined") {
    console.error("GeoMeister: Firebase SDK bulunamadı.");
    return;
  }

  if (!firebase.apps || !firebase.apps.length) {
    console.error("GeoMeister: Firebase başlatılmamış.");
    return;
  }

  const db = firebase.firestore();

  let unsubscribeMatchListener = null;
  let matchHandled = false;

  // Kuyruk kaydının maksimum geçerli yaşı (ms)
  // Bu süreden eski kayıtlar "hayalet" sayılır ve eşleşme adayı gösterilmez
  const STALE_THRESHOLD_MS = 60 * 1000; // 60 saniye

  const BOT_RULES = {
    bronze: { avgScore: 350, flagCorrectRate: 0.35 },
    silver: { avgScore: 460, flagCorrectRate: 0.46 },
    gold:   { avgScore: 580, flagCorrectRate: 0.58 },
    plat:   { avgScore: 740, flagCorrectRate: 0.74 }
  };

  // ─────────────────────────────────────────────────────────────
  //  UI YARDIMCILARI
  // ─────────────────────────────────────────────────────────────
  function setHint(msg) {
    const el = document.getElementById("mp-mm-hint");
    if (el) el.textContent = msg;
  }

  function setHeading(msg) {
    const el = document.getElementById("mp-mm-h2");
    if (el) el.textContent = msg;
  }

  function setSpinner(icon) {
    const el = document.getElementById("mp-mm-spinner");
    if (el) el.textContent = icon;
  }

  function setError(msg) {
    const el = document.getElementById("mp-mm-error");
    if (el) el.textContent = msg;
  }

  // ─────────────────────────────────────────────────────────────

  function getStableGuestUid() {
    let uid = localStorage.getItem("geomeister_guest_uid");
    if (!uid) {
      uid = "guest_" + Math.floor(Math.random() * 999999999);
      localStorage.setItem("geomeister_guest_uid", uid);
    }
    return uid;
  }

  function getCurrentPlayer() {
    // currentUser index.html'de local scope'ta tanımlı, dışarıdan erişilemez.
    // window._geomeisterUser üzerinden alıyoruz (index.html bunu set ediyor).
    const firebaseUid = firebase.auth().currentUser?.uid;
    const user = window._geomeisterUser;

    return {
      uid: firebaseUid || getStableGuestUid(),
      username: user?.username || user?.name || "Oyuncu",
      elo: user?.eloWorld || user?.elo || user?.rankElo || 500,
      rankKey: user?.rankKey || user?.rank || "bronze1"
    };
  }

  function getRankFamily(rankKey) {
    rankKey = String(rankKey || "").toLowerCase();
    if (rankKey.includes("silver")) return "silver";
    if (rankKey.includes("gold"))   return "gold";
    if (rankKey.includes("plat"))   return "plat";
    return "bronze";
  }

  function getSelectedModeFromUI() {
    if (window.mpSelectedMode) return window.mpSelectedMode;
    if (typeof mpMode !== "undefined" && mpMode) return mpMode;

    const activeBtn = document.querySelector(".mp-random-mode-btn.active, .mp-mode-btn.active");
    if (!activeBtn) return "world";
    if (activeBtn.id.includes("world"))    return "world";
    if (activeBtn.id.includes("europe"))   return "europe";
    if (activeBtn.id.includes("turkey"))   return "turkey";
    if (activeBtn.id.includes("flag"))     return "flag";
    return "world";
  }

  function getModeLabel(mode) {
    const isEn = (typeof lang !== 'undefined' && lang === 'en');
    const labels = isEn ? {
      world: 'World', europe: 'Europe', turkey: 'Turkey', flag: 'Flags'
    } : {
      world: 'Dünya', europe: 'Avrupa', turkey: 'Türkiye', flag: 'Bayraklar'
    };
    return labels[mode] || (isEn ? 'World' : 'Dünya');
  }

  // ─────────────────────────────────────────────────────────────
  //  startMatchmaking
  // ─────────────────────────────────────────────────────────────
  async function startMatchmaking(mode) {
    mode = mode || getSelectedModeFromUI();
    matchHandled = false;

    const me = getCurrentPlayer();

    if (unsubscribeMatchListener) {
      unsubscribeMatchListener();
      unsubscribeMatchListener = null;
    }

    setHeading(typeof lang !== 'undefined' && lang === 'en' ? '⚡ MATCHING…' : '⚡ EŞLEŞTİRİLİYOR');
    setSpinner("🔍");
    setHint(getModeLabel(mode) + (typeof lang !== 'undefined' && lang === 'en' ? ' — looking for opponent…' : ' modunda rakip aranıyor…'));
    setError("");
    await db.collection("matchmaking").doc(me.uid).set({
      uid: me.uid,
      username: me.username,
      elo: me.elo,
      rankKey: me.rankKey,
      mode: mode,
      status: "searching",
      matchedWith: null,
      matchId: null,
      ready: false,
      bot: false,
      createdAt: Date.now()
    });

    listenMyMatch(me.uid);

    setTimeout(function () { findMatch(mode, 50); }, 1000);

    setTimeout(function () {
      setHint(typeof lang !== 'undefined' && lang === 'en' ? 'No opponent found, expanding range…' : 'Rakip bulunamadı, aralık genişletiliyor…');
      findMatch(mode, null);
    }, 15000);

    setTimeout(function () { assignBotIfNeeded(mode); }, 25000);
  }

  // ─────────────────────────────────────────────────────────────
  //  findMatch — Transaction + eski kayıt filtresi
  // ─────────────────────────────────────────────────────────────
  async function findMatch(mode, eloLimit) {
    const me = getCurrentPlayer();
    const myRef = db.collection("matchmaking").doc(me.uid);
    const now = Date.now();

    const snap = await db.collection("matchmaking")
      .where("mode", "==", mode)
      .where("status", "==", "searching")
      .get();

    let opponentData = null;

    snap.forEach(function (docSnap) {
      if (opponentData) return;

      const p = docSnap.data();
      if (p.uid === me.uid) return;

      // ── YENİ: Hayalet kayıt filtresi ──
      // 60 saniyeden eski "searching" kaydı muhtemelen tarayıcısını kapatan
      // bir kullanıcıya ait — eşleşme adayı olarak değerlendirme
      const age = now - (p.createdAt || 0);
      if (age > STALE_THRESHOLD_MS) return;

      const diff = Math.abs((p.elo || 0) - (me.elo || 0));
      if (eloLimit === null || diff <= eloLimit) {
        opponentData = p;
      }
    });

    if (!opponentData) return;

    const oppRef = db.collection("matchmaking").doc(opponentData.uid);
    const matchId = "match_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

    try {
      await db.runTransaction(async function (tx) {
        const mySnap  = await tx.get(myRef);
        const oppSnap = await tx.get(oppRef);

        if (!mySnap.exists || !oppSnap.exists) {
          throw new Error("Oyuncu kuyruğu bulunamadı.");
        }
        if (mySnap.data().status !== "searching") {
          throw new Error("Ben zaten eşleştim.");
        }
        if (oppSnap.data().status !== "searching") {
          throw new Error("Rakip zaten eşleşti.");
        }

        // Transaction içinde de yaş kontrolü yap
        const oppAge = now - (oppSnap.data().createdAt || 0);
        if (oppAge > STALE_THRESHOLD_MS) {
          throw new Error("Rakip kaydı eskimiş.");
        }

        tx.update(myRef, {
          status: "matched",
          matchedWith: opponentData.uid,
          matchId: matchId
        });
        tx.update(oppRef, {
          status: "matched",
          matchedWith: me.uid,
          matchId: matchId
        });
      });
    } catch (err) {
      console.warn("Eşleşme transaction başarısız (normal):", err.message);
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  assignBotIfNeeded
  // ─────────────────────────────────────────────────────────────
  async function assignBotIfNeeded(mode) {
    const me = getCurrentPlayer();
    const ref = db.collection("matchmaking").doc(me.uid);
    const snap = await ref.get();

    if (!snap.exists) return;
    if (snap.data().status !== "searching") return;

    setHint(typeof lang !== 'undefined' && lang === 'en' ? 'No opponent found, matching with bot…' : 'Rakip bulunamadı, bot ile eşleşiliyor…');

    const family = getRankFamily(me.rankKey);
    const rule   = BOT_RULES[family];

    await ref.update({
      status: "matched",
      matchedWith: "bot_" + family,
      matchId: "botmatch_" + Date.now(),
      bot: true,
      botData: {
        rankFamily: family,
        avgScore: rule.avgScore,
        flagCorrectRate: rule.flagCorrectRate
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  //  listenMyMatch
  // ─────────────────────────────────────────────────────────────
  function listenMyMatch(uid) {
    unsubscribeMatchListener = db.collection("matchmaking").doc(uid).onSnapshot(function (snap) {
      if (!snap.exists) return;
      const data = snap.data();
      if (data.status === "matched" && !matchHandled) {
        matchHandled = true;
        showMatchFound(data);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  //  showMatchFound
  // ─────────────────────────────────────────────────────────────
  function showMatchFound(data) {
    setSpinner("✅");
    setHeading(typeof lang !== 'undefined' && lang === 'en' ? 'MATCHED!' : 'EŞLEŞİLDİ!');
    setHint(data.bot
      ? (typeof lang !== 'undefined' && lang === 'en' ? 'Matched with bot, starting game…' : 'Bot ile eşleşildi, oyun başlıyor…')
      : (typeof lang !== 'undefined' && lang === 'en' ? 'Opponent found, starting game…' : 'Rakip bulundu, oyun başlıyor…'));

    window.currentMatchData = data;
    window.mpMode = data.mode;
    window.mpSelectedMode = data.mode;

    setTimeout(function () {
      if (typeof closeMultiplayerMenu === "function") closeMultiplayerMenu();
      if (typeof mpStartGame === "function") { mpStartGame(data); return; }
      if (typeof mpStartLobbyGame === "function") { mpStartLobbyGame(data.matchId); return; }
      console.error("mpStartGame veya mpStartLobbyGame bulunamadı.");
      setError(typeof lang !== 'undefined' && lang === 'en' ? 'Could not start game. Please try again.' : 'Oyun başlatılamadı. Lütfen tekrar dene.');
      setSpinner("⚠️");
    }, 800);
  }

  // ─────────────────────────────────────────────────────────────
  //  cancelMatchmaking — listener ve Firestore kaydını temizle
  // ─────────────────────────────────────────────────────────────
  async function cancelMatchmaking() {
    if (unsubscribeMatchListener) {
      unsubscribeMatchListener();
      unsubscribeMatchListener = null;
    }

    const me = getCurrentPlayer();

    try {
      const ref = db.collection("matchmaking").doc(me.uid);
      const snap = await ref.get();
      if (snap.exists && snap.data().status === "searching") {
        await ref.delete();
      }
    } catch (err) {
      console.warn("Kuyruk temizleme hatası:", err.message);
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  Sayfa kapanma / arka plana geçme olayları
  //  index.html'e dokunmadan burada kayıt ediliyor.
  //
  //  beforeunload  → sekme/tarayıcı kapatma, sayfayı yenileme
  //  visibilitychange → telefonda uygulamayı arka plana atma
  //
  //  NOT: beforeunload içinde async/await çalışmaz.
  //  sendBeacon veya senkron XMLHttpRequest gerekir.
  //  Firestore'un senkron silme API'si olmadığından
  //  burada status'u "cancelled" yapıyoruz — bu en hızlı yol.
  //  Gerçek silme işlemi bir sonraki oturumda veya
  //  Cloud Function ile yapılabilir.
  // ─────────────────────────────────────────────────────────────
  window.addEventListener("beforeunload", function () {
    const me = getCurrentPlayer();
    // Firestore REST API ile senkron istek atmak mümkün değil,
    // ama en azından listener'ı temizle ve local state sıfırla
    if (unsubscribeMatchListener) {
      unsubscribeMatchListener();
      unsubscribeMatchListener = null;
    }
    // Not: Async delete burada çalışmaz. Bu yüzden 60 saniyelik
    // STALE_THRESHOLD_MS filtresi ikinci savunma katmanıdır.
  });

  document.addEventListener("visibilitychange", function () {
    // Sayfa görünür olduğunda bir şey yapma.
    // Sayfa gizlendiğinde: sadece matchmaking arama sırasında kuyruğu temizle.
    // Oyun aktifken (mpGameActive) dokunma — index.html kendi forfeit mantığını yönetiyor.
    if (document.visibilityState === "hidden") {
      const gameActive = (typeof window.mpGameActive !== 'undefined' && window.mpGameActive);
      if (!gameActive) {
        cancelMatchmaking();
      }
    }
  });

  window.FirestoreMatchmakingAgent = {
    start:  startMatchmaking,
    cancel: cancelMatchmaking
  };
})();
