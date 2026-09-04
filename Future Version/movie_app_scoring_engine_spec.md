# Movie Decision App — Recommendation Scoring Engine (Addendum to MVP Spec)

این سند مکمل بخش ۱۰ (`Recommendation Logic — MVP`) در سند اصلی محصول است و منطق دقیق‌تر scoring engine را برای پیاده‌سازی توسط developer مشخص می‌کند.

---

## 1. اصل کلیدی: Non-Compensatory Ranking + Probabilistic Situation Fit

فرمول اولیه‌ی سند اصلی (`Final Score = Mood Score + Situation Score`) یک مشکل ساختاری دارد: چون **compensatory** است، اجازه می‌دهد یک بُعد ضعیف با یک بُعد قوی جبران شود (مثلاً Mood=3 و Situation=1 می‌تواند هم‌امتیاز با Mood=1 و Situation=3 شود، در حالی که این دو از نظر معنایی کاملاً متفاوت‌اند).

**تصمیم اول**: Mood تنها معیار **رتبه‌بندی** است — چون طبق تعریف محصول (بخش ۶ سند اصلی) محور اصلی ارزش پیشنهادی همین است.

**تصمیم دوم**: Situation دیگر یک فیلتر سخت (حذف‌کننده) نیست، بلکه یک **وزنِ احتمال انتخاب** است. یک فیلم با Situation Score پایین همچنان *می‌تواند* انتخاب شود، فقط با احتمال کمتر — نه اینکه کاملاً از رقابت حذف شود. این تصمیم به دو دلیل گرفته شده:

- با حذف کامل امتیازهای ۱ و ۲، عملاً تمایز معنایی بین سطوح ۱ تا ۵ از بین می‌رفت (هر چیزی زیر threshold یکسان «نابود» می‌شد).
- با catalog کوچک (۵۰–۳۰۰ فیلم)، فیلتر سخت ریسک برخورد مکرر به `No strong match` را برای situationهای کم‌تراکم (مثل Kids) بالا می‌برد.

---

## 2. Pipeline نهایی

```text
All movies
    ↓
Step 1 — Time hard filter
    (runtime باید داخل بازه‌ی انتخابی کاربر باشد)
    ↓
Candidate Pool
    ↓
Step 2 — Rank by Mood Score (descending)
    ↓
Step 3 — Top-K selection (near-tie band)
    ↓
Step 4 — Exclude movies already rejected in this session
    ↓
Step 5 — Weighted random pick از Top-K
    (وزن هر فیلم بر اساس Situation Score تعیین می‌شود)
    ↓
ONE MOVIE
```

---

## 3. جزئیات هر Step

### Step 1 — Time hard filter
بدون تغییر نسبت به سند اصلی (بخش ۵). فیلم‌هایی که runtime‌شان خارج از بازه‌ی انتخابی است، از ابتدا حذف می‌شوند. این تنها فیلتر سخت در کل pipeline است.

### Step 2 — Rank by Mood
بین فیلم‌های باقی‌مانده، رتبه‌بندی فقط بر اساس `mood_score[selected_mood]` انجام می‌شود (نزولی).

```text
ranked = candidate_pool.sortByDescending(movie => movie.mood_score[selected_mood])
```

### Step 3 — Top-K near-tie band
```text
TOP_BAND = 0.5   // قابل تنظیم در config

top_score = ranked[0].mood_score
top_k = ranked.filter(movie => movie.mood_score >= top_score - TOP_BAND)
```
این جلوی تکرار همیشگی یک فیلم واحد برای یک ترکیب ثابت از ورودی را می‌گیرد.

### Step 4 — حذف فیلم‌های reject‌شده در همین session
طبق بخش ۱۱ سند اصلی:
```text
top_k = top_k.filter(movie => !session.rejectedMovieIds.includes(movie.id))
```
اگر بعد از این فیلتر `top_k` خالی شود، به `ranked` (پیش از فیلتر Top-K) برگرد و بعدی‌ترین امتیازها را اضافه کن.

### Step 5 — Weighted random pick بر اساس Situation
Situation Score دیگر فیلتر نیست؛ به یک وزن نسبی برای انتخاب تصادفی تبدیل می‌شود:

```text
SITUATION_WEIGHT = {
  1: 0.15,
  2: 0.4,
  3: 0.65,
  4: 0.85,
  5: 1.0
}

weight(movie) = SITUATION_WEIGHT[movie.situation_score[selected_situation]]

final_movie = weightedRandomPick(top_k, weight)
```

یعنی حتی فیلمی با Situation=1 (ضعیف‌ترین تناسب) صفر نمی‌شود و همچنان ۱۵٪ شانس نسبی نسبت به یک فیلم Situation=5 دارد — ولی عملاً به‌ندرت انتخاب می‌شود. این هم تمایز بین سطوح امتیاز را حفظ می‌کند، هم هیچ‌وقت pool انتخاب را کاملاً خالی نمی‌کند.

---

## 4. Failure Case — No Strong Match

چون دیگر فیلتر سخت روی Situation نداریم، این حالت فقط زمانی رخ می‌دهد که خودِ `candidate_pool` (بعد از Time filter) خالی باشد یا بالاترین Mood Score موجود خیلی پایین باشد:

```text
MIN_ACCEPTABLE_MOOD_SCORE = 3

if candidate_pool.isEmpty() OR top_score < MIN_ACCEPTABLE_MOOD_SCORE:
    show "No strong match yet" message  (طبق بخش ۱۶ سند اصلی)
    offer: Change Time / Change Mood / Change Situation
```

---

## 5. حالت Surprise Me

`Surprise Me` جزء Mood نیست (طبق بخش ۶ سند اصلی)، پس Step 2 (رتبه‌بندی بر اساس Mood) حذف می‌شود:

```text
Time hard filter
    ↓
Exclude rejected-this-session
    ↓
Weighted random pick از کل باقی‌مانده
    (وزن = SITUATION_WEIGHT[situation_score], همان جدول Step 5)
```

یعنی انتخاب همچنان کمی به سمت فیلم‌های مناسب‌تر برای situation کج می‌شود، ولی بدون هیچ ترجیح Mood‌ای — چون کاربر با انتخاب Surprise Me تصمیم Mood را به محصول واگذار کرده.

---

## 6. Explainability (بدون نمایش عدد خام)

عدد `mood_score` / `situation_score` نباید مستقیم به کاربر نشان داده شود. به‌جای آن، یک reason متنی کوتاه تولید می‌شود:

```text
if mood_score >= 4:
    reason = "Strong match for your {mood} mood"
else:
    reason = "Good fit for your {mood} mood"

if situation_score >= 4:
    reason += " and well suited for {situation} viewing"
```

این reason صرفاً برای نمایش UI است و در منطق انتخاب نقشی ندارد.

---

## 7. Config قابل تنظیم (برای calibration بعدی)

```ts
export const SCORING_CONFIG = {
  TOP_BAND: 0.5,                // بازه‌ی near-tie برای Step 3
  MIN_ACCEPTABLE_MOOD_SCORE: 3, // آستانه‌ی "No strong match yet"
  SITUATION_WEIGHT: {
    1: 0.15,
    2: 0.4,
    3: 0.65,
    4: 0.85,
    5: 1.0
  }
};
```

در فازهای بعدی، این جدول می‌تواند بر اساس `decision_event` (`accepted` در برابر `try_again`) calibrate شود — مثلاً اگر فیلم‌هایی با `situation_score = 2` نرخ reject بالایی دارند، وزن آن سطح کاهش می‌یابد. این کار در Sprint 1 لازم نیست و صرفاً تنظیم دستی همین جدول است، نه ML واقعی.

---

## 8. نکته‌ی معماری برای Developer — چرا و کجای کد باید این را رعایت کند

این بخش پاسخ به این سؤال است: *«اگر بعداً بخواهیم منطق انتخاب را عوض کنیم (مثلاً از weighted probability برگردیم به یک روش دیگر)، آیا دردسر دارد؟»* — نه، اگر از همین ابتدا دو اصل زیر رعایت شود:

1. **داده‌ی خام دست‌نخورده بماند.** `situation_score` و `mood_score` همیشه باید همان عدد خام ۱ تا ۵ در دیتابیس ذخیره شوند، نه یک نسخه‌ی از‌قبل‌فیلترشده یا boolean. تصمیم (فیلتر کردن، وزن‌دهی، یا هر روش دیگر) باید در لایه‌ی انتخاب گرفته شود، نه در خود داده.

2. **منطق انتخاب در یک تابع ایزوله باشد.** تمام Step‌های ۲ تا ۵ (رتبه‌بندی بر اساس Mood، Top-K، حذف reject‌شده‌ها، weighted random pick) باید در یک تابع واحد پیاده‌سازی شود، مثلاً:

```ts
function selectMovieFromCandidates(candidates: Movie[], config: SCORING_CONFIG): Movie
```

تا زمانی که این تابع تنها جایی باشد که تصمیم نهایی گرفته می‌شود، تغییر دادن خود منطق (مثلاً عوض کردن جدول `SITUATION_WEIGHT`، یا برگشتن به یک hard filter، یا اضافه کردن یک معیار سوم در آینده) فقط به بازنویسی همین یک تابع محدود می‌ماند — بدون نیاز به تغییر schema، API، یا UI.

---

## 9. خلاصه‌ی تفاوت با فرمول اولیه‌ی سند اصلی

| | فرمول اولیه (بخش ۱۰ سند اصلی) | این نسخه |
|---|---|---|
| نقش Situation | جزء جمع‌شونده با Mood | وزنِ احتمال انتخاب (weighted random) |
| نقش Mood | جزء جمع‌شونده | تنها معیار رتبه‌بندی |
| ریسک جبران نادرست | بله | حذف‌شده |
| رفتار امتیاز Situation=1/2 | عملاً بی‌اثر یا حذف‌کننده | همچنان مؤثر، فقط با شانس کمتر (حداقل ۰.۱۵) |
| تکرار پیشنهاد برای ورودی ثابت | بله (بدون Top-K) | خیر (Top-K + weighted random) |
| معیار "No strong match" | مبهم | آستانه‌ی عددی مشخص روی Mood |
| قابلیت تغییر بعدی | — | ایزوله در یک تابع (`selectMovieFromCandidates`) |
