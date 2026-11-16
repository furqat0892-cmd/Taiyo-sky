# Membrana hisobchisi (Android) v4.0

Tillar: O'zbekcha, English, 日本語 (yuqori o'ng burchakdagi UZ / EN / 日本語 tugmalari). Yangi dizayn, 5D ko'rinish.

Membranali konstruksiyalar uchun hisobchi: o'lcham, kuchlanish tekshiruvi, kirim-chiqim, risklar (Monte-Karlo) va 5D ko'rinish (3D + vaqt + xarajat). v2: "Hisob" va "Usul" bo'limlari (Taiyo Kogyo va jahon amaliyoti, manbalar bilan).
Internet kerak emas, hammasi telefonning o'zida ishlaydi.

## Tuzilma

| Joy | Nima |
|---|---|
| `app/src/main/assets/index.html` | **Butun dastur shu yerda** (hisoblar, narxlar, dizayn) |
| `app/src/main/assets/three.min.js` | 3D kutubxonasi (three.js r128, MIT litsenziya) |
| `app/src/main/java/.../MainActivity.kt` | Faqat index.html'ni ochadi |
| `build.gradle.kts` (ildizda) | 4 qatorli plugins fayli. **Ichiga boshqa narsa qo'shmang** |
| `app/build.gradle.kts` | Ilova sozlamalari. Ildizdagi bilan adashtirmang |
| `.github/workflows/build.yml` | "Build APK" workflow |

## GitHub'ga yuklash (Termux)

1. GitHub'da yangi bo'sh repo oching (masalan `membrana-hisobchisi`).
2. Zipni Termux'ga ulashing (Share) yoki `~/downloads` ga tushiring, keyin:

```
cd ~/downloads
unzip -o membrana-hisobchisi.zip -d ~/membrana
cd ~/membrana/membrana-hisobchisi
git init
git add .
git commit -m "v3"
git branch -M main
git remote add origin https://github.com/FOYDALANUVCHI/membrana-hisobchisi.git
git push -u origin main
```

(`FOYDALANUVCHI` o'rniga o'z GitHub nomingizni yozing.)

3. GitHub'da **Actions** bo'limiga kiring, "Build APK" tugagach (taxminan 3-5 daqiqa) pastdagi **Artifacts** dan `Membrana-Hisobchisi-APK` ni yuklab oling, ichidan `app-debug.apk` ni telefonga o'rnating.

## O'zgartirish

- **Narx va koeffitsientlar:** `index.html` ichida `const DEF=()=>` qismidagi `price` va `types` qiymatlari.
- **Risklar ro'yxati:** `const RISKS=[` qismi.
- **Yangi shakl:** `function build(s)` ichiga yangi `else if` bloki qo'shiladi.
- O'zgartirgach `git add . && git commit -m "yangilash" && git push`. APK avtomatik qayta yig'iladi.

## Eslatma

Hisoblar taxminiy konsept darajasida. Yakuniy o'lcham, kuchlanish va narxni muhandis hisobi hamda ta'minotchi taklifi bilan tasdiqlang.

## Tarjima qo'shish

`index.html` ichida `const I18N=` bo'limi: kalit o'zbekcha matn, qiymat tarjima. `{}` raqam yoki nom o'rnini bildiradi, tarjimada `{1}`, `{2}` yoziladi.
