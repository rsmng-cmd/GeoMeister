# 🚀 Google Play Console Deployment Rehberi — GeoMeister

## 📋 Ön Gereksinimler

✅ GitHub Pages aktif  
✅ Google Play Console hesabı mevcut  
✅ PWA hazır  
✅ Sözleşmeler hazır (privacy.html, terms.html, kvkk.html)

## 📱 1. Capacitor ile Android Uygulaması Oluştur

```bash
# Node.js gerekli
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android

# Capacitor başlat
npx cap init GeoMeister com.geomeister.app

# Android platform ekle
npx cap add android

# Web dosyalarını kopyala
npx cap copy android

# Android Studio'da aç
npx cap open android
```

## 💰 2. AdMob Entegrasyonu

```bash
npm install @capacitor-community/admob
npx cap sync android
```

`android/app/src/main/AndroidManifest.xml` içine ekle:
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"/>
```

## 🔐 3. Digital Asset Links

`assetlinks.json` dosyasını güncelle:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.geomeister.app",
    "sha256_cert_fingerprints": ["BURAYA_GERCEK_SHA256_YAZ"]
  }
}]
```

SHA256 almak için:
```bash
keytool -list -v -keystore your-keystore.jks -alias your-alias
```

Doğrulama URL:
```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://yourusername.github.io&relation=delegate_permission/common.handle_all_urls
```

## 🏪 4. Google Play Console

1. **Create app** → App name: `GeoMeister`
2. **Default language:** Turkish
3. **App or game:** Game
4. **Free or paid:** Free

### Store Listing
- **App name:** GeoMeister - Geography Game
- **Short description:** Coğrafya bilginizi test edin! (max 80 karakter)
- **Full description:** Detaylı açıklama
- **Category:** Games > Educational
- **Privacy Policy URL:** `https://yourusername.github.io/privacy.html`

### App Bundle
```
Android Studio → Build → Generate Signed Bundle/APK → Android App Bundle (.aab)
```

## 📊 5. Content Rating
- Target age: 3+ (Everyone)
- Interactive elements: Users interact online
- Shares location: No

## ✅ Checklist

- [ ] Capacitor projesi oluşturuldu
- [ ] AdMob App ID eklendi
- [ ] Keystore oluşturuldu ve SHA256 alındı
- [ ] assetlinks.json güncellendi
- [ ] .aab build alındı
- [ ] Play Console store listing tamamlandı
- [ ] Privacy Policy URL eklendi
- [ ] Content rating dolduruldu
- [ ] Internal test yapıldı
- [ ] Production'a gönderildi

---
**🎮 Başarılar! GeoMeister Google Play'de!**
