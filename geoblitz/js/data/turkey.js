// Türkiye ilçe verileri ve level config
const LEVEL_CONFIG_WORLD = [
  {questions:3, target:873},
  {questions:4, target:1358},
  {questions:5, target:1885},
  {questions:6, target:2509},
  {questions:7, target:3250},
  {questions:8, target:4123},
  {questions:8, target:4760},
  {questions:8, target:5283},
  {questions:8, target:5865},
  {questions:8, target:6360},
];
LEVEL_CONFIG_TURKEY = [
  {questions:3, target:890},
  {questions:4, target:1385},
  {questions:5, target:1923},
  {questions:6, target:2559},
  {questions:7, target:3315},
  {questions:8, target:4205},
  {questions:8, target:4855},
  {questions:8, target:5389},
  {questions:8, target:5982},
  {questions:8, target:6360},
];
function getLevelConfig(l){ return (gameMode==='turkey' ? LEVEL_CONFIG_TURKEY : gameMode==='landmark' ? LEVEL_CONFIG_LANDMARK : LEVEL_CONFIG_WORLD)[l-1]; }

let state={level:1,levelScore:0,totalScore:0,questionIndex:0,questions:[],answered:false,combo:0};
let timerInterval=null, timerSeconds=0;

let downX=null, downY=null, downTime=null;

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

