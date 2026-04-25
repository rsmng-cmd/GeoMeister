(function () {
  if (typeof firebase === "undefined") {
    alert("Firebase SDK bulunamadı.");
    return;
  }

  if (!firebase.apps || !firebase.apps.length) {
    alert("Firebase başlatılmamış.");
    return;
  }

  const db = firebase.firestore();

  let unsubscribeMatchListener = null;
  let matchHandled = false;

  const BOT_RULES = {
    bronze: { avgScore: 350, flagCorrectRate: 0.35 },
    silver: { avgScore: 460, flagCorrectRate: 0.46 },
    gold: { avgScore: 580, flagCorrectRate: 0.58 },
    plat: { avgScore: 740, flagCorrectRate: 0.74 }
  };

  function getStableGuestUid() {
    let uid = localStorage.getItem("geoblitz_guest_uid");
    if (!uid) {
      uid = "guest_" + Math.floor(Math.random() * 999999999);
      localStorage.setItem("geoblitz_guest_uid", uid);
    }
    return uid;
  }

  function getCurrentPlayer() {
    return {
      uid: currentUser?.uid || getStableGuestUid(),
      username: currentUser?.username || currentUser?.name || "Oyuncu",
      elo: currentUser?.elo || currentUser?.rankElo || 500,
      rankKey: currentUser?.rankKey || currentUser?.rank || "bronze1"
    };
  }

  function getRankFamily(rankKey) {
    rankKey = String(rankKey || "").toLowerCase();

    if (rankKey.includes("silver")) return "silver";
    if (rankKey.includes("gold")) return "gold";
    if (rankKey.includes("plat")) return "plat";
    return "bronze";
  }

  function getSelectedModeFromUI() {
    if (window.mpSelectedMode) return window.mpSelectedMode;
    if (typeof mpMode !== "undefined" && mpMode) return mpMode;

    const activeBtn = document.querySelector(".mp-random-mode-btn.active, .mp-mode-btn.active");

    if (!activeBtn) return "world";
    if (activeBtn.id.includes("world")) return "world";
    if (activeBtn.id.includes("europe")) return "europe";
    if (activeBtn.id.includes("turkey")) return "turkey";
    if (activeBtn.id.includes("landmark")) return "landmark";
    if (activeBtn.id.includes("flag")) return "flag";

    return "world";
  }

  async function startMatchmaking(mode) {
    mode = mode || getSelectedModeFromUI();

    matchHandled = false;

    const me = getCurrentPlayer();

    if (unsubscribeMatchListener) {
      unsubscribeMatchListener();
      unsubscribeMatchListener = null;
    }

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

    alert("Eşleşme aranıyor: " + getModeLabel(mode));

    setTimeout(function () {
      findMatch(mode, 50);
    }, 1000);

    setTimeout(function () {
      findMatch(mode, null);
    }, 15000);

    setTimeout(function () {
      assignBotIfNeeded(mode);
    }, 25000);
  }

  async function findMatch(mode, eloLimit) {
    const me = getCurrentPlayer();
    const myRef = db.collection("matchmaking").doc(me.uid);
    const myDoc = await myRef.get();

    if (!myDoc.exists) return;
    if (myDoc.data().status !== "searching") return;

    const snap = await db.collection("matchmaking")
      .where("mode", "==", mode)
      .where("status", "==", "searching")
      .get();

    let opponent = null;

    snap.forEach(function (docSnap) {
      const p = docSnap.data();

      if (p.uid === me.uid) return;
      if (p.mode !== mode) return;

      const diff = Math.abs((p.elo || 0) - (me.elo || 0));

      if (eloLimit === null || diff <= eloLimit) {
        if (!opponent) opponent = p;
      }
    });

    if (!opponent) return;

    const latestMine = await myRef.get();
    const latestOpp = await db.collection("matchmaking").doc(opponent.uid).get();

    if (!latestMine.exists || !latestOpp.exists) return;
    if (latestMine.data().status !== "searching") return;
    if (latestOpp.data().status !== "searching") return;

    const matchId = "match_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

    await myRef.update({
      status: "matched",
      matchedWith: opponent.uid,
      matchId: matchId
    });

    await db.collection("matchmaking").doc(opponent.uid).update({
      status: "matched",
      matchedWith: me.uid,
      matchId: matchId
    });
  }

  async function assignBotIfNeeded(mode) {
    const me = getCurrentPlayer();
    const ref = db.collection("matchmaking").doc(me.uid);
    const snap = await ref.get();

    if (!snap.exists) return;
    if (snap.data().status !== "searching") return;

    const family = getRankFamily(me.rankKey);
    const rule = BOT_RULES[family];

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

  function showMatchFound(data) {
    alert("Eşleşme bulundu!");

    window.currentMatchData = data;
    window.mpMode = data.mode;
    window.mpSelectedMode = data.mode;

    if (typeof closeMultiplayerMenu === "function") {
      closeMultiplayerMenu();
    }

    if (typeof mpStartGame === "function") {
      mpStartGame(data);
      return;
    }

    if (typeof mpStartLobbyGame === "function") {
      mpStartLobbyGame(data.matchId);
      return;
    }

    alert("Eşleşme bulundu ama multiplayer başlatma fonksiyonu bulunamadı.");
  }

  function getModeLabel(mode) {
    const labels = {
      world: "Dünya",
      europe: "Avrupa",
      turkey: "Türkiye",
      landmark: "Dünya Harikaları",
      flag: "Bayraklar"
    };

    return labels[mode] || "Dünya";
  }

  window.FirestoreMatchmakingAgent = {
    start: startMatchmaking
  };
})();