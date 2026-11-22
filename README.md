# Membrana hisobchisi (Android) v5.0

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


## v5.0 tuzilma
Bo'limlar 5 ta: Loyiha (Kiritish, O'lchamlar, Variantlar), Muhandislik (Kuchlanish, Ilg'or tahlil), Xarajat (Pul oqimi, Risk), 3D / 5D, Ma'lumot (usullar va manbalar).
Tepada doimiy "Tekshiruv" holati: kuchlanish zaxirasi va tarang yo'qolishi. Variantlar telefonda saqlanadi (8 tagacha).
Narxlar yoniga manba va ishonch darajasi qo'yilgan (Xarajat > Pul oqimi > "Narxlar qayerdan olingan").


## v6.0 yangiliklari
- **Erkin shakl**: murakkab kesim uchun chegara nuqtalari (x, y, h) va ichki ustunlar jadvali. Dastur soddalashtirilgan muvozanat yuzasini quradi (haqiqiy form-finding emas).
- **Eksport**: 3D to'r (OBJ, 3ds Max/Rhino/Blender uchun) va kesish ro'yxati (CSV). Android'da fayl Yuklashlar papkasiga saqlanadi (MainActivity.kt ichidagi AndroidApp ko'prigi).

## v7.0 yangiliklari: Model bo'limi (Revit'dan kerakli funksiyalar)
Pastki menyuda "Model" bo'limi: 3D / 5D, Chizmalar, Elementlar, Varaq.
- **Chizmalar**: reja (balandlik rangi, to'r chiziqlari, o'lchamlar), fasad va kesim (kesim joyini surish mumkin). Hammasi modeldan avtomatik chiziladi.
- **Elementlar**: mato polosalari, ustunlar, tayanch plitalar, poydevorlar va kabel jadvali; modelni qoidalar bo'yicha tekshirish; material hajmi; CSV.
- **Varaq**: A3 varaq (reja, fasad, kesim, ko'rsatkichlar, shtamp), haqiqiy masshtabda. SVG va DXF (AutoCAD) eksport.
- Jonli dizayn: chizma chiziladigan animatsiya, bo'limlar silliq ochiladi.

## v8.5: kino sifatidagi 3D
- Yangi "Kino" yoritish rejimi (boshlang'ich): osmon, bulutlar, quyosh, tuman, tog'lar, yumshoq soyalar.
- Yer qatlamlari bir-birining ustiga tushib "o'chib qolish" xatosi tuzatildi (kamera chuqurlik oralig'i va qatlam balandliklari).
- Avto-aylanish qaytarildi: ekranga tegsangiz to'xtaydi, 5 soniyadan keyin o'zi davom etadi.
- Tasvir sifati: Oddiy, Yuqori, Ultra (kino rang, donadorlik, yaltirash). Telefon sekin ishlasa, sifat o'zi pasayadi.
- Kino ramka (keng ekran qora chiziqlar) va stadion yoritgich ustunlari.

## v8.6: material tanlash va kamera yo'li
- 3D bo'limida membrana rangi, yaltirash, shaffoflik va ustun/kabel materiali (Oq, Po'lat, Qora, Oltin).
- Kamera yo'li: kadrlar qo'shib, silliq harakatni ko'rish va videoga yozish (Movies/TaiyoSky). Kadr bo'lmasa, loyiha atrofida to'liq aylanadi.
