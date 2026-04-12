// ===== ÇEVİRİ SİSTEMİ =====
const COUNTRY_EN = {
  "Türkiye":"Turkey","Rusya":"Russia","Almanya":"Germany","Fransa":"France",
  "İngiltere":"United Kingdom","İtalya":"Italy","İspanya":"Spain","Ukrayna":"Ukraine",
  "Polonya":"Poland","Romanya":"Romania","Hollanda":"Netherlands","Belçika":"Belgium",
  "Yunanistan":"Greece","Portekiz":"Portugal","Çekya":"Czechia","Macaristan":"Hungary",
  "İsveç":"Sweden","Avusturya":"Austria","İsviçre":"Switzerland","Sırbistan":"Serbia",
  "Bulgaristan":"Bulgaria","Danimarka":"Denmark","Finlandiya":"Finland","Norveç":"Norway",
  "Slovakya":"Slovakia","Hırvatistan":"Croatia","Moldova":"Moldova","Arnavutluk":"Albania",
  "Letonya":"Latvia","Litvanya":"Lithuania","Estonya":"Estonia","İrlanda":"Ireland",
  "Gürcistan":"Georgia","Ermenistan":"Armenia","Azerbaycan":"Azerbaijan",
  "Kuzey Makedonya":"N. Macedonia","Karadağ":"Montenegro","Slovenya":"Slovenia",
  "Çin":"China","Hindistan":"India","Japonya":"Japan","Endonezya":"Indonesia",
  "Pakistan":"Pakistan","Bangladeş":"Bangladesh","Filipinler":"Philippines",
  "İran":"Iran","Irak":"Iraq","Suudi Arabistan":"Saudi Arabia","BAE":"UAE",
  "Kazakistan":"Kazakhstan","Özbekistan":"Uzbekistan","Afganistan":"Afghanistan",
  "Malezya":"Malaysia","Tayland":"Thailand","Vietnam":"Vietnam",
  "Güney Kore":"South Korea","Kuzey Kore":"North Korea","Kamboçya":"Cambodia",
  "Myanmar":"Myanmar","Tayvan":"Taiwan","Moğolistan":"Mongolia",
  "Türkmenistan":"Turkmenistan","Kırgızistan":"Kyrgyzstan","Tacikistan":"Tajikistan",
  "Ürdün":"Jordan","İsrail":"Israel","Lübnan":"Lebanon","Suriye":"Syria",
  "Katar":"Qatar","Kuveyt":"Kuwait","Umman":"Oman","Yemen":"Yemen",
  "Mısır":"Egypt","Nijerya":"Nigeria","Etiyopya":"Ethiopia","Kongo":"D.R. Congo",
  "Tanzanya":"Tanzania","Kenya":"Kenya","Güney Afrika":"South Africa","Sudan":"Sudan",
  "Cezayir":"Algeria","Uganda":"Uganda","Fas":"Morocco","Mozambik":"Mozambique",
  "Angola":"Angola","Madagaskar":"Madagascar","Kamerun":"Cameroon",
  "Fildişi Sahili":"Ivory Coast","Nijer":"Niger","Burkina Faso":"Burkina Faso",
  "Mali":"Mali","Malawi":"Malawi","Senegal":"Senegal","Zambiya":"Zambia",
  "Zimbabve":"Zimbabwe","Çad":"Chad","Ruanda":"Rwanda","Tunus":"Tunisia",
  "Somali":"Somalia","Botsvana":"Botswana","Namibya":"Namibia","Liberya":"Liberia",
  "Gine":"Guinea","Gabon":"Gabon","Benin":"Benin","Togo":"Togo","Libya":"Libya",
  "ABD":"USA","Kanada":"Canada","Meksika":"Mexico","Brezilya":"Brazil",
  "Arjantin":"Argentina","Kolombiya":"Colombia","Şili":"Chile","Peru":"Peru",
  "Venezuela":"Venezuela","Ekvador":"Ecuador","Bolivya":"Bolivia","Paraguay":"Paraguay",
  "Uruguay":"Uruguay","Küba":"Cuba","Dominik Cum.":"Dominican Rep.","Haiti":"Haiti",
  "Guatemala":"Guatemala","Honduras":"Honduras","El Salvador":"El Salvador",
  "Nikaragua":"Nicaragua","Kosta Rika":"Costa Rica","Panama":"Panama",
  "Jamaika":"Jamaica","Avustralya":"Australia","Yeni Zelanda":"New Zealand",
  "Papua Yeni Gine":"Papua New Guinea","Kıbrıs":"Cyprus",
  "Bahreyn":"Bahrain","Cibuti":"Djibouti","Singapur":"Singapore","Fiji":"Fiji",
  "Laos":"Laos","Trinidad":"Trinidad & Tobago","Bosna":"Bosnia & Herzegovina",
  "Sri Lanka":"Sri Lanka","Nepal":"Nepal","Gana":"Ghana","Sierra Leone":"Sierra Leone",
  "Kongo Cum.":"Rep. of Congo","Orta Afrika Cumhuriyeti":"C.A.R.",
  "Eritre":"Eritrea","Kuzey Kore":"North Korea","Güney Kore":"South Korea",
  "Belarus":"Belarus","Özbekistan":"Uzbekistan","Kazakistan":"Kazakhstan",
};
const CITY_EN = {
  // Türkiye
  "İstanbul":"Istanbul","Ankara":"Ankara","İzmir":"Izmir","Bursa":"Bursa",
  "Adana":"Adana","Gaziantep":"Gaziantep","Konya":"Konya","Antalya":"Antalya","Eskişehir":"Eskisehir",
  // Avrupa
  "Moskova":"Moscow","St. Petersburg":"St. Petersburg","Münih":"Munich","Köln":"Cologne",
  "Düsseldorf":"Düsseldorf","Frankfurt":"Frankfurt","Stuttgart":"Stuttgart","Hamburg":"Hamburg","Berlin":"Berlin",
  "Varşova":"Warsaw","Bükreş":"Bucharest","Brüksel":"Brussels","Atina":"Athens",
  "Lizbon":"Lisbon","Viyana":"Vienna","Sofya":"Sofia","Kopenhag":"Copenhagen",
  "Londra":"London","Marsilya":"Marseille","Barselona":"Barcelona","Valensiya":"Valencia",
  "Sevilla":"Seville","Selanik":"Thessaloniki","Harkiv":"Kharkiv","Stokholm":"Stockholm",
  "Budapeşte":"Budapest","Prag":"Prague","Bratislava":"Bratislava","Ljubljana":"Ljubljana",
  "Zagreb":"Zagreb","Saraybosna":"Sarajevo","Beograd":"Belgrade","Belgrad":"Belgrade",
  "Sofya":"Sofia","Tiran":"Tirana","Podgorica":"Podgorica","Üsküp":"Skopje",
  "Kişinev":"Chisinau","Riga":"Riga","Vilnius":"Vilnius","Tallinn":"Tallinn",
  "Helsinki":"Helsinki","Oslo":"Oslo","Bergen":"Bergen","Dublin":"Dublin",
  "Göteborg":"Gothenburg","Malmö":"Malmö","Brno":"Brno","Krakow":"Krakow",
  "Wroclaw":"Wroclaw","Gdansk":"Gdansk","Poznan":"Poznan","Lviv":"Lviv",
  "Kiev":"Kyiv","Dnipro":"Dnipro","Odessa":"Odessa","Cluj-Napoca":"Cluj-Napoca",
  "Tamışvar":"Timișoara","Plovdiv":"Plovdiv","Zürih":"Zurich","Cenevre":"Geneva",
  "Bern":"Bern","Cenova":"Genoa","Napoli":"Naples","Palermo":"Palermo",
  "Bologna":"Bologna","Turin":"Turin","Milano":"Milan","Roma":"Rome",
  "Floransa":"Florence","Venedik":"Venice","Katanya":"Catania",
  "Brüksel":"Brussels","Antwerpen":"Antwerp","Lyon":"Lyon","Bordeaux":"Bordeaux",
  "Toulouse":"Toulouse","Nice":"Nice","Graz":"Graz","Rotterdam":"Rotterdam",
  "Amsterdam":"Amsterdam","Bilbao":"Bilbao","Malaga":"Malaga","Zaragoza":"Zaragoza",
  "Strazburg":"Strasbourg","Lahey":"The Hague","Lozan":"Lausanne",
  "Kaloşvar":"Cluj-Napoca","Timişoara":"Timișoara","Iaşi":"Iași","Köstence":"Constanța",
  "Liège":"Liège","Brugge":"Bruges","Anvers":"Antwerp","Gent":"Ghent",
  "Aarhus":"Aarhus","Odense":"Odense","Priştine":"Pristina",
  // Rusya / BDT
  "Novosibirsk":"Novosibirsk","Yekaterinburg":"Yekaterinburg","Kazan":"Kazan",
  "Nizhny Novgorod":"Nizhny Novgorod","Çelyabinsk":"Chelyabinsk","Omsk":"Omsk",
  "Samara":"Samara","Ufa":"Ufa","Rostov-na-Donu":"Rostov","Vladivostok":"Vladivostok",
  "Tiflis":"Tbilisi","Bakü":"Baku","Erivan":"Yerevan","Minsk":"Minsk",
  "Bişkek":"Bishkek","Duşanbe":"Dushanbe","Aşkabat":"Ashgabat",
  "Almatı":"Almaty","Taşkent":"Tashkent","Semerkant":"Samarkand","Şymkent":"Shymkent",
  // Orta Doğu
  "Tahran":"Tehran","Meşhed":"Mashhad","İsfahan":"Isfahan","Tebriz":"Tabriz","Şiraz":"Shiraz","Ahvaz":"Ahvaz",
  "Bağdat":"Baghdad","Basra":"Basra","Musul":"Mosul","Erbil":"Erbil",
  "Riyad":"Riyadh","Cidde":"Jeddah","Mekke":"Mecca","Medine":"Medina","Dammam":"Dammam",
  "Şam":"Damascus","Halep":"Aleppo","Amman":"Amman","Beyrut":"Beirut",
  "Kudüs":"Jerusalem","Tel Aviv":"Tel Aviv","Doha":"Doha","Manama":"Bahrain City",
  "Kuveyt":"Kuwait City","Maskat":"Muscat","Sana":"Sana'a","Aden":"Aden",
  // Orta Asya / Güney Asya
  "Kabil":"Kabul","Kandahar":"Kandahar","Herat":"Herat","Mazar-i Serif":"Mazar-i-Sharif",
  "İslamabad":"Islamabad","Ravalpindi":"Rawalpindi","Lahore":"Lahore",
  "Karaçi":"Karachi","Faisalabad":"Faisalabad","Multan":"Multan","Peşaver":"Peshawar",
  "Delhi":"Delhi","Mumbai":"Mumbai","Kalküta":"Kolkata","Chennai":"Chennai",
  "Bangalore":"Bangalore","Haydarabad":"Hyderabad","Ahmedabad":"Ahmedabad",
  "Pune":"Pune","Surat":"Surat","Jaipur":"Jaipur","Lucknow":"Lucknow",
  "Nagpur":"Nagpur","Patna":"Patna","Bhopal":"Bhopal","Katmandu":"Kathmandu",
  "Pokhara":"Pokhara","Dhaka":"Dhaka","Chittagong":"Chittagong","Khulna":"Khulna",
  "Colombo":"Colombo","Kandy":"Kandy",
  // Doğu Asya
  "Pekin":"Beijing","Şangay":"Shanghai","Guangzhou":"Guangzhou","Shenzhen":"Shenzhen",
  "Chengdu":"Chengdu","Chongqing":"Chongqing","Tianjin":"Tianjin","Wuhan":"Wuhan",
  "Hangzhou":"Hangzhou","Nanjing":"Nanjing","Harbin":"Harbin","Kunming":"Kunming",
  "Xian":"Xi'an","Urumqi":"Urumqi","Hong Kong":"Hong Kong","Kaohsiung":"Kaohsiung",
  "Taipei":"Taipei","Taichung":"Taichung","Seul":"Seoul","Busan":"Busan",
  "Daegu":"Daegu","Incheon":"Incheon","Pyongyang":"Pyongyang","Ulan Batur":"Ulaanbaatar",
  "Tokyo":"Tokyo","Osaka":"Osaka","Nagoya":"Nagoya","Sapporo":"Sapporo",
  "Fukuoka":"Fukuoka","Kobe":"Kobe","Kyoto":"Kyoto","Hiroshima":"Hiroshima","Sendai":"Sendai",
  // GD Asya
  "Bangkok":"Bangkok","Chiang Mai":"Chiang Mai","Hanoi":"Hanoi","Ho Chi Minh":"Ho Chi Minh City",
  "Haiphong":"Haiphong","Da Nang":"Da Nang","Phnom Penh":"Phnom Penh","Vientiane":"Vientiane",
  "Rangun":"Yangon","Mandalay":"Mandalay","Kuala Lumpur":"Kuala Lumpur",
  "George Town":"George Town","Johor Bahru":"Johor Bahru","Singapur":"Singapore",
  "Jakarta":"Jakarta","Surabaya":"Surabaya","Bandung":"Bandung","Medan":"Medan",
  "Semarang":"Semarang","Makassar":"Makassar","Palembang":"Palembang",
  "Manila":"Manila","Cebu":"Cebu","Davao":"Davao","Lefkoşa":"Nicosia",
  // Afrika
  "Kahire":"Cairo","İskenderiye":"Alexandria","Hartum":"Khartoum","Omdurman":"Omdurman",
  "Cezayir":"Algiers","Oran":"Oran","Constantine":"Constantine",
  "Casablanca":"Casablanca","Rabat":"Rabat","Fes":"Fez","Marakeş":"Marrakesh",
  "Trablus":"Tripoli","Bingazi":"Benghazi","Tunus":"Tunis","Sfaks":"Sfax",
  "Lagos":"Lagos","Abuja":"Abuja","Kano":"Kano","Ibadan":"Ibadan","Port Harcourt":"Port Harcourt",
  "Nairobi":"Nairobi","Mombasa":"Mombasa","Kampala":"Kampala","Dar es Salaam":"Dar es Salaam",
  "Dodoma":"Dodoma","Kigali":"Kigali","Addis Ababa":"Addis Ababa","Dire Dawa":"Dire Dawa",
  "Asmara":"Asmara","Mogadişu":"Mogadishu","Cibuti":"Djibouti",
  "Johannesburg":"Johannesburg","Kapstadt":"Cape Town","Durban":"Durban","Pretoria":"Pretoria",
  "Kinshasa":"Kinshasa","Lubumbashi":"Lubumbashi","Brazzaville":"Brazzaville",
  "Luanda":"Luanda","Huambo":"Huambo","Maputo":"Maputo","Beira":"Beira","Nampula":"Nampula",
  "Antananarivo":"Antananarivo","Lusaka":"Lusaka","Ndola":"Ndola",
  "Harare":"Harare","Bulawayo":"Bulawayo","Gaborone":"Gaborone","Windhoek":"Windhoek",
  "Dakar":"Dakar","Bamako":"Bamako","Ouagadougou":"Ouagadougou","Niamey":"Niamey",
  "Accra":"Accra","Kumasi":"Kumasi","Abidjan":"Abidjan","Cotonou":"Cotonou",
  "Lome":"Lomé","Yaounde":"Yaoundé","Douala":"Douala","Bangui":"Bangui",
  "Libreville":"Libreville","Freetown":"Freetown","Monrovia":"Monrovia","Konakri":"Conakry",
  // Amerika
  "New York":"New York","Los Angeles":"Los Angeles","Chicago":"Chicago",
  "Houston":"Houston","Phoenix":"Phoenix","Philadelphia":"Philadelphia",
  "San Antonio":"San Antonio","San Diego":"San Diego","Dallas":"Dallas",
  "San Jose":"San Jose","Austin":"Austin","Jacksonville":"Jacksonville",
  "Boston":"Boston","Seattle":"Seattle","Denver":"Denver","Detroit":"Detroit",
  "Miami":"Miami","Atlanta":"Atlanta","Minneapolis":"Minneapolis",
  "New Orleans":"New Orleans","Las Vegas":"Las Vegas","Portland":"Portland",
  "Honolulu":"Honolulu","Anchorage":"Anchorage","Washington DC":"Washington DC",
  "Toronto":"Toronto","Montreal":"Montreal","Vancouver":"Vancouver","Calgary":"Calgary",
  "Edmonton":"Edmonton","Ottawa":"Ottawa","Winnipeg":"Winnipeg",
  "Mexico City":"Mexico City","Guadalajara":"Guadalajara","Monterrey":"Monterrey",
  "Puebla":"Puebla","Tijuana":"Tijuana","Leon":"León",
  "Bogota":"Bogotá","Medellin":"Medellín","Cali":"Cali","Barranquilla":"Barranquilla",
  "Lima":"Lima","Arequipa":"Arequipa","Trujillo":"Trujillo",
  "Sao Paulo":"São Paulo","Rio de Janeiro":"Rio de Janeiro","Brasilia":"Brasília",
  "Salvador":"Salvador","Fortaleza":"Fortaleza","Belo Horizonte":"Belo Horizonte",
  "Manaus":"Manaus","Curitiba":"Curitiba","Recife":"Recife",
  "Porto Alegre":"Porto Alegre","Belem":"Belém",
  "Buenos Aires":"Buenos Aires","Cordoba":"Córdoba","Rosario":"Rosario",
  "Mendoza":"Mendoza","Tucuman":"Tucumán",
  "Santiago":"Santiago","Valparaiso":"Valparaíso","Concepcion":"Concepción",
  "Caracas":"Caracas","Maracaibo":"Maracaibo","Valencia":"Valencia",
  "Quito":"Quito","Guayaquil":"Guayaquil",
  "La Paz":"La Paz","Santa Cruz":"Santa Cruz","Cochabamba":"Cochabamba",
  "Asuncion":"Asunción","Montevideo":"Montevideo",
  "Havana":"Havana","Santo Domingo":"Santo Domingo","Port-au-Prince":"Port-au-Prince",
  "Guatemala City":"Guatemala City","Tegucigalpa":"Tegucigalpa",
  "San Salvador":"San Salvador","Managua":"Managua","San Jose":"San José",
  "Panama City":"Panama City","Kingston":"Kingston","Port of Spain":"Port of Spain",
  // Avustralya/Okyanusya
  "Sidney":"Sydney","Melbourne":"Melbourne","Brisbane":"Brisbane","Perth":"Perth",
  "Adelaide":"Adelaide","Canberra":"Canberra","Darwin":"Darwin","Christchurch":"Christchurch",
  "Auckland":"Auckland","Wellington":"Wellington","Suva":"Suva",
  // Diğer
  "N'Djamena":"N'Djamena","Lilongwe":"Lilongwe","Gaborone":"Gaborone",
  "Phnom Penh":"Phnom Penh","Erivan":"Yerevan","Marakeş":"Marrakesh",
};
function cityDisplayName(city) { return lang==='en' ? (CITY_EN[city.name]||city.name) : city.name; }
function countryDisplayName(city) { return lang==='en' ? (COUNTRY_EN[city.country]||city.country) : city.country; }

// ===== DİL SİSTEMİ =====
let lang = 'tr';
const T = {
  tr: {
    play: 'OYNA', leaderboard: '🏆 SKOR TABLOSU', logout: 'ÇIKIŞ YAP',
    welcome: 'Hoş geldin,', guest: 'Misafir olarak oynuyorsun',
    markCity: 'şehri haritada işaretle:',
    nextQ: 'DEVAM →', nextLevel: 'SONRAKİ SEVİYE →', retry: 'TEKRAR DENE', playAgain: 'YENİDEN OYNA',
    viewLb: 'SKOR TABLOSU', logoutBtn: 'ÇIKIŞ YAP',
    winTitle: '🏆 TEBRİKLER, KAZANDINIZ!',
    winDesc: (score) => `Tüm 10 seviyeyi tamamladın!<br>Bu oyunun puanı: <b style="color:var(--accent)">${score}</b>`,
    levelOk: (lvl) => `🎉 SEVİYE ${lvl} TAMAM!`,
    levelOkDesc: (ls, tgt, nl, nq, ntgt, total) => `Puanın: <b style="color:var(--green)">${ls}</b> / Hedef: ${tgt} &nbsp;|&nbsp; Toplam: <b style="color:var(--accent)">${total||0}</b><br><br>Seviye ${nl}: ${nq} soru, hedef <b style="color:var(--accent)">${ntgt}</b> puan`,
    failTitle: '❌ BAŞARISIZ!',
    failDesc: (ls, tgt, total) => `Puanın: <b style="color:var(--red)">${ls}</b> / Hedef: ${tgt}<br>Toplam puan: <b style="color:var(--accent)">${total||0}</b><br><br>Üzülme, 1. seviyeden tekrar başla!`,
    lbTitle: '🏆 LİDERLİK TABLOSU', lbSub: 'Tek oyundan alınan en yüksek puanlar',
    lbOrientationNote: '📱 Liderlik tablosunu dikey ekranda görüntülemeniz tavsiye edilir.',
    lbClose: 'KAPAT', lbReset: 'SKORUMU SIFIRLA', lbLoading: '⏳ Yükleniyor...', lbEmpty: 'Henüz skor yok.',
    lbFail: 'Yüklenemedi',
    games: 'oyun', level: 'Sv.',
    loginTab: 'GİRİŞ YAP', registerTab: 'KAYIT OL',
    userPlaceholder: 'Kullanıcı adı', passPlaceholder: 'Şifre',
    submit: 'DEVAM', guestLink: 'misafir olarak oyna', authSubtitle: 'Skor tablosunda yer almak için giriş yap',
    errShort: 'Kullanıcı adı en az 2 karakter olmalı.',
    errPass: 'Şifre en az 4 karakter olmalı.',
    errLong: 'Kullanıcı adı en fazla 20 karakter.',
    errTaken: 'Bu kullanıcı adı zaten alınmış.',
    errNotFound: 'Kullanıcı bulunamadı.',
    errWrongPass: 'Hatalı şifre.',
    errConn: 'Bağlantı hatası, tekrar dene.',
    waiting: '⏳ Bekleniyor...',
    confirmReset: 'EMİN MİSİN? (tekrar bas)',
    fullscreenTitle: 'MOBİL ALGILANDI',
    fullscreenDesc: 'Daha iyi bir deneyim için tam ekrana geçmek ister misiniz?',
    fullscreenYes: 'TAM EKRANA GEÇ', fullscreenNo: 'HAYIR, DEVAM ET',
    combo: 'KOMBO', timeout: '⏱ Süre doldu!', away: 'km uzakta',
    score: 'Puan', target: 'Hedef', progress: 'İlerleme',
    fullscreenBtn: '⛶ TAM EKRAN',
    playWorld: '🌍 DÜNYA', playTurkey: '🇹🇷 TÜRKİYE', playLandmark: '🏛️ DÜNYA HARİKALARI',
    markDistrict: 'ilçeyi haritada işaretle:',
    markLandmark: 'yeri dünya haritasında işaretle:',
    mainMenu: '🏠 ANA MENÜ',
    mainMenuTitle: 'ANA MENÜ',
    mainMenuCurrent: (m) => m==='turkey' ? '🇹🇷 Şu an: Türkiye Modu' : m==='europe' ? '🇪🇺 Şu an: Avrupa Modu' : m==='landmark' ? '🏛️ Şu an: Dünya Harikaları Modu' : '🌍 Şu an: Dünya Modu',
    // Multiplayer
    mp: '⚔️ ÇOKLU OYUNCU',
    mpMainTitle: '⚔️ ÇOKLU OYUNCU',
    mpMainSub: '2-5 kişiyle gerçek zamanlı oyna',
    mpCreateBtn: '➕ LOBİ OLUŞTUR',
    mpJoinBtn: '🔗 LOBİYE KATIL',
    mpBack: '← GERİ',
    mpCreateTitle: '➕ LOBİ OLUŞTUR',
    mpCreateSub: 'Mod seç — 12 soru, en yüksek puan kazanır',
    mpCreateGo: '🚀 LOBİ OLUŞTUR',
    mpCreating: 'OLUŞTURULUYOR...',
    mpJoinTitle: '🔗 LOBİYE KATIL',
    mpJoinSub: 'Arkadaşından aldığın 4 haneli kodu gir',
    mpJoinPlaceholder: 'LOBİ KODU (4 HANE)',
    mpJoinGo: 'GİRİŞ YAP',
    mpJoining: 'BAĞLANILIYOR...',
    mpLobbyTitle: '🏠 LOBİ',
    mpLobbySub: 'Kodu arkadaşlarınla paylaş',
    mpCopyTitle: 'Kopyalamak için tıkla',
    mpWaitingPlayers: 'Oyuncular bekleniyor…',
    mpStartBtn: (n) => n < 2 ? `▶ BAŞLAT (min 2 kişi gerek, şu an ${n})` : `▶ BAŞLAT (${n} kişi)`,
    mpGuestTitle: '⏳ OYUN BEKLENİYOR',
    mpGuestSub: (code, mode) => `Kod: ${code} — ${mode === 'turkey' ? '🇹🇷 Türkiye' : mode === 'europe' ? '🇪🇺 Avrupa' : mode === 'landmark' ? '🏛️ Harikalar' : mode === 'flag' ? '🚩 Bayraklar' : '🌍 Dünya'} • ${mode==='flag'?12:12} soru • Lobi sahibi başlatana kadar bekle`,
    mpGuestStatus: 'Lobiye bağlanıldı…',
    mpLeave: 'LOBİDEN AYRIL',
    mpCopied: 'KOPYALANDI!',
    mpPlayerCount: (n, mode) => `${n}/5 oyuncu • ${mode === 'turkey' ? '🇹🇷 Türkiye' : mode === 'europe' ? '🇪🇺 Avrupa' : mode === 'landmark' ? '🏛️ Harikalar' : mode === 'flag' ? '🚩 Bayraklar' : '🌍 Dünya'} • ${mode==='flag'?12:12} soru`,
    mpErrConn: 'Bağlantı hatası!',
    mpErrFull: 'Lobi dolu! (Max 5 kişi)',
    mpErrExists: 'Bu lobide zaten varsın!',
    mpErrNotFound: 'Lobi bulunamadı veya oyun başlamış!',
    mpErrLogin: 'Çok oyunculu mod için giriş yapman gerekiyor!',
    mpErrMin2: 'En az 2 oyuncu gerekli!',
    mpGameOver: '🏆 OYUN BİTTİ',
    mpBackMenu: 'ANA MENÜYE DÖN',
    mpWinner: (name) => `🏆 KAZANAN: ${name}`,
    mpYouWin: '🏆 KAZANDINIZ!',
    mpYou: '(Sen)',
    mpBadge: '⚔️ ÇOKLU',
    mpBetweenQ: (n) => `SORU ${n} SONUÇLARI`,
    mpBetweenFinal: 'FİNAL SONUÇLARI',
    mpBetweenSub: (n, total) => `${n}/${total} soru tamamlandı`,
    mpBetweenFinalSub: (total) => `Tüm ${total} soru tamamlandı`,
    mpThisQ: (pts) => `+${pts} bu soruda`,
    mpNoAns: '— puan (cevapsız)',
    mpWaitHost: 'Lobi sahibi devam edene kadar bekle…',
    mpWaitFinal: 'Final sonuçları bekleniyor…',
    mpNextQ: '▶ SONRAKİ SORU',
    mpSeeFinal: '🏆 FİNAL SONUÇLARINI GÖR',
    mpLastQ: (n, pts) => `Q${n}'de +${pts}`,
    mpMatchmaking: '⚡ RASTGELE EŞLEŞTİR',
    mpBrowse: '🌐 AKTİF LOBİLER',
    mpJoinByCode: '🔗 KOD İLE KATIL',
    mpMatchmakingSelectSub: 'Mod seç ve rankını gör',
    mpStartSearch: '🔍 EŞLEŞTİR',
    mpCancel: '✕ İPTAL',
    mpBrowseTitle: '🌐 AKTİF LOBİLER',
    mpRefresh: '🔄 YENİLE',
    mpBackBtn: '← GERİ',
    mpResume: '▶ OYUNA DEVAM ET',
    mpLeaveBtn: 'LOBİDEN AYRIL',
  },
  en: {
    play: 'PLAY', leaderboard: '🏆 LEADERBOARD', logout: 'LOG OUT',
    welcome: 'Welcome,', guest: 'Playing as guest',
    markCity: 'mark the city on the map:',
    nextQ: 'NEXT →', nextLevel: 'NEXT LEVEL →', retry: 'TRY AGAIN', playAgain: 'PLAY AGAIN',
    viewLb: 'LEADERBOARD', logoutBtn: 'LOG OUT',
    winTitle: '🏆 CONGRATULATIONS!',
    winDesc: (score) => `You completed all 10 levels!<br>Your score: <b style="color:var(--accent)">${score}</b>`,
    levelOk: (lvl) => `🎉 LEVEL ${lvl} COMPLETE!`,
    levelOkDesc: (ls, tgt, nl, nq, ntgt, total) => `Score: <b style="color:var(--green)">${ls}</b> / Target: ${tgt} &nbsp;|&nbsp; Total: <b style="color:var(--accent)">${total||0}</b><br><br>Level ${nl}: ${nq} questions, target <b style="color:var(--accent)">${ntgt}</b> pts`,
    failTitle: '❌ FAILED!',
    failDesc: (ls, tgt, total) => `Score: <b style="color:var(--red)">${ls}</b> / Target: ${tgt}<br>Total score: <b style="color:var(--accent)">${total||0}</b><br><br>Don't worry, start again from level 1!`,
    lbTitle: '🏆 LEADERBOARD', lbSub: 'Best score from a single game',
    lbOrientationNote: '📱 We recommend viewing the leaderboard in portrait mode.',
    lbClose: 'CLOSE', lbReset: 'RESET MY SCORE', lbLoading: '⏳ Loading...', lbEmpty: 'No scores yet.',
    lbFail: 'Failed to load',
    games: 'games', level: 'Lv.',
    loginTab: 'LOG IN', registerTab: 'REGISTER',
    userPlaceholder: 'Username', passPlaceholder: 'Password',
    submit: 'CONTINUE', guestLink: 'play as guest', authSubtitle: 'Log in to appear on the leaderboard',
    errShort: 'Username must be at least 2 characters.',
    errPass: 'Password must be at least 4 characters.',
    errLong: 'Username can be at most 20 characters.',
    errTaken: 'This username is already taken.',
    errNotFound: 'User not found.',
    errWrongPass: 'Wrong password.',
    errConn: 'Connection error, try again.',
    waiting: '⏳ Please wait...',
    confirmReset: 'ARE YOU SURE? (tap again)',
    fullscreenTitle: 'MOBILE DETECTED',
    fullscreenDesc: 'Would you like to switch to fullscreen for a better experience?',
    fullscreenYes: 'GO FULLSCREEN', fullscreenNo: 'NO, CONTINUE',
    combo: 'COMBO', timeout: '⏱ Time\'s up!', away: 'km away',
    score: 'Score', target: 'Target', progress: 'Progress',
    fullscreenBtn: '⛶ FULLSCREEN',
    playWorld: '🌍 WORLD', playTurkey: '🇹🇷 TURKEY', playLandmark: '🏛️ WORLD WONDERS',
    markDistrict: 'mark the district on the map:',
    markLandmark: 'mark the location on the world map:',
    mainMenu: '🏠 MAIN MENU',
    mainMenuTitle: 'MAIN MENU',
    mainMenuCurrent: (m) => m==='turkey' ? '🇹🇷 Now: Turkey Mode' : m==='europe' ? '🇪🇺 Now: Europe Mode' : m==='landmark' ? '🏛️ Now: World Wonders Mode' : '🌍 Now: World Mode',
    // Multiplayer
    mp: '⚔️ MULTIPLAYER',
    mpMainTitle: '⚔️ MULTIPLAYER',
    mpMainSub: 'Play real-time with 2-5 players',
    mpCreateBtn: '➕ CREATE LOBBY',
    mpJoinBtn: '🔗 JOIN LOBBY',
    mpBack: '← BACK',
    mpCreateTitle: '➕ CREATE LOBBY',
    mpCreateSub: 'Pick a mode — 12 questions, highest score wins',
    mpCreateGo: '🚀 CREATE LOBBY',
    mpCreating: 'CREATING...',
    mpJoinTitle: '🔗 JOIN LOBBY',
    mpJoinSub: 'Enter the 4-letter code from your friend',
    mpJoinPlaceholder: 'LOBBY CODE (4 CHARS)',
    mpJoinGo: 'JOIN',
    mpJoining: 'JOINING...',
    mpLobbyTitle: '🏠 LOBBY',
    mpLobbySub: 'Share this code with your friends',
    mpCopyTitle: 'Click to copy',
    mpWaitingPlayers: 'Waiting for players…',
    mpStartBtn: (n) => n < 2 ? `▶ START GAME (need min 2, currently ${n})` : `▶ START GAME (${n} players)`,
    mpGuestTitle: '⏳ WAITING FOR HOST',
    mpGuestSub: (code, mode) => `Code: ${code} — ${mode === 'turkey' ? '🇹🇷 Turkey' : mode === 'europe' ? '🇪🇺 Europe' : mode === 'landmark' ? '🏛️ Wonders' : mode === 'flag' ? '🚩 Flags' : '🌍 World'} • ${mode==='flag'?12:12} questions • Wait for host to start`,
    mpGuestStatus: 'Connected to lobby…',
    mpLeave: 'LEAVE LOBBY',
    mpCopied: 'COPIED!',
    mpPlayerCount: (n, mode) => `${n}/5 players • ${mode === 'turkey' ? '🇹🇷 Turkey' : mode === 'europe' ? '🇪🇺 Europe' : mode === 'landmark' ? '🏛️ Wonders' : mode === 'flag' ? '🚩 Flags' : '🌍 World'} • ${mode==='flag'?12:12} questions`,
    mpErrConn: 'Connection error!',
    mpErrFull: 'Lobby is full! (Max 5 players)',
    mpErrExists: 'You are already in this lobby!',
    mpErrNotFound: 'Lobby not found or game already started!',
    mpErrLogin: 'You need to be logged in to play multiplayer!',
    mpErrMin2: 'At least 2 players are required!',
    mpGameOver: '🏆 GAME OVER',
    mpBackMenu: 'BACK TO MENU',
    mpWinner: (name) => `🏆 WINNER: ${name}`,
    mpYouWin: '🏆 YOU WIN!',
    mpYou: '(You)',
    mpBadge: '⚔️ MULTI',
    mpBetweenQ: (n) => `QUESTION ${n} RESULTS`,
    mpBetweenFinal: 'FINAL RESULTS',
    mpBetweenSub: (n, total) => `After ${n} of ${total} questions`,
    mpBetweenFinalSub: (total) => `All ${total} questions done`,
    mpThisQ: (pts) => `+${pts} this question`,
    mpNoAns: '— pts (no answer)',
    mpWaitHost: 'Waiting for host to continue…',
    mpWaitFinal: 'Waiting for final results…',
    mpNextQ: '▶ NEXT QUESTION',
    mpSeeFinal: '🏆 SEE FINAL RESULTS',
    mpLastQ: (n, pts) => `+${pts} on Q${n}`,
    mpMatchmaking: '⚡ QUICK MATCH',
    mpBrowse: '🌐 ACTIVE LOBBIES',
    mpJoinByCode: '🔗 JOIN WITH CODE',
    mpMatchmakingSelectSub: 'Select mode and see your rank',
    mpStartSearch: '🔍 FIND MATCH',
    mpCancel: '✕ CANCEL',
    mpBrowseTitle: '🌐 ACTIVE LOBBIES',
    mpRefresh: '🔄 REFRESH',
    mpBackBtn: '← BACK',
    mpResume: '▶ CONTINUE',
    mpLeaveBtn: 'LEAVE LOBBY',
  }
};

function t(key, ...args) {
  const val = (T[lang] && T[lang][key]) || (T['tr'][key]) || undefined;
  if (val === undefined) return ''; // key bulunamazsa boş döndür (key adını gösterme)
  return typeof val === 'function' ? val(...args) : val;
}

function setLang(l) {
  try {
  lang = l;
  const _ltr = document.getElementById('lang-tr');
  const _len = document.getElementById('lang-en');
  if (_ltr) _ltr.classList.toggle('active', l === 'tr');
  if (_len) _len.classList.toggle('active', l === 'en');
  // Also sync auth lang selector
  const aLangTr = document.getElementById('auth-lang-tr');
  const aLangEn = document.getElementById('auth-lang-en');
  if (aLangTr && aLangEn) {
    if (l === 'tr') {
      aLangTr.style.background = 'rgba(240,165,0,.12)'; aLangTr.style.borderColor = 'var(--accent)'; aLangTr.style.color = 'var(--accent)';
      aLangEn.style.background = 'transparent'; aLangEn.style.borderColor = 'var(--border)'; aLangEn.style.color = 'var(--muted)';
    } else {
      aLangEn.style.background = 'rgba(240,165,0,.12)'; aLangEn.style.borderColor = 'var(--accent)'; aLangEn.style.color = 'var(--accent)';
      aLangTr.style.background = 'transparent'; aLangTr.style.borderColor = 'var(--border)'; aLangTr.style.color = 'var(--muted)';
    }
  }
  applyLang();
  } catch(e) { console.error('[SETLANG ERROR]', e.message, e.stack); }
}

function applyLang() {
  // Auth modal
  (document.getElementById('auth-subtitle')||{}).textContent = t('authSubtitle');
  const _tabs=document.querySelectorAll('.auth-tab');
  if(_tabs[0]) _tabs[0].textContent=t('loginTab');
  if(_tabs[1]) _tabs[1].textContent=t('registerTab');
  if(document.getElementById('auth-forgot-link')) document.getElementById('auth-forgot-link').textContent = lang==='en'?'Forgot password?':'Şifremi unuttum';
  if(document.getElementById('auth-back-link')) document.getElementById('auth-back-link').textContent = lang==='en'?'← Back':'← Geri';
  if(document.getElementById('auth-forgot-btn')) document.getElementById('auth-forgot-btn').textContent = lang==='en'?'SEND':'GÖNDER';
  if(document.getElementById('auth-username-btn') && !document.getElementById('auth-username-btn').disabled) document.getElementById('auth-username-btn').textContent = t('submit');
  if(_tabs[1]) _tabs[1].textContent=t('registerTab');
  (document.getElementById('auth-username')||{}).placeholder = t('userPlaceholder');
  (document.getElementById('auth-password')||{}).placeholder = t('passPlaceholder');
  const _asb = document.getElementById('auth-submit-btn'); if(_asb && !_asb.disabled) _asb.textContent = t('submit');
  const guestLine = document.getElementById('auth-guest-line');
  if (guestLine) {
    guestLine.innerHTML = (lang === 'tr' ? 'ya da ' : 'or ') + '<a onclick="authGuest()">' + t('guestLink') + '</a>';
  }
  // Welcome
  const el = (id) => document.getElementById(id);
  if (el('btn-play-world')) el('btn-play-world').textContent = lang==='tr' ? '🌍 DÜNYA' : '🌍 WORLD';
  if (el('btn-play-europe')) el('btn-play-europe').textContent = lang==='tr' ? '🇪🇺 AVRUPA' : '🇪🇺 EUROPE';
  if (el('btn-play-turkey')) el('btn-play-turkey').textContent = lang==='tr' ? '🇹🇷 TÜRKİYE' : '🇹🇷 TURKEY';
  if (el('btn-landmark-label')) el('btn-landmark-label').textContent = lang==='tr' ? 'DÜNYA HARİKALARI' : 'WORLD WONDERS';
  if (el('mm-landmark-label')) el('mm-landmark-label').textContent = lang==='tr' ? 'DÜNYA HARİKALARI' : 'WORLD WONDERS';
  if (el('btn-flag-label')) el('btn-flag-label').textContent = lang==='tr' ? 'BAYRAK YARIŞI' : 'FLAG QUIZ';
  if (el('mm-flag-label')) el('mm-flag-label').textContent = lang==='tr' ? 'BAYRAK YARIŞI' : 'FLAG QUIZ';
  const fip = el('flag-input-placeholder'); if (fip) fip.placeholder = lang==='tr' ? 'Ülke adını yaz...' : 'Type the country name...';
  const ftl = el('flag-round-info'); // runtime'da güncelleniyor
  if (el('mm-btn-world')) el('mm-btn-world').textContent = lang==='tr' ? '🌍 DÜNYA' : '🌍 WORLD';
  if (el('mm-btn-europe')) el('mm-btn-europe').textContent = lang==='tr' ? '🇪🇺 AVRUPA' : '🇪🇺 EUROPE';
  if (el('mm-btn-turkey')) el('mm-btn-turkey').textContent = lang==='tr' ? '🇹🇷 TÜRKİYE' : '🇹🇷 TURKEY';
  if (el('btn-landmark-label')) el('btn-landmark-label').textContent = lang==='tr' ? 'DÜNYA HARİKALARI' : 'WORLD WONDERS';
  if (el('mm-btn-world')) el('mm-btn-world').textContent = lang==='tr' ? '🌍 DÜNYA' : '🌍 WORLD';
  if (el('mm-btn-europe')) el('mm-btn-europe').textContent = lang==='tr' ? '🇪🇺 AVRUPA' : '🇪🇺 EUROPE';
  if (el('mm-btn-turkey')) el('mm-btn-turkey').textContent = lang==='tr' ? '🇹🇷 TÜRKİYE' : '🇹🇷 TURKEY';
  if (el('mm-landmark-label')) el('mm-landmark-label').textContent = lang==='tr' ? 'DÜNYA HARİKALARI' : 'WORLD WONDERS';
  if (el('btn-welcome-lb')) el('btn-welcome-lb').textContent = lang==='tr' ? '🏆 SKOR TABLOSU' : '🏆 LEADERBOARD';
  if (el('btn-options-welcome')) el('btn-options-welcome').textContent = lang==='tr' ? '⚙️ SEÇENEKLER' : '⚙️ OPTIONS';
  if (el('btn-welcome-logout')) el('btn-welcome-logout').textContent = lang==='tr' ? '🚪 ÇIKIŞ YAP' : '🚪 LOG OUT';
  // Topbar (artık bu elementler olmayabilir)
  if (el('btn-leaderboard')) el('btn-leaderboard').textContent = '🏆';
  if (el('btn-logout')) el('btn-logout').textContent = lang === 'tr' ? 'çıkış' : 'logout';
  // Leaderboard
  (document.querySelector('#lb-box h2')||{}).textContent = t('lbTitle');
  (document.getElementById('lb-subtitle')||{}).textContent = t('lbSub');
  (document.getElementById('lb-orientation-note')||{}).textContent = t('lbOrientationNote');
  (document.querySelector('.lb-close')||{}).textContent = t('lbClose');
  (document.getElementById('btn-reset-score')||{}).textContent = t('lbReset');
  // Fullscreen modal
  (document.getElementById('fs-title')||{}).textContent = t('fullscreenTitle');
  (document.getElementById('fs-desc')||{}).textContent = t('fullscreenDesc');
  (document.getElementById('fs-yes')||{}).textContent = t('fullscreenYes');
  (document.getElementById('fs-no')||{}).textContent = t('fullscreenNo');
  (document.getElementById('btn-fullscreen')||{}).textContent = t('fullscreenBtn');
  // Question banner
  (document.getElementById('question-text')||{}).textContent = t('markCity');
  const nextBtn = document.getElementById('btn-next-q');
  if (nextBtn) nextBtn.textContent = t('nextQ');
  // Score/target labels
  const _labels=document.querySelectorAll('.stat-box .label'); if(_labels[0]) _labels[0].textContent=t('score');
  if(_labels[1]) _labels[1].textContent=t('target');
  // Progress label
  const progLabel = document.getElementById('progress-label-text');
  if (progLabel) progLabel.textContent = t('progress');
  // Options modal
  const el2 = (id) => document.getElementById(id);
  if (el2('opt-title')) el2('opt-title').textContent = lang==='tr' ? 'SEÇENEKLER' : 'OPTIONS';
  if (el2('opt-subtitle')) el2('opt-subtitle').textContent = lang==='tr' ? 'Klavye kısayollarını özelleştir' : 'Customize key bindings';
  if (el2('opt-mark-label')) el2('opt-mark-label').textContent = lang==='tr' ? 'HARİTA İŞARETLEME' : 'MAP MARK';
  if (el2('opt-next-label')) el2('opt-next-label').textContent = lang==='tr' ? 'SONRAKİ SORU' : 'NEXT QUESTION';
  if (el2('opt-zoomin-label')) el2('opt-zoomin-label').textContent = lang==='tr' ? 'ZOOM ARTIR' : 'ZOOM IN';
  if (el2('opt-zoomout-label')) el2('opt-zoomout-label').textContent = lang==='tr' ? 'ZOOM AZALT' : 'ZOOM OUT';
  if (el2('opt-zoomreset-label')) el2('opt-zoomreset-label').textContent = lang==='tr' ? 'ZOOM SIFIRLA' : 'ZOOM RESET';
  if (el2('opt-reset-btn')) el2('opt-reset-btn').textContent = lang==='tr' ? 'VARSAYILANA DONDUR' : 'RESET DEFAULTS';
  if (el2('opt-close-btn')) el2('opt-close-btn').textContent = lang==='tr' ? 'KAYDET' : 'SAVE';
  // Multiplayer metinleri
  const el3 = (id) => document.getElementById(id);
  if (el3('btn-mp-label'))      el3('btn-mp-label').textContent      = t('mp');
  if (el3('btn-multiplayer'))   el3('btn-multiplayer').textContent   = t('mp');
  if (el3('mm-btn-multiplayer')) el3('mm-btn-multiplayer').textContent = t('mp');
  if (el3('mp-main-h2'))        el3('mp-main-h2').textContent        = t('mpMainTitle');
  if (el3('mp-main-sub'))       el3('mp-main-sub').textContent       = t('mpMainSub');
  if (el3('mp-btn-create'))     el3('mp-btn-create').textContent     = t('mpCreateBtn');
  // mp-btn-join el4 bloğunda güncelleniyor
  if (el3('mp-btn-back-main'))  el3('mp-btn-back-main').textContent  = t('mpBack');
  if (el3('mp-create-h2'))      el3('mp-create-h2').textContent      = t('mpCreateTitle');
  if (el3('mp-create-sub'))     el3('mp-create-sub').textContent     = t('mpCreateSub');
  if (el3('mp-create-go'))      el3('mp-create-go').textContent      = t('mpCreateGo');
  if (el3('mp-back-create'))    el3('mp-back-create').textContent    = t('mpBack');
  if (el3('mp-join-h2'))        el3('mp-join-h2').textContent        = t('mpJoinTitle');
  if (el3('mp-join-sub'))       el3('mp-join-sub').textContent       = t('mpJoinSub');
  if (el3('mp-join-input'))     el3('mp-join-input').placeholder     = t('mpJoinPlaceholder');
  if (el3('mp-join-go'))        el3('mp-join-go').textContent        = t('mpJoinGo');
  if (el3('mp-back-join'))      el3('mp-back-join').textContent      = t('mpBack');
  if (el3('mp-lobby-h2'))       el3('mp-lobby-h2').textContent       = t('mpLobbyTitle');
  if (el3('mp-lobby-sub'))      el3('mp-lobby-sub').textContent      = t('mpLobbySub');
  if (el3('mp-code-display-wrap') && el3('mp-code-display-wrap').title) el3('mp-code-display-wrap').title = t('mpCopyTitle');
  if (el3('mp-host-waiting'))   el3('mp-host-waiting').textContent   = t('mpWaitingPlayers');
  if (el3('mp-start-label'))    el3('mp-start-label').textContent    = t('mpStartBtn', 0);
  if (el3('mp-guest-h2'))       el3('mp-guest-h2').textContent       = t('mpGuestTitle');
  if (el3('mp-guest-connected'))el3('mp-guest-connected').textContent= t('mpGuestStatus');
  if (el3('mp-leave-btn'))      el3('mp-leave-btn').textContent      = t('mpLeave');
  if (el3('mp-result-title'))   el3('mp-result-title').textContent   = t('mpGameOver');
  if (el3('mp-back-menu-btn'))  el3('mp-back-menu-btn').textContent  = t('mpBackMenu');
  const lbTabW  = document.getElementById('lb-tab-world');
  if (lbTabW)  lbTabW.textContent  = lang==='tr' ? '🌍 DÜNYA'    : '🌍 WORLD';
  const lbTabEu = document.getElementById('lb-tab-europe');
  if (lbTabEu) lbTabEu.textContent = lang==='tr' ? '🇪🇺 AVRUPA'  : '🇪🇺 EUROPE';
  const lbTabTr = document.getElementById('lb-tab-turkey');
  if (lbTabTr) lbTabTr.textContent = lang==='tr' ? '🇹🇷 TÜRKİYE' : '🇹🇷 TURKEY';
  const lbTabLm = document.getElementById('lb-tab-landmark');
  if (lbTabLm) lbTabLm.textContent = lang==='tr' ? '🏛️ HARİKALAR' : '🏛️ WONDERS';
  const lbTabFl = document.getElementById('lb-tab-flag');
  if (lbTabFl) lbTabFl.textContent = lang==='tr' ? '🚩 BAYRAK' : '🚩 FLAGS';

  // MP — yeni ekranlar
  const el4 = (id) => document.getElementById(id);
  if (el4('mp-btn-matchmaking')) el4('mp-btn-matchmaking').textContent = t('mpMatchmaking');
  if (el4('mp-btn-browse'))      el4('mp-btn-browse').textContent      = t('mpBrowse');
  if (el4('mp-btn-join'))        el4('mp-btn-join').textContent        = t('mpJoinByCode');
  if (el4('mp-mm-select-sub'))   el4('mp-mm-select-sub').textContent   = t('mpMatchmakingSelectSub');
  if (el4('mm-start-search-btn'))el4('mm-start-search-btn').textContent= t('mpStartSearch');
  if (el4('mp-mm-cancel'))       el4('mp-mm-cancel').textContent       = t('mpCancel');
  if (el4('mp-browse-h2'))       el4('mp-browse-h2').textContent       = t('mpBrowseTitle');
  if (el4('mp-browse-refresh'))  el4('mp-browse-refresh').textContent  = t('mpRefresh');
  if (el4('mp-back-browse'))     el4('mp-back-browse').textContent     = t('mpBackBtn');
  if (el4('mp-back-create'))     el4('mp-back-create').textContent     = t('mpBackBtn');
  if (el4('mp-back-join'))       el4('mp-back-join').textContent       = t('mpBackBtn');
  if (el4('mm-btn-resume'))      el4('mm-btn-resume').textContent      = t('mpResume');
  if (el4('mp-leave-btn'))       el4('mp-leave-btn').textContent       = t('mpLeaveBtn');
  if (el4('mp-join-h2'))         el4('mp-join-h2').textContent         = t('mpJoinByCode');
  // Expand range button labels
  const expandLabel = el4('mp-mm-expand-label');
  if (expandLabel && expandLabel.dataset.i18n !== 'active') {
    expandLabel.textContent = lang==='en' ? 'No opponent found nearby. Expand rank range?' : 'Yakın rakip bulunamadı. Rank aralığı genişletilsin mi?';
  }
  const expandYes = el4('mp-mm-expand-yes');
  if (expandYes) expandYes.textContent = lang==='en' ? '✓ YES' : '✓ EVET';
  const expandNo = el4('mp-mm-expand-no');
  if (expandNo) expandNo.textContent = lang==='en' ? '✕ NO' : '✕ HAYIR';

  // Lobi oluşturma ekranı
  if (el4('mp-create-private-label')) el4('mp-create-private-label').innerHTML = lang==='en' ? '🔒 Password protect' : '🔒 Şifreli lobi';
  if (el4('mp-create-name')) el4('mp-create-name').placeholder = lang==='en' ? 'LOBBY NAME' : 'LOBİ ADI';
  if (el4('mp-create-password')) el4('mp-create-password').placeholder = lang==='en' ? 'Set password' : 'Şifre belirle';
  if (el4('mp-join-password')) el4('mp-join-password').placeholder = lang==='en' ? 'Lobby password' : 'Lobi şifresi';
  if (el4('mp-browse-pw-input')) el4('mp-browse-pw-input').placeholder = lang==='en' ? 'Enter password' : 'Şifreyi gir';
  if (el4('mp-browse-sub')) el4('mp-browse-sub').textContent = lang==='en' ? 'Tap open lobby, 🔒 enter password for private' : 'Açık lobiye tıkla, 🔒 şifreli lobiye şifre gir';
  if (el4('mp-browse-empty')) el4('mp-browse-empty').textContent = lang==='en' ? 'Searching…' : 'Aranıyor…';

  // Flag input placeholder  
  const flagInp = document.getElementById('flag-input');
  if (flagInp) flagInp.placeholder = lang==='en' ? 'Type the country name' : 'Ülke adını yaz...';

  // flag-portrait-hint
  const fph = document.getElementById('flag-portrait-hint');
  if (fph) fph.textContent = lang==='en' ? '📱 This mode works best in portrait · Dikey ekranda daha iyi görünür' : '📱 Bu mod dikey ekranda daha iyi görünür · This mode works best in portrait';

  // Auth username screen  
  if (el4('auth-username-subtitle')) el4('auth-username-subtitle').textContent = lang==='en' ? 'Choose a username for the leaderboard' : 'Liderlik tablosunda görünecek kullanıcı adını seç';
  if (el4('auth-username-input')) el4('auth-username-input').placeholder = lang==='en' ? 'Username (2-20 chars)' : 'Kullanıcı adı (2-20 karakter)';
  if (el4('auth-forgot-subtitle')) el4('auth-forgot-subtitle').textContent = lang==='en' ? 'A password reset link will be sent to your email' : 'E-posta adresine şifre sıfırlama linki gönderilecek';
  if (el4('auth-forgot-email')) el4('auth-forgot-email').placeholder = lang==='en' ? 'Email' : 'E-posta';
}
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
