// ===== OYUN MANTIĞI =====
let state={level:1,levelScore:0,totalScore:0,questionIndex:0,questions:[],answered:false,combo:0};
let timerInterval=null, timerSeconds=0;

let downX=null, downY=null, downTime=null;


// ===== TIMER =====
const TIMER_TOTAL=17, TIMER_GRACE=5;

function startTimer(){
  stopTimer();
  timerSeconds=0;
  updateTimerUI();
  timerInterval=setInterval(()=>{
    timerSeconds++;
    updateTimerUI();
    if(timerSeconds>=TIMER_TOTAL){
      stopTimer();
      if(!state.answered){
        state.answered=true;
        const city=state.questions[state.questionIndex];
        state.combo=0; updateComboUI();
        addMarker(city.lat,city.lon,'marker-real');
        if (typeof mpGameActive !== 'undefined' && mpGameActive) {
          if (typeof mpSubmitAnswer === 'function') mpSubmitAnswer(0);
          showToast(0, null, city, 1.0, true);
          // Süre bitti: mpNextQuestion ile showScores Firebase'e yaz
          // Kısa gecikme: önce mpSubmitAnswer'ın Firestore'a yazması için bekle
          setTimeout(() => { if (mpGameActive) mpNextQuestion(); }, 800);
        } else {
          state.levelScore+=0; state.totalScore+=0;
          showToast(0, null, city, 1.0, true);
          updateTopBar();
        }
      }
    }
  },1000);
}

function stopTimer(){
  if(timerInterval){ clearInterval(timerInterval); timerInterval=null; }
}

function updateTimerUI(){
  const remaining=Math.max(0, TIMER_TOTAL-timerSeconds);
  const pct=(remaining/TIMER_TOTAL)*100;
  const fill=document.getElementById('timer-bar-fill');
  const label=document.getElementById('timer-label');
  fill.style.width=pct+'%';
  label.textContent=remaining;
  // renk: yeşil→sarı→kırmızı
  if(remaining>8) fill.style.background='var(--green)';
  else if(remaining>4) fill.style.background='var(--accent)';
  else fill.style.background='var(--red)';
}

// ===== COMBO =====
const COMBO_MULT=[1.0,1.05,1.10,1.20];
function getComboMult(){ return 1; } // Combo disabled
function updateComboUI(){
  const badge=document.getElementById('combo-badge');
  if(badge) badge.style.display='none';
}

// ===== SÜRE ÇARPANI =====
function getTimeMult(){
  if(timerSeconds<=TIMER_GRACE) return 1.0;
  const over=timerSeconds-TIMER_GRACE;
  return Math.max(0, 1.0 - over*0.03);
}

// ===== CLICK =====


function openMainMenu() {
  if (typeof mpGameActive !== 'undefined' && mpGameActive) return;
  // Main-menu-modal göster (devam et seçeneğiyle)
  const modeEl = document.getElementById('main-menu-mode-label');
  if (modeEl) modeEl.textContent = '';
  const mmMp = document.getElementById('mm-btn-multiplayer');
  if (mmMp) mmMp.style.display = (typeof mpLobbyId !== 'undefined' && mpLobbyId) ? 'none' : '';
  const resumeEl = document.getElementById('mm-btn-resume');
  if (resumeEl) resumeEl.textContent = t('mpResume');
  document.getElementById('main-menu-modal').style.display = 'flex';
}

function closeMainMenu() {
  document.getElementById('main-menu-modal').style.display = 'none';
}

function mainMenuStart(mode) {
  closeMainMenu();
  gameMode = mode;
  startGame();
}

function openOptions(origin) {
  window._optionsOrigin = origin || null;
  document.getElementById('options-modal').style.display = 'flex';
  // Close other modals
  if (origin === 'welcome') document.getElementById('welcome-modal').style.display = 'none';
}

function closeOptions() {
  document.getElementById('options-modal').style.display = 'none';
  if (window._optionsOrigin === 'welcome') {
    document.getElementById('welcome-modal').style.display = 'flex';
  }
  window._optionsOrigin = null;
}

function handleClickAtLonLat(lon, lat) {
  if (state.answered) return;
  state.answered=true;

  stopTimer();

  const city=state.questions[state.questionIndex];
  const km=Math.round(haversine(lat,lon,city.lat,city.lon));
  const baseScore = gameMode === "turkey" ? distanceToScoreTurkey(km) : gameMode === "europe" ? distanceToScoreEurope(km) : distanceToScore(km);

  // Çarpanlar: önce kombo, sonra süre cezası
  const comboMult=getComboMult();
  const timeMult=getTimeMult();
  const finalScore=Math.round(baseScore * comboMult * timeMult);

  // Kombo güncelle
  if(baseScore>=600){ state.combo=Math.min(state.combo+1, COMBO_MULT.length-1); }
  else { state.combo=0; }
  updateComboUI();

  const gPos=addMarker(lat,lon,'marker-guess');
  const rPos=addMarker(city.lat,city.lon,'marker-real');
  addLine(gPos.x,gPos.y,rPos.x,rPos.y);

  state.levelScore+=finalScore; state.totalScore+=finalScore;

  // Zoom animasyonu: iki nokta arasının ortasına zoom
  const midLat=(lat+city.lat)/2, midLon=(lon+city.lon)/2;
  const mProj=getActiveProjection(); const [mx,my]=mProj([midLon,midLat]);
  const cont=document.getElementById('map-container');
  const W=cont.clientWidth, H=cont.clientHeight;
  // hedef zoom: mesafeye göre (yakın = daha fazla zoom)
  const zTarget=Math.min(4, Math.max(1.5, 600/Math.max(km,50)));
  const tx=W/2 - mx*zTarget;
  const ty=H/2 - my*zTarget;
  if (gameMode === 'turkey' && window.turkeyZoom) {
    d3.select('#turkey-svg').transition().duration(700).call(
      window.turkeyZoom.transform,
      d3.zoomIdentity.translate(tx,ty).scale(zTarget)
    );
  } else if (gameMode === 'europe' && europeZoom) {
    europeSvgEl.transition().duration(700).call(
      europeZoom.transform,
      d3.zoomIdentity.translate(tx,ty).scale(zTarget)
    );
  } else {
    svgEl.transition().duration(700).call(
      zoomBehavior.transform,
      d3.zoomIdentity.translate(tx,ty).scale(zTarget)
    );
  }

  showToast(finalScore, km, city, comboMult, false, timeMult);
  updateTopBar();

}


function handleMapClick(evt){
  if (evt.changedTouches) {
    evt.preventDefault();
    const touch = evt.changedTouches[0];
    evt.clientX = touch.clientX;
    evt.clientY = touch.clientY;
  }
  if(state.answered) return;
  if(gameMode === 'turkey') return;
  if(!evt || (!evt.clientX && !evt.changedTouches)) return;

  const activeSvg = getActiveSvgNode();
  const activeProj = getActiveProjection();
  const activeTransform = getActiveTransform();

  let px, py;
  try {
    [px, py] = d3.pointer(evt, activeSvg);
  } catch(e) {
    const rect = activeSvg.getBoundingClientRect();
    px = evt.clientX - rect.left;
    py = evt.clientY - rect.top;
  }
  const bx = (px - activeTransform.x) / activeTransform.k;
  const by = (py - activeTransform.y) / activeTransform.k;
  const result = activeProj.invert([bx,by]);

  if (!result || isNaN(result[0]) || isNaN(result[1])) return;
  const [lon,lat] = result;
  if (lon < -180 || lon > 180 || lat < -90 || lat > 90) return;

  state.answered=true;
  stopTimer();

  const city=state.questions[state.questionIndex];
  const km=Math.round(haversine(lat,lon,city.lat,city.lon));
  const baseScore = gameMode === "turkey" ? distanceToScoreTurkey(km) : gameMode === "europe" ? distanceToScoreEurope(km) : distanceToScore(km);

  const comboMult=getComboMult();
  const timeMult=getTimeMult();
  const finalScore=Math.round(baseScore * comboMult * timeMult);

  if(baseScore>=600){ state.combo=Math.min(state.combo+1, COMBO_MULT.length-1); }
  else { state.combo=0; }
  updateComboUI();

  const gPos=addMarker(lat,lon,'marker-guess');
  const rPos=addMarker(city.lat,city.lon,'marker-real');
  addLine(gPos.x,gPos.y,rPos.x,rPos.y);

  state.levelScore+=finalScore; state.totalScore+=finalScore;

  const midLat=(lat+city.lat)/2, midLon=(lon+city.lon)/2;
  const mProj=getActiveProjection(); const [mx,my]=mProj([midLon,midLat]);
  const cont=document.getElementById('map-container');
  const W=cont.clientWidth, H=cont.clientHeight;
  const zTarget=Math.min(4, Math.max(1.5, 600/Math.max(km,50)));
  const tx=W/2 - mx*zTarget;
  const ty=H/2 - my*zTarget;
  if (gameMode === 'turkey' && window.turkeyZoom) {
    d3.select('#turkey-svg').transition().duration(700).call(
      window.turkeyZoom.transform,
      d3.zoomIdentity.translate(tx,ty).scale(zTarget)
    );
  } else if (gameMode === 'europe' && europeZoom) {
    europeSvgEl.transition().duration(700).call(
      europeZoom.transform,
      d3.zoomIdentity.translate(tx,ty).scale(zTarget)
    );
  } else {
    svgEl.transition().duration(700).call(
      zoomBehavior.transform,
      d3.zoomIdentity.translate(tx,ty).scale(zTarget)
    );
  }

  showToast(finalScore, km, city, comboMult, false, timeMult);
  updateTopBar();
}

// ===== DISTANCE & SCORE =====
function haversine(lat1,lon1,lat2,lon2){
  const R=6371,dL=(lat2-lat1)*Math.PI/180,dN=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dL/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dN/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function distanceToScore(km){
  if(km<=50)  return 1000;
  if(km<=150) return Math.max(0, 1000 - Math.round((km-50)*2));   // -2/km
  if(km<=450) return Math.max(0, 800  - Math.round((km-150)*1));  // -1/km
  return Math.max(0, 450 - Math.round((km-450)/3));               // -1/3km
}

function distanceToScoreEurope(km){
  // Avrupa modu dünya moduna göre yaklaşık %25 daha zor.
  // Aynı uzaklık için puanı düşürmek adına efektif mesafeyi %25 artırıyoruz.
  // Maksimum puan yine 1000.
  return distanceToScore(km * 1.25);
}

// ===== UI =====
function updateTopBar(){
  const cfg=getLevelConfig(state.level);
  const modeEmoji = (typeof gameMode !== 'undefined' && gameMode === 'turkey') ? '🇹🇷 ' : (typeof gameMode !== 'undefined' && gameMode === 'europe') ? '🇪🇺 ' : '';
  document.getElementById('level-badge').textContent= modeEmoji + `${lang==='tr'?'SEVİYE':'LEVEL'} ${state.level}`;
  document.getElementById('score-display').textContent=state.levelScore;
  document.getElementById('target-display').textContent=cfg.target;
  const fill=Math.min(100,state.levelScore/cfg.target*100);
  document.getElementById('progress-bar-fill').style.width=fill+'%';
  document.getElementById('progress-text').textContent=`${state.levelScore} / ${cfg.target}`;
  const dots=document.getElementById('q-dots');
  dots.innerHTML='';
  for(let i=0;i<cfg.questions;i++){
    const d=document.createElement('div');
    d.className='q-dot'+(i<state.questionIndex?' done':i===state.questionIndex?' active':'');
    dots.appendChild(d);
  }
}

let hideToastTimer = null;
function showToast(pts, km, city, comboMult=1.0, timeout=false, timeMult=1.0){
  const toast = document.getElementById('result-toast');
  // Bekleyen hide timer'ı iptal et
  if(hideToastTimer) { clearTimeout(hideToastTimer); hideToastTimer=null; }
  toast.style.display = 'flex';
  document.getElementById('toast-score').textContent=`+${pts}`;
  document.getElementById('toast-score').style.color=pts>500?'var(--green)':pts>200?'var(--accent)':'var(--red)';
  const dLabel = (typeof gameMode !== 'undefined' && gameMode === 'turkey') ? `${city.name}, ${city.city}` : (gameMode === 'landmark') ? (lang==='en' ? (city.name_en||city.name) : city.name) : `${cityDisplayName(city)}, ${countryDisplayName(city)}`;
  let info = timeout
    ? `${t('timeout')} — ${dLabel}`
    : `${dLabel} — ${km.toLocaleString()} ${t('away')}`;
  let extras = [];
  if(comboMult>1.0) extras.push(`🔥 ${t('combo')} x${comboMult.toFixed(2)}`);
  if(timeMult<1.0) extras.push(`⏱ x${timeMult.toFixed(2)}`);
  if(extras.length) info += `  |  ${extras.join('  ')}`;
  document.getElementById('toast-dist').textContent=info;
  // MP'de DEVAM butonu gösterilmesin — geçiş otomatik
  const _nextBtn = document.getElementById('btn-next-q');
  if (_nextBtn) _nextBtn.style.display = (typeof mpGameActive !== 'undefined' && mpGameActive) ? 'none' : '';
  toast.classList.add('show');
}
function hideToast(){
  const toast = document.getElementById('result-toast');
  toast.classList.remove('show');
  hideToastTimer = setTimeout(()=>{
    hideToastTimer = null;
    if(!toast.classList.contains('show')) toast.style.display = 'none';
  }, 500);
}

function nextQuestion(){
  downX=null; downY=null;
  stopTimer();
  // Toast'u anında kapat — timer bekleme
  if(hideToastTimer){ clearTimeout(hideToastTimer); hideToastTimer=null; }
  const toast = document.getElementById('result-toast');
  toast.classList.remove('show');
  toast.style.display = 'none';
  const cfg=getLevelConfig(state.level);
  state.questionIndex++;
  if(state.questionIndex>=cfg.questions){
    if(state.levelScore>=cfg.target){
      if(state.level>=TOTAL_LEVELS){
        saveScore(state.totalScore, state.level);
        maybeShowInterstitialAfterGame(() => {
          showOverlay(
            t('winTitle'),
            t('winDesc', state.totalScore),
            t('playAgain'),
            ()=>{state.level=1;state.totalScore=0;startLevel();},
            [
              {label: t('mainMenu'), cls:'secondary', action: ()=>showEndMainMenu()},
              {label: t('viewLb'), cls:'secondary', action: ()=>showLeaderboard('overlay')},
              {label: t('logoutBtn'), cls:'danger', action: authLogout}
            ]
          );
        });
      } else {
        const nc=getLevelConfig(state.level+1);
        showOverlay(
          t('levelOk', state.level),
          t('levelOkDesc', state.levelScore, getLevelConfig(state.level).target, state.level+1, nc.questions, nc.target, state.totalScore),
          t('nextLevel'),
          ()=>{ state.level++; startLevel(); },
          [
            {label: t('viewLb'), cls:'secondary', action: ()=>showLeaderboard('overlay')},
          ]
        );
      }
    } else {
      saveScore(state.totalScore, state.level);
      const _extraBtns = [
        {label: t('mainMenu'), cls:'secondary', action: ()=>showEndMainMenu()},
        {label: t('viewLb'), cls:'secondary', action: ()=>showLeaderboard('overlay')},
        {label: t('logoutBtn'), cls:'danger', action: authLogout}
      ];
      if (canShowAd('rewarded')) {
        _extraBtns.unshift({
          label: '🎬 Reklam İzle — Tekrar Oyna',
          cls: 'secondary',
          action: () => { recordAd('rewarded'); startLevel(); }
        });
      }
      maybeShowInterstitialAfterGame(() => {
        showOverlay(
          t('failTitle'),
          t('failDesc', state.levelScore, getLevelConfig(state.level).target, state.totalScore),
          t('retry'),
          () => { state.level=1; state.totalScore=0; resetAdGameFlag(); startLevel(); },
          _extraBtns
        );
      });
    }
  } else { loadQuestion(); }
}

function showOverlay(title, desc, btn, action, extraButtons) {
  const ovEl = document.getElementById('overlay');
  document.getElementById('overlay-title').innerHTML = title;
  document.getElementById('overlay-desc').innerHTML = desc;
  const btnsEl = document.getElementById('overlay-buttons');
  btnsEl.innerHTML = '';
  // Ana buton
  const main = document.createElement('button');
  main.className = 'overlay-btn';
  main.addEventListener('touchend', function(e) { e.preventDefault(); if(action) action(); }, {passive:false});
  main.textContent = btn;
  main.onclick = () => { document.getElementById('overlay').classList.add('hidden'); document.getElementById('overlay').style.display='none'; action(); };
  btnsEl.appendChild(main);
  // Ekstra butonlar
  if (extraButtons) extraButtons.forEach(eb => {
    const b = document.createElement('button');
    b.className = 'overlay-btn ' + (eb.cls || 'secondary');
    b.textContent = eb.label;
    b.onclick = () => { document.getElementById('overlay').classList.add('hidden'); document.getElementById('overlay').style.display='none'; eb.action(); };
    btnsEl.appendChild(b);
  });
  const ov = document.getElementById('overlay');
  ov.classList.remove('hidden');
  ov.style.setProperty('display', 'flex', 'important');
}

const EUROPE_COUNTRY_SET = new Set(['Türkiye','Rusya','Almanya','Fransa','İngiltere','İtalya','İspanya','Portekiz','Hollanda','Belçika','İsviçre','Avusturya','Polonya','Çekya','Macaristan','Romanya','Bulgaristan','Yunanistan','İsveç','Norveç','Finlandiya','Danimarka','İrlanda','Ukrayna','Belarus','Litvanya','Letonya','Estonya','Moldova','Sırbistan','Hırvatistan','Bosna','Karadağ','Kuzey Makedonya','Arnavutluk','Slovakya','Slovenya','Kıbrıs','Lüksemburg','Malta','İzlanda','Kosova','Monako','Andorra','San Marino','Liechtenstein','Vatikan']);
const EXTRA_EUROPE_CITIES = [
  // Türkiye şehirleri (CITIES'takiler dışında ekstra)
  {"name": "Eskişehir", "country": "Türkiye", "lat": 39.78, "lon": 30.52}, {"name": "Samsun", "country": "Türkiye", "lat": 41.29, "lon": 36.33}, {"name": "Kayseri", "country": "Türkiye", "lat": 38.72, "lon": 35.49}, {"name": "Mersin", "country": "Türkiye", "lat": 36.8, "lon": 34.63}, {"name": "Diyarbakır", "country": "Türkiye", "lat": 37.91, "lon": 40.23}, {"name": "Trabzon", "country": "Türkiye", "lat": 41.00, "lon": 39.72}, {"name": "Erzurum", "country": "Türkiye", "lat": 39.91, "lon": 41.27}, {"name": "Malatya", "country": "Türkiye", "lat": 38.35, "lon": 38.32}, {"name": "Şanlıurfa", "country": "Türkiye", "lat": 37.16, "lon": 38.79}, {"name": "Hatay", "country": "Türkiye", "lat": 36.20, "lon": 36.16},
  // Batı Rusya şehirleri
  {"name": "Moskova", "country": "Rusya", "lat": 55.75, "lon": 37.62}, {"name": "St. Petersburg", "country": "Rusya", "lat": 59.93, "lon": 30.32}, {"name": "Nizhny Novgorod", "country": "Rusya", "lat": 56.33, "lon": 44.00}, {"name": "Kazan", "country": "Rusya", "lat": 55.79, "lon": 49.12}, {"name": "Samara", "country": "Rusya", "lat": 53.20, "lon": 50.15}, {"name": "Rostov-na-Donu", "country": "Rusya", "lat": 47.23, "lon": 39.72}, {"name": "Voronej", "country": "Rusya", "lat": 51.67, "lon": 39.18}, {"name": "Volgograd", "country": "Rusya", "lat": 48.71, "lon": 44.51}, {"name": "Perm", "country": "Rusya", "lat": 58.01, "lon": 56.25}, {"name": "Krasnodar", "country": "Rusya", "lat": 45.04, "lon": 38.98}, {"name": "Kaliningrad", "country": "Rusya", "lat": 54.71, "lon": 20.51}, {"name": "Ufa", "country": "Rusya", "lat": 54.74, "lon": 55.97}, {"name": "Saratov", "country": "Rusya", "lat": 51.54, "lon": 46.00}, {"name": "Yaroslavl", "country": "Rusya", "lat": 57.63, "lon": 39.87}, {"name": "Penza", "country": "Rusya", "lat": 53.20, "lon": 45.00}, {"name": "Ryazan", "country": "Rusya", "lat": 54.63, "lon": 39.72}, {"name": "Astrakhan", "country": "Rusya", "lat": 46.35, "lon": 48.04}, {"name": "Kirov", "country": "Rusya", "lat": 58.60, "lon": 49.65},
  // Diğer Avrupa şehirleri
  {"name": "Leipzig", "country": "Almanya", "lat": 51.34, "lon": 12.37}, {"name": "Dresden", "country": "Almanya", "lat": 51.05, "lon": 13.74}, {"name": "Hannover", "country": "Almanya", "lat": 52.37, "lon": 9.73}, {"name": "Bremen", "country": "Almanya", "lat": 53.08, "lon": 8.8}, {"name": "Nürnberg", "country": "Almanya", "lat": 49.45, "lon": 11.08}, {"name": "Lille", "country": "Fransa", "lat": 50.63, "lon": 3.06}, {"name": "Nantes", "country": "Fransa", "lat": 47.22, "lon": -1.55}, {"name": "Strazburg", "country": "Fransa", "lat": 48.58, "lon": 7.75}, {"name": "Montpellier", "country": "Fransa", "lat": 43.61, "lon": 3.88}, {"name": "Rennes", "country": "Fransa", "lat": 48.11, "lon": -1.68}, {"name": "Bristol", "country": "İngiltere", "lat": 51.45, "lon": -2.59}, {"name": "Sheffield", "country": "İngiltere", "lat": 53.38, "lon": -1.47}, {"name": "Edinburgh", "country": "İngiltere", "lat": 55.95, "lon": -3.19}, {"name": "Newcastle", "country": "İngiltere", "lat": 54.98, "lon": -1.61}, {"name": "Cardiff", "country": "İngiltere", "lat": 51.48, "lon": -3.18}, {"name": "Floransa", "country": "İtalya", "lat": 43.77, "lon": 11.26}, {"name": "Bari", "country": "İtalya", "lat": 41.12, "lon": 16.87}, {"name": "Verona", "country": "İtalya", "lat": 45.44, "lon": 10.99}, {"name": "Venedik", "country": "İtalya", "lat": 45.44, "lon": 12.33}, {"name": "Katanya", "country": "İtalya", "lat": 37.51, "lon": 15.08}, {"name": "Sevilla", "country": "İspanya", "lat": 37.39, "lon": -5.99}, {"name": "Malaga", "country": "İspanya", "lat": 36.72, "lon": -4.42}, {"name": "Bilbao", "country": "İspanya", "lat": 43.26, "lon": -2.93}, {"name": "Zaragoza", "country": "İspanya", "lat": 41.65, "lon": -0.89}, {"name": "Murcia", "country": "İspanya", "lat": 37.98, "lon": -1.13}, {"name": "Braga", "country": "Portekiz", "lat": 41.55, "lon": -8.42}, {"name": "Coimbra", "country": "Portekiz", "lat": 40.2, "lon": -8.41}, {"name": "Faro", "country": "Portekiz", "lat": 37.02, "lon": -7.93}, {"name": "Lahey", "country": "Hollanda", "lat": 52.08, "lon": 4.3}, {"name": "Utrecht", "country": "Hollanda", "lat": 52.09, "lon": 5.12}, {"name": "Eindhoven", "country": "Hollanda", "lat": 51.44, "lon": 5.48}, {"name": "Groningen", "country": "Hollanda", "lat": 53.22, "lon": 6.57}, {"name": "Anvers", "country": "Belçika", "lat": 51.22, "lon": 4.4}, {"name": "Gent", "country": "Belçika", "lat": 51.05, "lon": 3.72}, {"name": "Brugge", "country": "Belçika", "lat": 51.21, "lon": 3.22}, {"name": "Liège", "country": "Belçika", "lat": 50.63, "lon": 5.58}, {"name": "Basel", "country": "İsviçre", "lat": 47.56, "lon": 7.59}, {"name": "Lozan", "country": "İsviçre", "lat": 46.52, "lon": 6.63}, {"name": "Bern", "country": "İsviçre", "lat": 46.95, "lon": 7.45}, {"name": "Graz", "country": "Avusturya", "lat": 47.07, "lon": 15.44}, {"name": "Linz", "country": "Avusturya", "lat": 48.31, "lon": 14.29}, {"name": "Innsbruck", "country": "Avusturya", "lat": 47.27, "lon": 11.4}, {"name": "Gdansk", "country": "Polonya", "lat": 54.35, "lon": 18.65}, {"name": "Wroclaw", "country": "Polonya", "lat": 51.11, "lon": 17.03}, {"name": "Lodz", "country": "Polonya", "lat": 51.76, "lon": 19.46}, {"name": "Poznan", "country": "Polonya", "lat": 52.41, "lon": 16.93}, {"name": "Szczecin", "country": "Polonya", "lat": 53.43, "lon": 14.55}, {"name": "Brno", "country": "Çekya", "lat": 49.2, "lon": 16.61}, {"name": "Ostrava", "country": "Çekya", "lat": 49.82, "lon": 18.26}, {"name": "Debrecen", "country": "Macaristan", "lat": 47.53, "lon": 21.63}, {"name": "Szeged", "country": "Macaristan", "lat": 46.25, "lon": 20.15}, {"name": "Kaloşvar", "country": "Romanya", "lat": 46.77, "lon": 23.59}, {"name": "Timişoara", "country": "Romanya", "lat": 45.75, "lon": 21.23}, {"name": "Iaşi", "country": "Romanya", "lat": 47.16, "lon": 27.59}, {"name": "Köstence", "country": "Romanya", "lat": 44.18, "lon": 28.65}, {"name": "Plovdiv", "country": "Bulgaristan", "lat": 42.14, "lon": 24.75}, {"name": "Varna", "country": "Bulgaristan", "lat": 43.21, "lon": 27.91}, {"name": "Patras", "country": "Yunanistan", "lat": 38.25, "lon": 21.73}, {"name": "Heraklion", "country": "Yunanistan", "lat": 35.34, "lon": 25.13}, {"name": "Larisa", "country": "Yunanistan", "lat": 39.64, "lon": 22.42}, {"name": "Göteborg", "country": "İsveç", "lat": 57.71, "lon": 11.97}, {"name": "Malmö", "country": "İsveç", "lat": 55.61, "lon": 13.0}, {"name": "Uppsala", "country": "İsveç", "lat": 59.86, "lon": 17.64}, {"name": "Bergen", "country": "Norveç", "lat": 60.39, "lon": 5.32}, {"name": "Trondheim", "country": "Norveç", "lat": 63.43, "lon": 10.4}, {"name": "Stavanger", "country": "Norveç", "lat": 58.97, "lon": 5.73}, {"name": "Tampere", "country": "Finlandiya", "lat": 61.5, "lon": 23.76}, {"name": "Turku", "country": "Finlandiya", "lat": 60.45, "lon": 22.27}, {"name": "Oulu", "country": "Finlandiya", "lat": 65.01, "lon": 25.47}, {"name": "Aarhus", "country": "Danimarka", "lat": 56.16, "lon": 10.2}, {"name": "Odense", "country": "Danimarka", "lat": 55.4, "lon": 10.39}, {"name": "Cork", "country": "İrlanda", "lat": 51.9, "lon": -8.47}, {"name": "Galway", "country": "İrlanda", "lat": 53.27, "lon": -9.05}, {"name": "Lviv", "country": "Ukrayna", "lat": 49.84, "lon": 24.03}, {"name": "Harkiv", "country": "Ukrayna", "lat": 49.99, "lon": 36.23}, {"name": "Odesa", "country": "Ukrayna", "lat": 46.48, "lon": 30.72}, {"name": "Dnipro", "country": "Ukrayna", "lat": 48.46, "lon": 35.05}, {"name": "Grodno", "country": "Belarus", "lat": 53.67, "lon": 23.83}, {"name": "Gomel", "country": "Belarus", "lat": 52.43, "lon": 30.99}, {"name": "Kaunas", "country": "Litvanya", "lat": 54.9, "lon": 23.9}, {"name": "Daugavpils", "country": "Letonya", "lat": 55.87, "lon": 26.53}, {"name": "Tartu", "country": "Estonya", "lat": 58.38, "lon": 26.73}, {"name": "Belgrad", "country": "Sırbistan", "lat": 44.81, "lon": 20.46}, {"name": "Novi Sad", "country": "Sırbistan", "lat": 45.27, "lon": 19.83}, {"name": "Zagreb", "country": "Hırvatistan", "lat": 45.81, "lon": 15.98}, {"name": "Split", "country": "Hırvatistan", "lat": 43.51, "lon": 16.44}, {"name": "Saraybosna", "country": "Bosna", "lat": 43.86, "lon": 18.41}, {"name": "Podgorica", "country": "Karadağ", "lat": 42.43, "lon": 19.26}, {"name": "Üsküp", "country": "Kuzey Makedonya", "lat": 41.99, "lon": 21.43}, {"name": "Tiran", "country": "Arnavutluk", "lat": 41.33, "lon": 19.82}, {"name": "Priştine", "country": "Kosova", "lat": 42.66, "lon": 21.16}, {"name": "Bratislava", "country": "Slovakya", "lat": 48.15, "lon": 17.11}, {"name": "Ljubljana", "country": "Slovenya", "lat": 46.05, "lon": 14.51}, {"name": "Kişinev", "country": "Moldova", "lat": 47.01, "lon": 28.86}, {"name": "Lefkoşa", "country": "Kıbrıs", "lat": 35.18, "lon": 33.36}, {"name": "Limasol", "country": "Kıbrıs", "lat": 34.68, "lon": 33.04}, {"name": "Larnaka", "country": "Kıbrıs", "lat": 34.92, "lon": 33.63}, {"name": "Reykjavik", "country": "İzlanda", "lat": 64.15, "lon": -21.94}, {"name": "Valletta", "country": "Malta", "lat": 35.9, "lon": 14.51}, {"name": "Lüksemburg", "country": "Lüksemburg", "lat": 49.61, "lon": 6.13}, {"name": "Andorra la Vella", "country": "Andorra", "lat": 42.51, "lon": 1.52}, {"name": "Monako", "country": "Monako", "lat": 43.74, "lon": 7.42}, {"name": "San Marino", "country": "San Marino", "lat": 43.94, "lon": 12.45}, {"name": "Vaduz", "country": "Liechtenstein", "lat": 47.14, "lon": 9.52}, {"name": "Vatikan", "country": "Vatikan", "lat": 41.9, "lon": 12.45}
];
const EUROPE_CITIES = [...CITIES.filter(c => EUROPE_COUNTRY_SET.has(c.country)), ...EXTRA_EUROPE_CITIES];
const EUROPE_CAPITALS = new Set(['Ankara','Moskova','Berlin','Paris','Londra','Roma','Madrid','Lizbon','Amsterdam','Brüksel','Bern','Viyana','Varşova','Prag','Budapeşte','Bükreş','Sofya','Atina','Stockholm','Oslo','Helsinki','Kopenhag','Dublin','Kiev','Minsk','Vilnius','Riga','Tallinn','Kişinev','Belgrad','Zagreb','Saraybosna','Podgorica','Üsküp','Tiran','Bratislava','Ljubljana','Lefkoşa','Lüksemburg','Valletta','Reykjavik','Priştine','Monako','Andorra la Vella','San Marino','Vaduz','Vatikan']);
const CAPITALS = new Set([
  "Ankara","Moskova","Berlin","Paris","Londra","Roma","Madrid","Kiev","Varşova",
  "Bükreş","Amsterdam","Brüksel","Atina","Lizbon","Prag","Budapeşte","Stokholm",
  "Minsk","Viyana","Belgrad","Sofya","Kopenhag","Helsinki","Oslo","Bratislava",
  "Zagreb","Kişinev","Saraybosna","Tiran","Riga","Vilnius","Tallinn","Dublin",
  "Tiflis","Erivan","Bakü","Üsküp","Podgorica","Ljubljana","Bern","Pekin",
  "Delhi","Tokyo","Jakarta","İslamabad","Dhaka","Manila","Tahran","Bağdat",
  "Riyad","Taşkent","Kabil","Kuala Lumpur","Bangkok","Hanoi","Singapur","Seul",
  "Pyongyang","Amman","Tel Aviv","Beyrut","Şam","Doha","Kuveyt","Maskat",
  "Manama","Aşkabat","Bişkek","Duşanbe","Ulan Batur","Phnom Penh","Vientiane",
  "Kahire","Lagos","Abuja","Addis Ababa","Kinshasa","Dar es Salaam","Nairobi",
  "Johannesburg","Hartum","Cezayir","Kampala","Casablanca","Rabat","Accra",
  "Maputo","Luanda","Antananarivo","Yaounde","Abidjan","Niamey","Ouagadougou",
  "Bamako","Lilongwe","Dakar","Lusaka","Harare","N'Djamena","Kigali","Tunus",
  "Mogadişu","Asmara","Cibuti","Gaborone","Windhoek","Freetown","Monrovia",
  "Konakri","Libreville","Brazzaville","Bangui","Cotonou","Lome","Trablus","Sana",
  "New York","Washington DC","Toronto","Ottawa","Mexico City","Sao Paulo","Brasilia",
  "Buenos Aires","Bogota","Santiago","Lima","Caracas","Quito","La Paz","Asuncion",
  "Montevideo","Havana","Santo Domingo","Port-au-Prince","Guatemala City",
  "Tegucigalpa","San Salvador","Managua","San Jose","Panama City","Kingston",
  "Port of Spain","Sidney","Wellington","Port Moresby","Suva","Lefkosa"
]);

function weightedPickFromPool(pool, capitalsSet) {
  const total = pool.reduce((a, c) => a + (capitalsSet.has(c.name) ? 1.5 : 1), 0);
  let r = Math.random() * total;
  for (let _i=0; _i<pool.length; _i++) {
    const c = pool[_i];
    r -= capitalsSet.has(c.name) ? 1.5 : 1;
    if (r <= 0) return c;
  }
  return pool[pool.length - 1];
}

function weightedPick() {
  return weightedPickFromPool(CITIES, CAPITALS);
}

function pickQuestions(n) {
  const picked = [];
  for (let i = 0; i < n; i++) picked.push(weightedPick());
  return picked;
}

function pickEuropeQuestions(n) {
  const picked = [];
  for (let i = 0; i < n; i++) picked.push(weightedPickFromPool(EUROPE_CITIES, EUROPE_CAPITALS));
  return picked;
}

function pickTurkeyQuestions(n) {
  var pool = TURKEY_DISTRICTS.slice();
  for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(Math.random()*(i+1)); var tmp=pool[i]; pool[i]=pool[j]; pool[j]=tmp; }
  var picked = [];
  for (var k = 0; k < n; k++) picked.push(pool[k % pool.length]);
  return picked;
}

function startLevel(){
  // Overlay'i kapat
  const ov = document.getElementById('overlay');
  if (ov) { ov.classList.add('hidden'); ov.style.display = 'none'; }
  state.levelScore=0; state.questionIndex=0; state.answered=false; state.combo=0;
  const n = getLevelConfig(state.level).questions;
  state.questions = gameMode === 'turkey' ? pickTurkeyQuestions(n) : gameMode === 'europe' ? pickEuropeQuestions(n) : gameMode === 'landmark' ? pickLandmarkQuestions(n) : pickQuestions(n);
  clearMarkers(); updateTopBar(); updateComboUI(); loadQuestion();
  // Tüm soruların fotoğraflarını arka planda önceden yükle
  if (gameMode === 'landmark') {
    const _allQs = state.questions.slice();
    let _prefetchIdx = 0;
    // Sırayla yükle — paralel yaparsa Wikipedia rate-limit'e takılır
    function _prefetchNext() {
      if (_prefetchIdx >= _allQs.length) return;
      const _pn = _allQs[_prefetchIdx].name_en || _allQs[_prefetchIdx].name;
      _prefetchIdx++;
      if (!_lpoPhotoCache[_pn]) {
        fetchLandmarkPhoto(_pn).then(() => setTimeout(_prefetchNext, 400));
      } else {
        setTimeout(_prefetchNext, 50);
      }
    }
    setTimeout(_prefetchNext, 200);
  }
}

function loadQuestion(){
  state.answered=false; clearMarkers();
  downX=null; downY=null;
  const city=state.questions[state.questionIndex];
  if (gameMode === 'turkey') {
    document.getElementById('city-name').textContent = city.name.toUpperCase();
    document.getElementById('city-country').textContent = city.city.toUpperCase();
    document.getElementById('question-text').textContent = t('markDistrict');
  } else if (gameMode === 'landmark') {
    const lname = lang === 'en' ? (city.name_en || city.name) : city.name;
    document.getElementById('city-name').textContent = lname.toUpperCase();
    document.getElementById('city-country').textContent = '';
    document.getElementById('question-text').textContent = t('markLandmark');
  } else {
    document.getElementById('city-name').textContent=cityDisplayName(city).toUpperCase();
    document.getElementById('city-country').textContent=countryDisplayName(city).toUpperCase();
    document.getElementById('question-text').textContent = t('markCity');
  }
  updateTopBar();
  // Harita göster/gizle
  if (gameMode === 'turkey') {
    document.getElementById('world-svg').style.display = 'none';
    document.getElementById('turkey-svg').style.display = 'block';
    document.getElementById('europe-svg').style.display = 'none';
    document.getElementById('europe-svg').style.display = 'none';
    if (!turkeyMapLoaded) loadTurkeyMap();
  } else if (gameMode === 'europe') {
    document.getElementById('world-svg').style.display = 'none';
    document.getElementById('turkey-svg').style.display = 'none';
    document.getElementById('europe-svg').style.display = 'block';
    focusEuropeMap(true);
  } else {
    document.getElementById('world-svg').style.display = 'block';
    document.getElementById('turkey-svg').style.display = 'none';
    document.getElementById('europe-svg').style.display = 'none';
    document.getElementById('europe-svg').style.display = 'none';
    resetWorldMap(true);
  }
  // Landmark modda fotoğraf göster, sonra timer başlat
  if (gameMode === 'landmark') {
    const _lCity = state.questions[state.questionIndex];
    if (_lCity) {
      showLandmarkPhoto(_lCity, () => startTimer());
    } else {
      startTimer();
    }
  } else {
    startTimer();
  }
}

let _lpoTimer = null;
let _lpoOnDone = null;
const _lpoPhotoCache = {}; // name_en -> url cache

// Statik fotoğraf override tablosu — Wikipedia API sorun çıkaran landmark'lar için
const _LANDMARK_PHOTO_OVERRIDES = {
  "Maldives":              "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Aerial_view_of_the_Maldives.jpg/800px-Aerial_view_of_the_Maldives.jpg",
  "Hierapolis":            "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Pamukkale_Hierapolis.jpg/800px-Pamukkale_Hierapolis.jpg",
  "Ephesus":               "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Ephesus_Celsus_Library_Facade.jpg/800px-Ephesus_Celsus_Library_Facade.jpg",
  "Prague Castle":         "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Prague_Castle_from_Letna_2017.jpg/800px-Prague_Castle_from_Letna_2017.jpg",
  "Geirangerfjord":        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Geiranger_fjord%2C_Norway.jpg/800px-Geiranger_fjord%2C_Norway.jpg",
  "Uluru":                 "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Uluru_Australia_%28Ayers_Rock%29.jpg/800px-Uluru_Australia_%28Ayers_Rock%29.jpg",
  "Western Wall":          "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Jerusalem-2013%281%29-Aerial-Temple_Mount-Dome_of_the_Rock.jpg/800px-Jerusalem-2013%281%29-Aerial-Temple_Mount-Dome_of_the_Rock.jpg",
  "Alhambra":              "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Alhambra_evening_panorama_Mirador_San_Nicolas_sRGB-1.jpg/800px-Alhambra_evening_panorama_Mirador_San_Nicolas_sRGB-1.jpg",
  "Torres del Paine National Park": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Macizo_Paine_y_lago_Pe%C3%B1o%C3%ADlez.jpg/800px-Macizo_Paine_y_lago_Pe%C3%B1o%C3%ADlez.jpg",
  "Zhangjiajie National Forest Park": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Zhangjiajie_-_Tianzi_Mountain.jpg/800px-Zhangjiajie_-_Tianzi_Mountain.jpg",
  "Göreme":                "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/G%C3%B6reme_valley_Cappadocia.jpg/800px-G%C3%B6reme_valley_Cappadocia.jpg",
  "Serengeti":             "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Serengeti_Wildebeest_Migration.jpg/800px-Serengeti_Wildebeest_Migration.jpg",
  "Wadi Rum":              "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Wadi_Rum_Valley.jpg/800px-Wadi_Rum_Valley.jpg",
  "Aurora borealis":       "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Polarlicht_2.jpg/800px-Polarlicht_2.jpg",
  "Pamukkale":             "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Pamukkale_Landscape.jpg/800px-Pamukkale_Landscape.jpg",
  "Hạ Long Bay":           "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Ha_long_bay_2.jpg/800px-Ha_long_bay_2.jpg",
  "Sahara":                "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Sahara_desert_erg.jpg/800px-Sahara_desert_erg.jpg",
  "Bagan":                 "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Bagan%2C_Burma_%2810505878955%29.jpg/800px-Bagan%2C_Burma_%2810505878955%29.jpg",
  "Chernobyl Exclusion Zone": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Chernobyl_2019_G03.jpg/800px-Chernobyl_2019_G03.jpg",
};


async function fetchLandmarkPhoto(nameEn) {
  if (_lpoPhotoCache[nameEn]) return _lpoPhotoCache[nameEn];
  // Statik override — API'ye gitmeden anında yükle
  if (_LANDMARK_PHOTO_OVERRIDES[nameEn]) {
    const url = _LANDMARK_PHOTO_OVERRIDES[nameEn];
    _lpoPhotoCache[nameEn] = url;
    const preloader = new Image(); preloader.src = url;
    return url;
  }
  try {
    const q = encodeURIComponent(nameEn);
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${q}`,
      { signal: controller.signal }
    );
    clearTimeout(t);
    if (!res.ok) throw new Error('wiki ' + res.status);
    const data = await res.json();
    let url = data.originalimage?.source || data.thumbnail?.source || null;
    if (url && url.includes('/thumb/')) {
      // Thumbnail'i makul boyuta getir (800px — yeterince hızlı, yeterince kaliteli)
      url = url.replace(/\/\d+px-([^/]+)$/, '/800px-$1');
    }
    if (url) {
      // Görseli arka planda önceden yükle (browser cache'e al)
      const preloader = new Image();
      preloader.src = url;
      _lpoPhotoCache[nameEn] = url;
    }
    return url || null;
  } catch(e) {
    console.warn('[LPO] wiki fetch failed:', nameEn, e.message);
    return null;
  }
}

// Sonraki sorunun fotoğrafını arka planda ön yükle
function prefetchNextLandmarkPhoto() {
  if (gameMode !== 'landmark') return;
  const nextIdx = state.questionIndex + 1;
  if (!state.questions || nextIdx >= state.questions.length) return;
  const next = state.questions[nextIdx];
  if (!next) return;
  const nameEn = next.name_en || next.name;
  if (_lpoPhotoCache[nameEn]) return;
  fetchLandmarkPhoto(nameEn); // fire and forget
}

function lpoStartAt(ts) {
  const overlay = document.getElementById('landmark-photo-overlay');
  const bar     = document.getElementById('lpo-bar');
  const hint    = document.getElementById('lpo-hint');
  const DURATION = 3000;
  const now = Date.now();
  const remaining = Math.max(100, ts + DURATION - now);

  hint.textContent = lang === 'en' ? 'Mark the location on the map →' : 'Haritada konumu işaretle →';
  bar.style.transition = 'none';
  bar.style.width = ((DURATION - remaining) / DURATION * 100) + '%';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    bar.style.transition = `width ${remaining}ms linear`;
    bar.style.width = '100%';
  }));

  if (_lpoTimer) clearTimeout(_lpoTimer);
  _lpoTimer = setTimeout(() => {
    overlay.classList.remove('show');
    const qb = document.getElementById('question-banner');
    if (qb) qb.style.visibility = 'visible';
    state.answered = false;
    if (_lpoOnDone) { const fn = _lpoOnDone; _lpoOnDone = null; fn(); }
    // Soru başlayınca sonrakini arka planda yükle
    setTimeout(prefetchNextLandmarkPhoto, 500);
  }, remaining);
}

async function showLandmarkPhoto(city, onDone) {
  const overlay = document.getElementById('landmark-photo-overlay');
  const img     = document.getElementById('lpo-img');
  const nameEl  = document.getElementById('lpo-name');
  const bar     = document.getElementById('lpo-bar');
  const hint    = document.getElementById('lpo-hint');

  state.answered = true;
  _lpoOnDone = onDone;

  const displayName = lang === 'en' ? (city.name_en || city.name) : city.name;
  nameEl.textContent = displayName.toUpperCase();
  hint.textContent   = lang === 'en' ? 'Loading photo…' : 'Fotoğraf yükleniyor…';
  bar.style.transition = 'none';
  bar.style.width = '0%';
  img.src = '';
  img.style.display = 'none';
  // Fotoğraf açılınca soru banner'ını gizle (çift isim önleme)
  const qBanner = document.getElementById('question-banner');
  if (qBanner) qBanner.style.visibility = 'hidden';
  overlay.classList.add('show');

  // Wikipedia'dan fotoğraf çek
  const nameEn = city.name_en || city.name;
  const photoUrl = await fetchLandmarkPhoto(nameEn);

  if (!photoUrl) {
    // Fotoğraf bulunamadı — geç
    overlay.classList.remove('show');
    const qbN = document.getElementById('question-banner');
    if (qbN) qbN.style.visibility = 'visible';
    state.answered = false;
    _lpoOnDone = null;
    onDone();
    return;
  }

  // Resmi yükle
  const loader = new Image();
  let _done = false;

  const _timeout = setTimeout(() => {
    if (_done) return;
    _done = true;
    console.warn('[LPO] load timeout');
    overlay.classList.remove('show');
    const qbT = document.getElementById('question-banner');
    if (qbT) qbT.style.visibility = 'visible';
    state.answered = false;
    _lpoOnDone = null;
    onDone();
  }, 15000);

  loader.onload = () => {
    if (_done) return;
    _done = true;
    clearTimeout(_timeout);
    img.src = photoUrl;
    img.style.display = 'block';
    if (typeof mpGameActive !== 'undefined' && mpGameActive && mpLobbyId) {
      hint.textContent = lang === 'en' ? 'Waiting for others…' : 'Diğerleri bekleniyor…';
      const qIdx = state.questionIndex;
      db.collection('mp_lobbies').doc(mpLobbyId).update({
        [`photoReady.${currentUser.username}`]: qIdx
      }).catch(e => console.error('photoReady write error', e));
    } else {
      lpoStartAt(Date.now());
    }
  };

  loader.onerror = () => {
    if (_done) return;
    _done = true;
    clearTimeout(_timeout);
    overlay.classList.remove('show');
    const qbErr = document.getElementById('question-banner');
    if (qbErr) qbErr.style.visibility = 'visible';
    state.answered = false;
    _lpoOnDone = null;
    onDone();
  };

  loader.src = photoUrl;
}

// ===== OYUN MODU =====
let gameMode = 'world'; // 'world' | 'turkey'

// ===== TÜRKİYE İLÇELERİ =====
// format: {name, city, lat, lon}
// Kural: Her ilin merkez ilçesi + ek ilçeler
// Büyük şehirler: merkez + 2 ek; diğerleri: merkez + 1 ek
const TURKEY_DISTRICTS = [
  // ADANA (büyük)
  {name:"Seyhan",city:"Adana",lat:37.002,lon:35.321},{name:"Çukurova",city:"Adana",lat:37.060,lon:35.396},{name:"Kozan",city:"Adana",lat:37.452,lon:35.814},
  // ADIYAMAN
  {name:"Merkez",city:"Adıyaman",lat:37.764,lon:38.276},{name:"Kahta",city:"Adıyaman",lat:37.784,lon:38.619},
  // AFYONKARAHİSAR
  {name:"Merkez",city:"Afyonkarahisar",lat:38.757,lon:30.540},{name:"Sandıklı",city:"Afyonkarahisar",lat:38.460,lon:30.262},
  // AĞRI
  {name:"Merkez",city:"Ağrı",lat:39.719,lon:43.051},{name:"Doğubayazıt",city:"Ağrı",lat:39.547,lon:44.088},
  // AMASYA
  {name:"Merkez",city:"Amasya",lat:40.649,lon:35.833},{name:"Merzifon",city:"Amasya",lat:40.875,lon:35.464},
  // ANKARA (büyük)
  {name:"Çankaya",city:"Ankara",lat:39.906,lon:32.863},{name:"Keçiören",city:"Ankara",lat:39.978,lon:32.876},{name:"Polatlı",city:"Ankara",lat:39.584,lon:32.146},
  // ANTALYA (büyük)
  {name:"Muratpaşa",city:"Antalya",lat:36.886,lon:30.701},{name:"Alanya",city:"Antalya",lat:36.544,lon:32.000},{name:"Manavgat",city:"Antalya",lat:36.786,lon:31.441},
  // ARTVİN
  {name:"Merkez",city:"Artvin",lat:41.182,lon:41.820},{name:"Hopa",city:"Artvin",lat:41.412,lon:41.426},
  // AYDIN
  {name:"Efeler",city:"Aydın",lat:37.844,lon:27.845},{name:"Kuşadası",city:"Aydın",lat:37.858,lon:27.259},
  // BALIKESİR
  {name:"Altıeylül",city:"Balıkesir",lat:39.649,lon:27.888},{name:"Bandırma",city:"Balıkesir",lat:40.352,lon:27.977},
  // BİLECİK
  {name:"Merkez",city:"Bilecik",lat:40.150,lon:29.979},{name:"Bozüyük",city:"Bilecik",lat:39.907,lon:30.039},
  // BİNGÖL
  {name:"Merkez",city:"Bingöl",lat:38.885,lon:40.499},{name:"Solhan",city:"Bingöl",lat:38.962,lon:41.056},
  // BİTLİS
  {name:"Merkez",city:"Bitlis",lat:38.401,lon:42.107},{name:"Tatvan",city:"Bitlis",lat:38.508,lon:42.279},
  // BOLU (büyük)
  {name:"Merkez",city:"Bolu",lat:40.576,lon:31.579},{name:"Gerede",city:"Bolu",lat:40.797,lon:32.196},{name:"Mudurnu",city:"Bolu",lat:40.460,lon:31.211},
  // BURDUR
  {name:"Merkez",city:"Burdur",lat:37.720,lon:30.291},{name:"Bucak",city:"Burdur",lat:37.458,lon:30.591},
  // BURSA (büyük)
  {name:"Osmangazi",city:"Bursa",lat:40.183,lon:29.051},{name:"Nilüfer",city:"Bursa",lat:40.213,lon:28.966},{name:"İnegöl",city:"Bursa",lat:40.076,lon:29.513},
  // ÇANAKKALE (büyük)
  {name:"Merkez",city:"Çanakkale",lat:40.155,lon:26.413},{name:"Gelibolu",city:"Çanakkale",lat:40.418,lon:26.671},{name:"Biga",city:"Çanakkale",lat:40.228,lon:27.247},
  // ÇANKIRI
  {name:"Merkez",city:"Çankırı",lat:40.601,lon:33.615},{name:"Ilgaz",city:"Çankırı",lat:40.920,lon:33.619},
  // ÇORUM
  {name:"Merkez",city:"Çorum",lat:40.549,lon:34.955},{name:"Sungurlu",city:"Çorum",lat:40.167,lon:34.373},
  // DENİZLİ
  {name:"Pamukkale",city:"Denizli",lat:37.785,lon:29.097},{name:"Merkezefendi",city:"Denizli",lat:37.774,lon:29.070},
  // DİYARBAKIR (büyük)
  {name:"Bağlar",city:"Diyarbakır",lat:37.924,lon:40.195},{name:"Sur",city:"Diyarbakır",lat:37.909,lon:40.231},{name:"Ergani",city:"Diyarbakır",lat:38.267,lon:39.761},
  // DÜZCE
  {name:"Merkez",city:"Düzce",lat:40.844,lon:31.156},{name:"Akçakoca",city:"Düzce",lat:41.089,lon:31.115},
  // EDİRNE (büyük)
  {name:"Merkez",city:"Edirne",lat:41.677,lon:26.556},{name:"Keşan",city:"Edirne",lat:40.861,lon:26.636},{name:"Uzunköprü",city:"Edirne",lat:41.268,lon:26.689},
  // ELAZIĞ
  {name:"Merkez",city:"Elazığ",lat:38.674,lon:39.223},{name:"Kovancılar",city:"Elazığ",lat:38.718,lon:39.848},
  // ERZİNCAN
  {name:"Merkez",city:"Erzincan",lat:39.730,lon:39.494},{name:"Refahiye",city:"Erzincan",lat:39.906,lon:38.767},
  // ERZURUM (büyük)
  {name:"Yakutiye",city:"Erzurum",lat:39.908,lon:41.270},{name:"Palandöken",city:"Erzurum",lat:39.878,lon:41.259},{name:"Oltu",city:"Erzurum",lat:40.552,lon:41.992},
  // ESKİŞEHİR
  {name:"Tepebaşı",city:"Eskişehir",lat:39.771,lon:30.521},{name:"Sivrihisar",city:"Eskişehir",lat:39.451,lon:31.540},
  // GAZİANTEP (büyük)
  {name:"Şahinbey",city:"Gaziantep",lat:37.062,lon:37.367},{name:"Şehitkamil",city:"Gaziantep",lat:37.095,lon:37.328},{name:"Nizip",city:"Gaziantep",lat:37.009,lon:37.797},
  // GİRESUN
  {name:"Merkez",city:"Giresun",lat:40.912,lon:38.387},{name:"Bulancak",city:"Giresun",lat:40.939,lon:38.233},
  // GÜMÜŞHANE
  {name:"Merkez",city:"Gümüşhane",lat:40.460,lon:39.481},{name:"Kelkit",city:"Gümüşhane",lat:40.130,lon:39.444},
  // HAKKARİ
  {name:"Merkez",city:"Hakkari",lat:37.574,lon:43.740},{name:"Yüksekova",city:"Hakkari",lat:37.572,lon:44.285},
  // HATAY (büyük)
  {name:"Antakya",city:"Hatay",lat:36.202,lon:36.160},{name:"İskenderun",city:"Hatay",lat:36.585,lon:36.165},{name:"Dörtyol",city:"Hatay",lat:36.848,lon:36.223},
  // IĞDIR
  {name:"Merkez",city:"Iğdır",lat:39.921,lon:44.046},{name:"Tuzluca",city:"Iğdır",lat:40.048,lon:43.660},
  // ISPARTA
  {name:"Merkez",city:"Isparta",lat:37.764,lon:30.555},{name:"Eğirdir",city:"Isparta",lat:37.875,lon:30.855},
  // MERSİN (büyük) — eski adı İçel
  {name:"Akdeniz",city:"Mersin",lat:36.814,lon:34.617},{name:"Tarsus",city:"Mersin",lat:36.917,lon:34.894},{name:"Erdemli",city:"Mersin",lat:36.610,lon:34.312},
  // İSTANBUL (büyük)
  {name:"Kadıköy",city:"İstanbul",lat:40.991,lon:29.023},{name:"Fatih",city:"İstanbul",lat:41.019,lon:28.950},{name:"Üsküdar",city:"İstanbul",lat:41.023,lon:29.015},
  // İZMİR (büyük)
  {name:"Konak",city:"İzmir",lat:38.418,lon:27.129},{name:"Bornova",city:"İzmir",lat:38.468,lon:27.216},{name:"Karşıyaka",city:"İzmir",lat:38.460,lon:27.109},
  // KAHRAMANMARAŞ
  {name:"Dulkadiroğlu",city:"Kahramanmaraş",lat:37.576,lon:36.937},{name:"Elbistan",city:"Kahramanmaraş",lat:38.203,lon:37.197},
  // KARABÜK
  {name:"Merkez",city:"Karabük",lat:41.200,lon:32.627},{name:"Safranbolu",city:"Karabük",lat:41.252,lon:32.691},
  // KARAMAN
  {name:"Merkez",city:"Karaman",lat:37.182,lon:33.215},{name:"Ermenek",city:"Karaman",lat:36.638,lon:32.888},
  // KARS
  {name:"Merkez",city:"Kars",lat:40.601,lon:43.097},{name:"Sarıkamış",city:"Kars",lat:40.334,lon:42.589},
  // KASTAMONU
  {name:"Merkez",city:"Kastamonu",lat:41.376,lon:33.777},{name:"Tosya",city:"Kastamonu",lat:41.018,lon:34.030},
  // KAYSERİ (büyük)
  {name:"Kocasinan",city:"Kayseri",lat:38.725,lon:35.487},{name:"Melikgazi",city:"Kayseri",lat:38.730,lon:35.477},{name:"Develi",city:"Kayseri",lat:38.390,lon:35.490},
  // KİLİS
  {name:"Merkez",city:"Kilis",lat:36.718,lon:37.118},{name:"Musabeyli",city:"Kilis",lat:36.838,lon:37.194},
  // KIRKLARELİ (büyük)
  {name:"Merkez",city:"Kırklareli",lat:41.735,lon:27.225},{name:"Lüleburgaz",city:"Kırklareli",lat:41.403,lon:27.355},{name:"Babaeski",city:"Kırklareli",lat:41.433,lon:27.096},
  // KIRŞEHİR
  {name:"Merkez",city:"Kırşehir",lat:39.145,lon:34.160},{name:"Kaman",city:"Kırşehir",lat:39.354,lon:33.722},
  // KOCAELİ (büyük)
  {name:"İzmit",city:"Kocaeli",lat:40.766,lon:29.917},{name:"Gebze",city:"Kocaeli",lat:40.803,lon:29.432},{name:"Darıca",city:"Kocaeli",lat:40.765,lon:29.377},
  // KONYA (büyük)
  {name:"Selçuklu",city:"Konya",lat:37.900,lon:32.490},{name:"Meram",city:"Konya",lat:37.850,lon:32.440},{name:"Ereğli",city:"Konya",lat:37.514,lon:34.049},
  // KÜTAHYA (büyük)
  {name:"Merkez",city:"Kütahya",lat:39.419,lon:29.983},{name:"Tavşanlı",city:"Kütahya",lat:39.547,lon:29.484},{name:"Gediz",city:"Kütahya",lat:39.044,lon:29.414},
  // MALATYA
  {name:"Yeşilyurt",city:"Malatya",lat:38.364,lon:38.312},{name:"Battalgazi",city:"Malatya",lat:38.402,lon:38.383},
  // MANİSA
  {name:"Şehzadeler",city:"Manisa",lat:38.614,lon:27.428},{name:"Akhisar",city:"Manisa",lat:38.917,lon:27.836},
  // MARDİN (büyük)
  {name:"Artuklu",city:"Mardin",lat:37.312,lon:40.733},{name:"Kızıltepe",city:"Mardin",lat:37.191,lon:40.587},{name:"Nusaybin",city:"Mardin",lat:37.079,lon:41.217},
  // MUĞLA (büyük)
  {name:"Menteşe",city:"Muğla",lat:37.215,lon:28.364},{name:"Bodrum",city:"Muğla",lat:37.038,lon:27.430},{name:"Fethiye",city:"Muğla",lat:36.622,lon:29.116},
  // MUŞ
  {name:"Merkez",city:"Muş",lat:38.745,lon:41.494},{name:"Bulanık",city:"Muş",lat:38.943,lon:42.271},
  // NEVŞEHİR
  {name:"Merkez",city:"Nevşehir",lat:38.625,lon:34.724},{name:"Ürgüp",city:"Nevşehir",lat:38.628,lon:34.912},
  // NİĞDE
  {name:"Merkez",city:"Niğde",lat:37.966,lon:34.679},{name:"Bor",city:"Niğde",lat:37.891,lon:34.558},
  // ORDU
  {name:"Altınordu",city:"Ordu",lat:40.984,lon:37.879},{name:"Ünye",city:"Ordu",lat:41.133,lon:37.293},
  // OSMANİYE
  {name:"Merkez",city:"Osmaniye",lat:37.074,lon:36.247},{name:"Kadirli",city:"Osmaniye",lat:37.376,lon:36.098},
  // RİZE
  {name:"Merkez",city:"Rize",lat:41.021,lon:40.523},{name:"Pazar",city:"Rize",lat:41.183,lon:40.880},
  // SAKARYA (büyük)
  {name:"Adapazarı",city:"Sakarya",lat:40.786,lon:30.404},{name:"Serdivan",city:"Sakarya",lat:40.791,lon:30.428},{name:"Hendek",city:"Sakarya",lat:40.799,lon:30.748},
  // SAMSUN (büyük)
  {name:"Atakum",city:"Samsun",lat:41.328,lon:36.265},{name:"İlkadım",city:"Samsun",lat:41.286,lon:36.330},{name:"Bafra",city:"Samsun",lat:41.567,lon:35.907},
  // SİİRT
  {name:"Merkez",city:"Siirt",lat:37.932,lon:41.946},{name:"Kurtalan",city:"Siirt",lat:37.929,lon:41.705},
  // SİNOP
  {name:"Merkez",city:"Sinop",lat:42.023,lon:35.153},{name:"Boyabat",city:"Sinop",lat:41.466,lon:34.770},
  // SİVAS (büyük)
  {name:"Merkez",city:"Sivas",lat:39.748,lon:37.017},{name:"Şarkışla",city:"Sivas",lat:39.341,lon:36.406},{name:"Zara",city:"Sivas",lat:39.898,lon:37.750},
  // ŞANLIURFA (büyük)
  {name:"Haliliye",city:"Şanlıurfa",lat:37.160,lon:38.795},{name:"Karaköprü",city:"Şanlıurfa",lat:37.197,lon:38.812},{name:"Viranşehir",city:"Şanlıurfa",lat:37.237,lon:39.762},
  // ŞIRNAK
  {name:"Merkez",city:"Şırnak",lat:37.518,lon:42.458},{name:"Cizre",city:"Şırnak",lat:37.327,lon:42.187},
  // TEKİRDAĞ (büyük)
  {name:"Süleymanpaşa",city:"Tekirdağ",lat:40.977,lon:27.511},{name:"Çorlu",city:"Tekirdağ",lat:41.159,lon:27.803},{name:"Malkara",city:"Tekirdağ",lat:41.292,lon:26.901},
  // TOKAT
  {name:"Merkez",city:"Tokat",lat:40.313,lon:36.554},{name:"Turhal",city:"Tokat",lat:40.387,lon:36.085},
  // TRABZON (büyük)
  {name:"Ortahisar",city:"Trabzon",lat:41.003,lon:39.724},{name:"Akçaabat",city:"Trabzon",lat:40.998,lon:39.567},{name:"Of",city:"Trabzon",lat:40.948,lon:40.261},
  // TUNCELİ
  {name:"Merkez",city:"Tunceli",lat:39.109,lon:39.548},{name:"Pertek",city:"Tunceli",lat:38.855,lon:39.325},
  // UŞAK
  {name:"Merkez",city:"Uşak",lat:38.682,lon:29.407},{name:"Banaz",city:"Uşak",lat:38.727,lon:29.754},
  // VAN (büyük)
  {name:"İpekyolu",city:"Van",lat:38.495,lon:43.380},{name:"Tuşba",city:"Van",lat:38.500,lon:43.398},{name:"Erciş",city:"Van",lat:38.645,lon:43.358},
  // YALOVA
  {name:"Merkez",city:"Yalova",lat:40.655,lon:29.277},{name:"Çınarcık",city:"Yalova",lat:40.643,lon:29.126},
  // YOZGAT
  {name:"Merkez",city:"Yozgat",lat:39.820,lon:34.808},{name:"Sorgun",city:"Yozgat",lat:39.809,lon:35.187},
  // ZONGULDAK
  {name:"Merkez",city:"Zonguldak",lat:41.454,lon:31.796},{name:"Ereğli",city:"Zonguldak",lat:41.278,lon:31.435},
];

// Türkiye puan sistemi: 0-40km tam puan, 40-140km -3/km, 140+ -2/km
function distanceToScoreTurkey(km) {
  if (km <= 10) return 1000;
  if (km <= 50) return Math.max(0, 1000 - Math.round((km - 10) * 13)); // 10-50: -13/km → 480 at 50km
  if (km <= 150) return Math.max(0, 480 - Math.round((km - 50) * 4));  // 50-150: -4/km → 80 at 150km
  return Math.max(0, 80 - Math.round((km - 150) * 1));                 // 150+: -1/km → 0 at 230km
}

let turkeyMapLoaded = false;
let turkeyMapG = null;

function loadTurkeyMap() {
  return new Promise(async (resolve) => {
    if (turkeyMapLoaded) { resolve(); return; }
    const cont = document.getElementById('map-container');
    const W = cont.clientWidth, H = cont.clientHeight;

    // Önce IndexedDB cache'e bak
    let geo = await _getMapCache('turkey-provinces');
    if (geo) {
      drawTurkeyMap(geo, W, H);
      resolve();
      return;
    }

    // Cache yok — fetch et
    const URLS = [
      'https://raw.githubusercontent.com/cihadturhan/tr-geojson/master/geo/tr-cities-utf8.json',
      'https://cdn.jsdelivr.net/gh/cihadturhan/tr-geojson@master/geo/tr-cities-utf8.json',
      'https://raw.githubusercontent.com/alpers/Turkey-Maps-D3/master/tr-cities.json',
    ];

    for (let ui = 0; ui < URLS.length; ui++) {
      try {
        const r = await fetch(URLS[ui]);
        if (!r.ok) continue;
        geo = await r.json();
        _setMapCache('turkey-provinces', geo); // cache'e kaydet
        drawTurkeyMap(geo, W, H);
        resolve();
        return;
      } catch(e) { continue; }
    }
    // Tümü başarısız — fallback
    drawTurkeyFallback(W, H);
    resolve();
  });
}

function drawTurkeyMap(geo, W, H) {
  const turkeySvgEl = d3.select('#turkey-svg');
  turkeySvgEl.selectAll('*').remove();
  turkeySvgEl.on('.game', null); // önceki handler'ları temizle

  const pad = 30;
  window.turkeyProj = d3.geoMercator().fitExtent([[pad,pad],[W-pad,H-pad]], geo);
  window.turkeyPathFn = d3.geoPath().projection(window.turkeyProj);
  window.turkeyTransform = d3.zoomIdentity;

  const g = turkeySvgEl.append('g').attr('id','turkey-g');
  g.selectAll('path')
    .data(geo.features)
    .enter().append('path')
    .attr('class','turkey-province')
    .attr('d', window.turkeyPathFn);

  window.turkeyMarkersG = turkeySvgEl.append('g').attr('id','turkey-markers-g');

  // Zoom
  window.turkeyZoom = d3.zoom()
    .scaleExtent([1, 20])
    .filter(evt => {
      // Sadece sürükleme/scroll için zoom - single click'i engelleme
      if (evt.type === 'click') return false;
      return !evt.ctrlKey && !evt.button;
    })
    .on('zoom', evt => {
      if (!evt.transform || isNaN(evt.transform.k)) return;
      window.turkeyTransform = evt.transform;
      g.attr('transform', evt.transform);
      if (window.turkeyMarkersG) {
        window.turkeyMarkersG.attr('transform', evt.transform);
        const k = evt.transform.k;
        window.turkeyMarkersG.selectAll('.m-outer').attr('r', 7/k);
        window.turkeyMarkersG.selectAll('.m-inner').attr('r', 3/k);
        window.turkeyMarkersG.selectAll('.distance-line').style('stroke-width', 1.5/k+'px');
      }
    });
  turkeySvgEl.call(window.turkeyZoom);

  // Click: doğrudan SVG üzerinde native addEventListener
  const svgEl2 = document.getElementById('turkey-svg');
  svgEl2._turkeyClickHandler && svgEl2.removeEventListener('click', svgEl2._turkeyClickHandler);
  svgEl2._turkeyClickHandler = function(evt) {
    if (state.answered) return;
    if (!window.turkeyProj) return;
    const rect = svgEl2.getBoundingClientRect();
    // iOS touch desteği
    const clientX = evt.changedTouches ? evt.changedTouches[0].clientX : evt.clientX;
    const clientY = evt.changedTouches ? evt.changedTouches[0].clientY : evt.clientY;
    const px = (clientX - rect.left);
    const py = (clientY - rect.top);
    const t = window.turkeyTransform || d3.zoomIdentity;
    const bx = (px - t.x) / t.k;
    const by = (py - t.y) / t.k;
    const [lon, lat] = window.turkeyProj.invert([bx, by]);
    if (!lon || isNaN(lon) || lon < 24 || lon > 46 || lat < 34 || lat > 43) return;
    handleClickAtLonLat(lon, lat);
  };
  svgEl2.addEventListener('click', svgEl2._turkeyClickHandler);
  svgEl2._turkeyTouchHandler && svgEl2.removeEventListener('touchend', svgEl2._turkeyTouchHandler);
  svgEl2._turkeyTouchHandler = function(evt) {
    evt.preventDefault();
    svgEl2._turkeyClickHandler(evt);
  };
  svgEl2.addEventListener('touchend', svgEl2._turkeyTouchHandler, {passive: false});
  svgEl2._turkeyTouchHandler && svgEl2.removeEventListener('touchend', svgEl2._turkeyTouchHandler);
  svgEl2._turkeyTouchHandler = function(evt) {
    evt.preventDefault();
    svgEl2._turkeyClickHandler(evt);
  };
  svgEl2.addEventListener('touchend', svgEl2._turkeyTouchHandler, {passive: false});

  turkeyMapG = g;
  turkeyMapLoaded = true;

  // Göl ve büyük barajları fetch et
  loadTurkeyLakes(g, window.turkeyProj, geo);
}

function loadTurkeyLakes(provinceG, proj, turkeyGeo) {
  const LAKE_URL = 'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_10m_lakes.geojson';
  
  // Türkiye GeoJSON'ından birleşik outline oluştur (clip için)
  const turkeyOutline = {type:'Feature', geometry: {type:'MultiPolygon', coordinates: turkeyGeo.features.map(f => {
    if (f.geometry.type === 'Polygon') return f.geometry.coordinates;
    if (f.geometry.type === 'MultiPolygon') return f.geometry.coordinates.flat();
    return [];
  }).flat().map(c => [c])}};

  const TURKEY_LAKE_NAMES = ['van','tuz','beyşehir','beysehir','eğirdir','egirdir',
    'burdur','iznik','sapanca','manyas','ulubat','acıgöl','acigol','salda','eber',
    'akşehir','aksehir','seyfe','karamuk'];

  fetch(LAKE_URL).then(r=>r.json()).then(geo=>{
    const lakePath = d3.geoPath().projection(proj);
    
    // Türkiye bbox'ı ile örtüşen gölleri filtrele
    const turkBounds = [[25.5, 35.8],[44.8, 42.2]]; // [min_lon,min_lat],[max_lon,max_lat]
    
    geo.features.forEach(f=>{
      try {
        const name = (f.properties.name || f.properties.Name || '').toLowerCase();
        const b = d3.geoBounds(f);
        const minLon=b[0][0], minLat=b[0][1], maxLon=b[1][0], maxLat=b[1][1];
        
        // Türkiye bbox dışındaysa atla
        if (maxLon < 25.5 || minLon > 44.8 || maxLat < 35.8 || minLat > 42.2) return;
        
        // İsim kontrolü: ya Türkiye'nin bilinen gölü olmalı
        // ya da bbox tamamen Türkiye içinde olmalı
        const isKnownTurkeyLake = TURKEY_LAKE_NAMES.some(n => name.includes(n));
        const isInsideTurkey = minLon > 25.5 && maxLon < 44.8 && minLat > 35.8 && maxLat < 42.2;
        
        if (!isKnownTurkeyLake && !isInsideTurkey) return;
        
        // Göl çok büyükse (Hazar, Karadeniz gibi) atla
        const area = (maxLon-minLon) * (maxLat-minLat);
        if (area > 20) return;
        
        const d = lakePath(f);
        if (!d) return;
        provinceG.append('path').attr('class','turkey-lake-overlay').attr('d',d);
      } catch(e){}
    });
  }).catch(()=>{
    drawTurkeyLakesManual(provinceG, proj);
  });
}

function drawTurkeyLakesManual(provinceG, proj) {
  const LAKES = [
    {name:'Van Gölü', coords:[[43.38,38.35],[43.22,38.12],[43.05,38.08],[42.82,38.18],[42.72,38.42],[42.78,38.68],[43.05,38.88],[43.38,38.98],[43.72,38.92],[44.05,38.75],[44.32,38.52],[44.42,38.28],[44.28,38.02],[44.02,37.88],[43.72,37.85],[43.45,37.95],[43.28,38.18],[43.38,38.35]]},
    {name:'Tuz Gölü', coords:[[33.05,38.10],[32.95,38.28],[32.98,38.52],[33.12,38.68],[33.35,38.78],[33.62,38.80],[33.88,38.72],[34.02,38.52],[34.00,38.28],[33.82,38.10],[33.52,38.02],[33.22,38.05],[33.05,38.10]]},
    {name:'Beyşehir', coords:[[31.48,37.48],[31.42,37.62],[31.45,37.78],[31.55,37.88],[31.72,37.90],[31.88,37.82],[31.95,37.65],[31.88,37.50],[31.72,37.42],[31.55,37.42],[31.48,37.48]]},
    {name:'Eğirdir', coords:[[30.85,37.72],[30.82,37.85],[30.88,37.98],[31.00,38.05],[31.12,38.02],[31.18,37.90],[31.12,37.78],[30.98,37.70],[30.85,37.72]]},
    {name:'İznik', coords:[[29.42,40.20],[29.38,40.30],[29.45,40.42],[29.60,40.48],[29.72,40.45],[29.78,40.35],[29.72,40.22],[29.58,40.15],[29.45,40.18],[29.42,40.20]]},
    {name:'Sapanca', coords:[[30.18,40.60],[30.15,40.68],[30.22,40.72],[30.38,40.74],[30.52,40.70],[30.55,40.62],[30.48,40.55],[30.30,40.52],[30.18,40.57],[30.18,40.60]]},
    {name:'Burdur', coords:[[30.12,37.62],[30.05,37.72],[30.10,37.82],[30.22,37.88],[30.38,37.88],[30.52,37.80],[30.55,37.68],[30.48,37.58],[30.32,37.55],[30.15,37.58],[30.12,37.62]]},
  ];
  const lakePath = d3.geoPath().projection(proj);
  LAKES.forEach(lake=>{
    const ring = lake.coords.slice();
    if (ring[0].join()!==ring[ring.length-1].join()) ring.push(ring[0]);
    const f = {type:'Feature',geometry:{type:'Polygon',coordinates:[ring]}};
    try { provinceG.append('path').attr('class','turkey-lake-overlay').attr('d',lakePath(f)); } catch(e){}
  });
}
