# Movie Decision App — Product Handoff / MVP Specification

## 1. Product Definition

### One-sentence idea
برای کسانی که هنگام انتخاب فیلم دچار **decision paralysis** می‌شوند، یک فیلم متناسب با **زمان، مود و موقعیت فعلی**‌شان انتخاب می‌کند.

### Core problem
کاربر برای پیدا کردن فیلم مناسب، بین گزینه‌های زیاد جست‌وجو می‌کند و ممکن است بعد از مدت طولانی همچنان تصمیمی نگیرد و در نهایت از فیلم دیدن منصرف شود.

### Core value proposition
**Reduce decision friction, not increase discovery.**

محصول قرار نیست هزاران فیلم را به کاربر نشان دهد؛ قرار است فضای تصمیم‌گیری را کوچک کند و در نهایت **یک فیلم** پیشنهاد دهد.

---

# 2. Core Product Principle

> **Time + Mood + Situation → 1 Movie**

اصل کلیدی MVP:
- کاربر چند preference ساده را انتخاب می‌کند.
- سیستم candidateها را محدود و رتبه‌بندی می‌کند.
- محصول **یک فیلم** ارائه می‌دهد.
- کاربر یا آن را انتخاب می‌کند یا `Try Another` می‌زند.

هدف این نیست که کاربر بین چند فیلم انتخاب کند؛ این کار بخشی از decision paralysis را دوباره ایجاد می‌کند.

---

# 3. MVP User Scenarios

هسته همه سناریوها یک مسئله است: **خلاص شدن از تصمیم‌گیری.**

1. **I don't know what to watch**
2. **I have limited time**
3. **Choose by mood**
4. **Watching with someone**
5. **Surprise Me**

در همه موارد، خروجی اصلی فقط **یک فیلم** است.

---

# 4. MVP Scope

## In Scope
- English UI
- Guest-first experience
- Curated movie catalog
- Time selection
- Mood selection
- Situation selection
- `Find My Movie`
- `Surprise Me`
- One-movie recommendation
- `I'm Watching This`
- `Try Another`
- Basic recommendation record
- Basic watchlist داخل محصول
- AI-assisted movie tagging + human review

## Out of Scope for Sprint 1
- Persian UI
- IMDb / Letterboxd / TV Time watchlist import
- Streaming availability
- Iranian streaming platform integrations
- Browser extension
- Complex personalization
- User accounts
- Community/social features
- Large movie catalog
- Genre as a primary user filter
- Era/year as a user filter
- Advanced recommendation ML
- Automatic preference relaxation

---

# 5. Time Taxonomy

Time is a **hard constraint**.

- **Under 90 min**
- **90–120 min**
- **2+ hours**

اگر کاربر `Under 90 min` را انتخاب کند، فیلم 130 دقیقه‌ای وارد candidate pool نمی‌شود.

---

# 6. Mood Taxonomy

Mood بر اساس **desired viewing experience** است، نه Genre.

1. **Cozy / Relax**
2. **Funny**
3. **Thrill / Tense**
4. **Emotional**
5. **Thoughtful / Mind-bending**
6. **Epic**
7. **Surprise Me**

`Surprise Me` یک Mood نیست؛ یک recommendation mode مستقل است.

### Genre vs Mood
Genre پاسخ می‌دهد: «این فیلم چه نوع فیلمی است؟»
Mood پاسخ می‌دهد: «الان چه تجربه‌ای می‌خواهم؟»

بنابراین Genre فیلتر اصلی MVP نیست؛ چون Genre را می‌توان نسبتاً راحت search کرد، اما بیان و پیدا کردن فیلم مناسب بر اساس حس و حال فعلی سخت‌تر است.

---

# 7. Mood Scoring Rubric

امتیازها **ordinal 1–5** هستند و برای ranking استفاده می‌شوند، نه اندازه‌گیری علمی.

## Cozy / Relax
- 1 — very tense, disturbing or emotionally demanding
- 2 — relatively heavy or tense
- 3 — balanced / moderate
- 4 — mostly calm, warm and easy-going
- 5 — strongly cozy, comforting, relaxing and low-stakes

## Funny
- 1 — almost no humor
- 2 — limited humorous moments
- 3 — meaningful humor but not dominant
- 4 — predominantly funny and entertaining
- 5 — strongly comedy-driven / consistently funny

## Thrill / Tense
- 1 — calm, little tension
- 2 — limited tension
- 3 — meaningful suspense/excitement
- 4 — consistently suspenseful or exciting
- 5 — highly tense, thrilling or adrenaline-driven

## Emotional
- 1 — low emotional engagement
- 2 — a few emotional moments
- 3 — meaningful emotional component
- 4 — strongly emotionally engaging
- 5 — deeply moving or emotionally intense

**Emotional → feel**

## Thoughtful / Mind-bending
- 1 — straightforward, low intellectual demand
- 2 — some thematic content
- 3 — meaningful ideas or themes
- 4 — strongly thought-provoking or complex
- 5 — highly cerebral, ambiguous or mind-bending

**Thoughtful → think**

`Mind-bending` نباید صرفاً به معنی «confusing» باشد.

## Epic
- 1 — intimate / small-scale
- 2 — relatively limited scale
- 3 — moderate scale
- 4 — large-scale visually or narratively
- 5 — grand, spectacular, immersive cinematic experience

**Epic ≠ long.**

---

# 8. Situation Taxonomy

- **Alone**
- **Partner**
- **Friends**
- **Family**
- **Kids**

برای هر فیلم، suitability هر situation از **1 تا 5** تعیین می‌شود.

تعریف کلی:
> How suitable is this movie for this viewing context?

مثلاً برای Partner:
- 5 — strongly suited to shared two-person viewing
- 3 — can work for couples but is not especially suited to it
- 1 — poor fit for typical couple viewing

برای Kids، age/content suitability در آینده می‌تواند با metadata جداگانه مثل age rating و content flags دقیق‌تر شود. در MVP به دلیل curated catalog می‌توان موارد واضحاً نامناسب را دستی کنترل کرد.

---

# 9. AI-Assisted Movie Tagging

## Pipeline

```text
TMDB / movie metadata
        ↓
Movie metadata dataset
        ↓
AI-assisted tagging
        ↓
Human review
        ↓
Final movie dataset
        ↓
Database
        ↓
Recommendation engine
```

### Product Designer
- Define taxonomy
- Define scoring rubrics
- Define AI prompt
- Review representative outputs
- Quality control

### AI
- Generate initial Mood scores
- Generate initial Situation scores
- Return structured output

### Developer
- Import/create dataset
- Database schema
- Data ingestion
- Recommendation logic
- App integration

AI source of truth نیست؛ **initial tagging assistant** است.

پیشنهاد: ابتدا روی یک sample نماینده اجرا شود، human review شود، rubric/prompt اصلاح شود، سپس batch بزرگ‌تر تولید شود.

برای validation اولیه، حدود **50–100 فیلم curated** می‌تواند کافی باشد؛ در صورت نیاز catalog می‌تواند به 100–300 فیلم برسد.

---

# 10. Recommendation Logic — MVP

```text
User selections
      ↓
Time hard filter
      ↓
Candidate movies
      ↓
Mood score
      +
Situation score
      ↓
Rank
      ↓
ONE MOVIE
```

Initial scoring:

```text
Final Score = Mood Score + Situation Score
```

وزن‌های دقیق فعلاً **TBD** هستند و نباید به‌صورت عددهای دلخواه hard-code شوند.

بعداً می‌توان وزن‌ها را با رفتار واقعی کاربران calibration کرد.

---

# 11. Surprise Me

`Surprise Me` یعنی کاربر تصمیم Mood را به محصول واگذار می‌کند.

محصول همچنان از curated catalog انتخاب می‌کند و recommendation کاملاً random نیست.

در یک session، فیلمی که قبلاً reject شده نباید بلافاصله دوباره نمایش داده شود.

---

# 12. Record / Data

## Recommendation Event

```text
recommendation_id
movie_id
time_selection
mood_selection
situation_selection
timestamp
anonymous_user_id / session_id
```

## Decision Event

```text
recommendation_id
decision
timestamp
```

Decision:
- `accepted`
- `try_again`

`Try Another` به معنی بد بودن فیلم نیست؛ فقط یعنی در آن session انتخاب نشده است.

## Feedback

Optional:
- `good_fit`
- `not_a_fit`

Feedback خودش یک Record است، اما با selection/acceptance یکی نیست.

## Basic Watchlist

```text
movie_id
anonymous_user_id
added_at
```

Guest-first persistence برای MVP قابل قبول است؛ پاک شدن browser data یا تغییر device می‌تواند باعث از دست رفتن guest data شود.

---

# 13. User Decision Flow

```text
Time
Mood
Situation
   ↓
Find My Movie
   ↓
ONE MOVIE
   ↓
[ I'm Watching This ]
[ Try Another ]
```

`I'm Watching This` → `decision = accepted`

`Try Another` → `decision = try_again`

در صورت نیاز:
`Add to Watchlist`

---

# 14. Definition of Quality

Recommendation خوب الزاماً «فیلم خوب» نیست.

تعریف کیفیت:

> **A movie that feels sufficiently compatible with what the user wants to watch right now.**

Feedback پیشنهادی:

> **How well does this fit what you want right now?**

- Not really
- Okay
- Good fit
- Exactly what I wanted

---

# 15. Definition of Success

## Primary
### Decision Completion Rate

```text
Sessions ending in a movie decision
------------------------------------
Total recommendation sessions
```

## Secondary
### Time to Decision

زمان از شروع recommendation flow تا accepted movie.

در Sprint 1 بهتر است ابتدا baseline جمع شود و target عددی بعداً تعیین شود.

## Quality
### Recommendation Acceptance Rate

```text
Accepted recommendations
-------------------------
Total recommendations shown
```

---

# 16. Failure Strategy

محصول نباید برای جبران recommendation ضعیف، چندین فیلم را همزمان نشان دهد؛ این کار decision paralysis را برمی‌گرداند.

اگر match مناسبی وجود نداشت:

> **No strong match yet. We can loosen one of your preferences to find a better option.**

Actions:
- Change Time
- Change Mood
- Change Situation

Automatic preference relaxation برای MVP نیست.

---

# 17. Future Features

## Personalization
Onboarding و داده‌هایی مثل preferences، favorite/disliked movies و viewing habits می‌توانند در فازهای بعدی برای personalization استفاده شوند.

## Watchlist Import
IMDb، Letterboxd، TV Time و منابع مشابه؛ سپس match کردن watchlist با catalog داخلی و اجرای recommendation.

## Era / Release Year
Year از ابتدا در movie metadata ذخیره شود، حتی اگر در MVP user filter نباشد.

## Streaming Availability
نمایش اینکه فیلم در چه پلتفرمی قابل مشاهده است؛ شامل بررسی امکان پلتفرم‌های ایرانی در آینده.

## Browser Extension
یک extension می‌تواند در آینده recommendation experience را روی سایت‌های streaming ارائه کند.

## Shared Profiles
اضافه کردن پروفایل چند نفر و پیدا کردن فیلم بر اساس taste مشترک.

---

# 18. MVP Product Principle

> **The product is not a better movie search engine. It is a decision-reduction tool.**

هر feature جدید باید با این سؤال ارزیابی شود:

> Does this reduce decision friction, or does it give the user more things to decide?

مثال:
- Mood → Yes
- Time → Yes
- Situation → Yes
- One movie → Yes
- Try Another → Yes
- Genre filter → Not core
- 5 recommendations → No
- Community → No
- Streaming availability → Future
- Watchlist import → Future
- Complex personalization → Future

---

# 19. Sprint 1 Technical Summary

Developer باید بتواند این موارد را پیاده‌سازی کند:

### Data
- Movie
- Runtime
- Release year
- Mood scores
- Situation scores
- Recommendation events
- Decision events
- Watchlist records
- Anonymous user/session identifier

### Logic
```text
Time filter
    ↓
Mood + Situation scoring
    ↓
Ranking
    ↓
ONE MOVIE
```

### Architecture principle

Avoid:
- Complex ML
- Real-time LLM recommendation
- Large-scale movie database
- Account system
- External platform integrations

MVP باید deterministic، inspectable و easy to iterate باشد.

---

# 20. Core Hypothesis

> **If we reduce a large movie choice set to one context-matched recommendation using Time, Mood and Situation, users will reach a movie decision faster and abandon the movie-selection process less often.**
