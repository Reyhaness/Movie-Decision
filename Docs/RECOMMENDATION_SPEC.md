# RECOMMENDATION_SPEC.md

## 1. Purpose

This document defines the MVP recommendation engine.

The engine's job is not to identify the objectively "best" movie.

Its job is to select **one movie that is a strong fit for the user's
current context**.

### Core input

**Time + Mood + Situation → 1 Movie**

The recommendation should optimize for contextual fit, not movie
quality, popularity, rating, or general cultural importance.

------------------------------------------------------------------------

# 2. MVP Inputs

Every standard recommendation request contains:

``` text
time
mood
situation
```

### Time

-   `under_90`
-   `90_to_120`
-   `over_120`

### Mood

-   `cozy_relax`
-   `funny`
-   `thrill_tense`
-   `emotional`
-   `thoughtful_mind_bending`
-   `epic`
-   `surprise_me`

### Situation

-   `alone`
-   `partner`
-   `friends`
-   `family`
-   `kids`

------------------------------------------------------------------------

# 3. Recommendation Pipeline

The MVP pipeline is:

``` text
User preferences
      ↓
Time hard filter
      ↓
Candidate movies
      ↓
Mood + Situation fit scoring
      ↓
Exclude session history / rejected movies
      ↓
Rank candidates
      ↓
Minimum-fit check
      ↓
Select ONE movie
```

Time is treated differently from Mood and Situation.

------------------------------------------------------------------------

# 4. Time Filtering

Time should be a **hard constraint** in the MVP.

The system should first remove movies that do not fit the available
time.

### Mapping

  User choice    Candidate rule
  -------------- ------------------------------------
  Under 90 min   runtime \< 90 min
  90--120 min    runtime \>= 90 AND runtime \<= 120
  2+ hours       runtime \>= 120 min

### Important implementation note

Runtime is movie runtime, not estimated total "watching session"
duration.

If the product later models trailers, breaks, or setup time, the rule
can be revisited.

### Boundary decisions

For MVP, use inclusive boundaries for 90 and 120:

-   89 min → Under 90
-   90 min → 90--120
-   120 min → 90--120
-   121 min → 2+ hours

------------------------------------------------------------------------

# 5. Movie Fit Data

Every curated movie should contain:

``` text
movie_id
title
runtime
release_year
genres[]
mood_scores
situation_scores
```

### Mood scores

Each movie receives a 1--5 score for every mood:

``` text
cozy_relax: 1..5
funny: 1..5
thrill_tense: 1..5
emotional: 1..5
thoughtful_mind_bending: 1..5
epic: 1..5
```

### Situation scores

Each movie receives a 1--5 score for every situation:

``` text
alone: 1..5
partner: 1..5
friends: 1..5
family: 1..5
kids: 1..5
```

### Meaning of the scale

These are **ordinal suitability labels**, not scientific measurements.

    Score Meaning
  ------- -----------------------
        1 Very poor fit
        2 Weak fit
        3 Moderate / acceptable
        4 Strong fit
        5 Excellent fit

A score of 5 means "excellent fit for this context," not "better movie."

------------------------------------------------------------------------

# 6. Why Not Just Add Mood + Situation?

A simple sum:

``` text
mood_score + situation_score
```

is easy to implement but has a weakness.

For example:

``` text
5 + 1 = 6
3 + 3 = 6
```

These are numerically equal but behaviorally different.

A movie that is excellent for the requested mood but very poor for the
social situation may be a bad recommendation.

Therefore the engine should penalize imbalance.

------------------------------------------------------------------------

# 7. MVP Ranking Model

The recommended MVP baseline is **distance from the ideal fit**,
calculated after Time filtering.

For the selected Mood and Situation:

``` text
distance =
    (5 - mood_score)^2
  + (5 - situation_score)^2
```

Lower distance is better.

### Examples

    Mood   Situation   Distance
  ------ ----------- ----------
       5           5          0
       5           4          1
       4           4          2
       5           3          4
       3           3          8
       2           2         18
       3           1         20
       5           1         16

This makes balanced fit preferable to a highly uneven fit.

### Important

This formula is an MVP hypothesis, not a scientifically validated truth.

It should be tested against real recommendation outcomes before adding
more complexity.

## Recommendation Strategy Modularity

The current recommendation algorithm should be treated as **Strategy V1**.

It is an initial MVP hypothesis and is not considered a permanent product decision.

The implementation must make the recommendation strategy replaceable.

Filtering, scoring, ranking, tie-breaking, and candidate selection should be separated behind clear interfaces or modules where practical.

The UI and application flow must not depend directly on the internal scoring formula.

This means that the recommendation strategy can later be changed—for example, from the current distance-based approach to a weighted model, another ranking model, or a more data-driven approach—without requiring a rewrite of:

* The UI
* The main user flow
* The movie database structure
* Watchlist functionality
* Analytics/event tracking

For MVP, implement the current recommendation model as **Strategy V1**, but keep the implementation intentionally modular.

Do not over-engineer a generic recommendation framework. The goal is simply to avoid tightly coupling the current scoring formula to the rest of the application.

Future recommendation strategies may include:

* Weighted scoring
* Alternative ranking formulas
* Learned/data-driven ranking
* Personalization
* User-specific preferences

These are future possibilities and should not be implemented in the MVP.


------------------------------------------------------------------------

# 8. Why Squared Distance?

Squaring makes large mismatches matter more.

Example:

``` text
5 → 4 = 1 point of distance
5 → 2 = 9 points of distance
```

This reflects an important product principle:

> A movie that is excellent in one dimension but terrible in another
> should not automatically win.

However, the model must remain easy to understand and modify.

------------------------------------------------------------------------

# 9. Tie-Breaking

If two or more candidates have the same distance:

### Tie-breaker 1

Higher selected Mood score.

### Tie-breaker 2

Higher selected Situation score.

### Tie-breaker 3

Random selection among remaining equal candidates.

Randomness is useful because it prevents the same movie from repeatedly
winning every equivalent scenario.

------------------------------------------------------------------------

# 10. Candidate Exclusion

Before ranking:

Exclude:

1.  Movies that fail the Time filter.
2.  Movies already shown in the current recommendation session.
3.  Movies explicitly rejected in the current session.
4.  Movies unavailable in the current catalog state.
5.  Movies that violate explicit content constraints, if such
    constraints are added later.

### Session-level exclusion

The MVP should remember which movies were already shown during the
current decision session.

Example:

``` text
Session:
Time = 90–120
Mood = Funny
Situation = Friends

Result A shown
↓
Try Another
↓
Result A excluded
↓
Result B shown
```

This prevents "Try Another" from returning the same movie.

------------------------------------------------------------------------

# 11. Try Another

`Try Another` uses the same:

``` text
Time
Mood
Situation
```

and excludes previously shown movies.

It should not modify the user's preferences.

### Important product rule

Try Another means:

> "Make the decision again."

It does not mean:

> "Show me a list."

------------------------------------------------------------------------

# 12. Surprise Me

Surprise Me is a **mode**, not a seventh mood score.

When `mood = surprise_me`:

1.  Apply Time filtering.
2.  Continue using Situation fit.
3.  Do not optimize for one specific mood.
4.  Introduce controlled randomness among strong candidates.

A simple MVP approach:

``` text
Time filter
→ Situation score
→ retain candidates with strong situation fit
→ randomly select from the top candidate pool
```

The top pool should be large enough to feel surprising but small enough
to avoid obviously poor recommendations.

The exact percentile/pool size should be configurable rather than
hard-coded into the UI.

------------------------------------------------------------------------

# 13. No-Match / Weak-Match Behavior

The engine must distinguish:

-   **No candidate**: no movies survive hard filtering.
-   **Weak candidate set**: movies exist, but none is a strong
    contextual fit.

Do not force a bad recommendation.

### Configurable threshold

The implementation should expose a minimum acceptable fit threshold.

For example, the engine can calculate:

``` text
fit_score = 10 - distance
```

and reject candidates below a configured threshold.

Do not treat the example threshold as validated product truth.

### No strong match response

Return:

``` text
status = "no_strong_match"
```

with possible relaxation suggestions.

The UX can then offer:

-   Change Time
-   Change Mood
-   Change Situation
-   Surprise Me

------------------------------------------------------------------------

# 14. Recommendation Result Contract

The recommendation service should return structured data rather than UI
copy.

Example:

``` json
{
  "status": "success",
  "movie_id": "tmdb_123",
  "reason_context": {
    "time": "90_to_120",
    "mood": "funny",
    "situation": "friends"
  },
  "scores": {
    "mood": 5,
    "situation": 4
  },
  "distance": 1,
  "session_excluded_count": 2
}
```

For a weak/no match:

``` json
{
  "status": "no_strong_match",
  "reason": "No candidate meets the minimum contextual fit threshold"
}
```

Internal scores should not necessarily be exposed directly in the user
interface.

------------------------------------------------------------------------

# 15. Recommendation Explanation

The system should provide a short human-readable reason.

The reason should explain **fit**, not movie quality.

Good:

> A light, funny pick that works well for a group without requiring too
> much attention.

Bad:

> This is one of the highest-rated comedies ever.

The explanation should be generated from structured movie metadata/rules
where possible.

Do not make an LLM call necessary for every recommendation in the MVP.

------------------------------------------------------------------------

# 16. Movie Tagging Workflow

The catalog is intentionally small.

Target MVP catalog:

**\~100--300 curated movies**

### Workflow

``` text
TMDB metadata
      ↓
AI-assisted tagging
      ↓
Human review
      ↓
Approved movie record
      ↓
Database
```

AI can suggest mood/situation scores, but human review should validate
them.

### Tagging principle

Score the movie for:

> "How suitable is this movie when the user specifically wants X?"

Not:

> "Does this movie contain X?"

For example, a movie may contain comedy but still be a poor
recommendation for someone who wants a light, easygoing night.

------------------------------------------------------------------------

# 17. Situation Scoring Guidance

Situation scores should represent **social suitability**, not whether
the movie technically can be watched in that setting.

Consider:

### Alone

Questions: - Does solo viewing work? - Does the movie benefit from
introspection? - Would it be awkward or less satisfying alone?

### Partner

Questions: - Does it work well for two people? - Does it create a good
shared viewing experience? - Is the tone compatible with a typical
couple movie night?

### Friends

Questions: - Is it engaging or entertaining as a group? - Does it create
shared reactions/discussion? - Is the pacing suitable for social
viewing?

### Family

Questions: - Is it broadly appropriate for mixed-age family viewing? -
Are there major awkwardness/content issues?

### Kids

Questions: - Is it genuinely appropriate for children? - Consider age
suitability rather than merely "family friendly."

The rubric should be documented separately if the catalog grows
significantly.

------------------------------------------------------------------------

# 18. Mood Scoring Guidance

Mood scores should represent **experiential fit**.

### Cozy / Relax

High: - warm - comforting - low-stress - easygoing - emotionally safe

Low: - relentlessly stressful - disturbing - exhausting - highly complex

### Funny

High: - consistently comedic - playful - lighthearted - likely to create
laughs

### Thrill / Tense

High: - suspenseful - exciting - action-driven - tense - scary where
appropriate

### Emotional

High: - emotionally affecting - relationship-driven - moving - likely to
create a strong emotional response

### Thoughtful / Mind-bending

High: - intellectually engaging - ambiguous - conceptually complex -
discussion-provoking

### Epic

High: - large-scale - adventurous - grand - cinematic - immersive

These categories describe the experience the user is asking for, not the
movie's genre labels.

------------------------------------------------------------------------

# 19. Genre

Genre is metadata.

It may be useful for:

-   explanations
-   future filtering
-   tagging
-   analytics
-   catalog management

It is not a primary MVP user input.

------------------------------------------------------------------------

# 20. Personalization

No personalized recommendation model is required for MVP.

Do not introduce:

-   collaborative filtering
-   embeddings
-   ML ranking
-   user taste vectors
-   complex preference learning

The MVP should first validate whether contextual decision-making itself
solves the problem.

------------------------------------------------------------------------

# 21. Future Recommendation Evolution

Only after usage data exists should the team consider:

1.  Mood/Situation weighting.
2.  User-specific preference adjustments.
3.  Watch history.
4.  Rejection patterns.
5.  Imported watchlists.
6.  Content similarity.
7.  Learned ranking.
8.  Streaming availability.
9.  Group taste aggregation.

A future scoring model could look like:

``` text
context_fit
+ personalization
+ novelty
+ history adjustment
```

but this should not be implemented in the MVP without evidence.

------------------------------------------------------------------------

# 22. Test Matrix

The recommendation engine must be tested with explicit scenarios.

Minimum examples:

    Mood   Situation        Candidate A     Candidate B Expected principle
  ------ ----------- ------------------ --------------- ---------------------------------
       5           5                5/5             4/5 Prefer A
       5           4                5/4             4/4 Prefer 5/4
       5           1                5/1             3/3 Prefer balanced candidate
       3           3                3/3             2/4 Compare balanced contextual fit
       4           4                4/4             5/3 Validate tie/near-tie behavior
       2           5                2/5             4/3 Validate balance
       5           5         same score      same score Random tie-break
     any         any    runtime invalid   runtime valid Remove invalid runtime
     any         any   previously shown             new Exclude previously shown

The exact expected winner for ambiguous cases should be confirmed during
implementation testing rather than assumed from intuition.

------------------------------------------------------------------------

# 23. Analytics Required for Future Tuning

Record at minimum:

``` text
session_started
preferences_submitted
recommendation_shown
movie_accepted
try_another
feedback_submitted
watchlist_added
```

Useful fields:

``` text
session_id
movie_id
time
mood
situation
recommendation_rank
distance
timestamp
```

This allows the team to later answer:

-   Which contexts have low completion rates?
-   Which movies are repeatedly rejected?
-   Which moods have too few strong candidates?
-   How often do users need Try Another?
-   Where does the catalog have coverage gaps?

------------------------------------------------------------------------

# 24. MVP Recommendation Philosophy

The engine should remain intentionally simple.

The product hypothesis being tested is:

> Can a small curated catalog, filtered by time and ranked by contextual
> mood/situation fit, reduce movie decision friction enough that users
> actually choose something?

If the answer is yes, complexity can be added later.

If the answer is no, adding ML or more scoring dimensions is unlikely to
solve the underlying product problem by itself.
