# TECH_SPEC.md

## 1. Purpose

This document defines the technical architecture for the Movie Decision
MVP.

The engineering goal is to ship a lightweight web product that can:

1.  Collect Time + Mood + Situation.
2.  Filter and rank a small movie catalog.
3.  Return exactly one recommendation.
4.  Support Try Another.
5.  Persist a lightweight guest watchlist.
6.  Record product events for validation.
7.  Be easy to modify as recommendation rules evolve.

The system should optimize for **speed of iteration and clarity**, not
premature scalability.

------------------------------------------------------------------------

# 2. Recommended MVP Architecture

Recommended baseline:

``` text
Browser
  ↓
Web App
  ↓
Application / API layer
  ↓
PostgreSQL
```

Recommended implementation stack:

-   Next.js
-   TypeScript
-   React
-   PostgreSQL
-   ORM such as Prisma or Drizzle
-   Server-side recommendation service
-   TMDB used as an ingestion/metadata source, not as the recommendation
    database
-   Vercel or equivalent web deployment

If the engineering team already has a preferred equivalent stack, the
architecture should remain functionally compatible with this document.

------------------------------------------------------------------------

# 3. Architecture Principles

### 3.1 Recommendation logic must be deterministic and testable

Do not put recommendation rules directly inside UI components.

Use a standalone service/function:

``` text
recommendMovie(input, candidates, sessionState)
```

This allows the algorithm to be tested without running the application.

### 3.2 UI must not own product logic

The frontend collects preferences and displays results.

It should not decide:

-   which movies qualify
-   how scores are calculated
-   how ties work
-   whether a movie is a strong match

### 3.3 TMDB is not the product database

TMDB provides metadata.

The product owns:

-   curated catalog membership
-   mood scores
-   situation scores
-   recommendation configuration
-   product events
-   watchlist state

### 3.4 Keep the recommendation model replaceable

The initial ranking algorithm is an MVP hypothesis.

Do not hard-wire the formula into database queries or UI code.

------------------------------------------------------------------------

# 4. High-Level Data Flow

``` text
User
 ↓
Preference Form
 ↓
POST /api/recommendations
 ↓
Validate input
 ↓
Load eligible movies
 ↓
Apply Time filter
 ↓
Apply session exclusions
 ↓
Calculate Mood + Situation fit
 ↓
Rank
 ↓
Return ONE movie
 ↓
UI displays recommendation
 ↓
Event recorded
```

------------------------------------------------------------------------

# 5. Data Model

## 5.1 Movie

Suggested fields:

``` text
Movie
- id
- tmdbId
- title
- originalTitle
- overview
- posterPath
- backdropPath
- releaseDate
- releaseYear
- runtimeMinutes
- genres
- isActive
- createdAt
- updatedAt
```

`tmdbId` should be unique when present.

------------------------------------------------------------------------

## 5.2 Movie Mood Scores

Prefer a normalized relation or JSON structure that remains easy to
update.

Recommended normalized conceptual model:

``` text
MovieMoodScore
- id
- movieId
- mood
- score
```

Where:

``` text
mood =
  cozy_relax
  funny
  thrill_tense
  emotional
  thoughtful_mind_bending
  epic
```

Score:

``` text
1..5
```

------------------------------------------------------------------------

## 5.3 Movie Situation Scores

``` text
MovieSituationScore
- id
- movieId
- situation
- score
```

Where:

``` text
situation =
  alone
  partner
  friends
  family
  kids
```

Score:

``` text
1..5
```

### Why normalize these?

The taxonomy may change.

Normalized records make it easier to:

-   add a category
-   edit scores
-   run analytics
-   inspect data
-   build an admin/tagging interface later

------------------------------------------------------------------------

# 6. Guest User / Session

The MVP should not require account creation.

Use an anonymous user identity.

Conceptually:

``` text
AnonymousUser
- id
- createdAt
- lastSeenAt
```

The browser receives a secure identifier/cookie.

If the chosen framework already provides a secure session mechanism, use
it rather than creating a custom authentication system.

------------------------------------------------------------------------

# 7. Watchlist

``` text
WatchlistItem
- id
- anonymousUserId
- movieId
- createdAt
```

Constraints:

``` text
unique(anonymousUserId, movieId)
```

A movie should not appear twice in the same user's watchlist.

------------------------------------------------------------------------

# 8. Recommendation Session

A recommendation session represents one decision attempt.

Suggested model:

``` text
RecommendationSession
- id
- anonymousUserId
- timePreference
- moodPreference
- situationPreference
- createdAt
- completedAt
```

This makes Try Another state explicit and allows later analysis.

------------------------------------------------------------------------

# 9. Recommendation Attempts

Optional but useful:

``` text
RecommendationAttempt
- id
- sessionId
- movieId
- moodScore
- situationScore
- distance
- attemptNumber
- accepted
- createdAt
```

This can be used to understand:

-   which movie was shown first
-   which movies were rejected
-   how many attempts users needed
-   which contexts fail most often

If implementation simplicity is critical, these fields can initially be
represented through event records instead.

------------------------------------------------------------------------

# 10. Analytics Events

Minimum event model:

``` text
Event
- id
- anonymousUserId
- sessionId
- eventType
- movieId nullable
- metadata JSON nullable
- createdAt
```

Event types:

``` text
session_started
preferences_submitted
recommendation_shown
movie_accepted
try_another
feedback_submitted
watchlist_added
```

### Example metadata

``` json
{
  "time": "90_to_120",
  "mood": "funny",
  "situation": "friends",
  "distance": 1
}
```

Do not collect unnecessary personal information.

------------------------------------------------------------------------

# 11. API Surface

Keep the API small.

## POST /api/recommendations

Input:

``` json
{
  "time": "90_to_120",
  "mood": "funny",
  "situation": "friends",
  "sessionId": "..."
}
```

Output:

``` json
{
  "status": "success",
  "movie": {
    "id": "...",
    "title": "...",
    "releaseYear": 2022,
    "runtimeMinutes": 108,
    "posterPath": "...",
    "overview": "...",
    "genres": ["Comedy", "Drama"]
  },
  "context": {
    "time": "90_to_120",
    "mood": "funny",
    "situation": "friends"
  }
}
```

Do not expose internal scoring unless needed for debugging.

------------------------------------------------------------------------

## POST /api/watchlist

Add movie.

``` json
{
  "movieId": "..."
}
```

------------------------------------------------------------------------

## DELETE /api/watchlist/:movieId

Remove movie.

------------------------------------------------------------------------

## GET /api/watchlist

Return the current guest user's saved movies.

------------------------------------------------------------------------

## POST /api/events

Record product events.

The event endpoint should validate allowed event types.

------------------------------------------------------------------------

# 12. Recommendation Service

Create a dedicated module, for example:

``` text
src/services/recommendation/
  recommend.ts
  scoring.ts
  filters.ts
  types.ts
```

Core interface:

``` text
recommendMovie({
  time,
  mood,
  situation,
  excludedMovieIds
})
```

The service should:

1.  Validate input.
2.  Filter by runtime.
3.  Exclude previously shown movies.
4.  Handle Surprise Me separately.
5.  Calculate contextual fit.
6.  Sort candidates.
7.  Apply minimum-fit threshold.
8.  Return one movie or a no-strong-match status.

## Recommendation Strategy Isolation

The recommendation engine must be implemented as an isolated application service/module.

The current scoring and ranking approach is **Strategy V1** and may change after testing real user behavior.

Do not hard-code recommendation rules into UI components, API route handlers, database queries, or presentation logic.

The recommendation layer should expose a stable interface to the rest of the application, while its internal scoring/ranking implementation can change independently.

At minimum, keep these concerns logically separated:

1. Candidate filtering
2. Mood scoring
3. Situation scoring
4. Ranking
5. Tie-breaking
6. Candidate exclusion
7. Final movie selection

The initial implementation can remain simple. Do not build an unnecessarily abstract plugin system.

The architectural requirement is simply that replacing Strategy V1 later should not require rewriting the UI or the main application flow.

### Example

The application should conceptually work like:

User Preferences
→ Recommendation Service
→ Recommendation Result

rather than:

UI Component
→ specific scoring formula
→ database query
→ movie selection

This allows Strategy V1 to be replaced later without changing the user-facing product.

------------------------------------------------------------------------

# 13. Time Filter Implementation

``` text
under_90:
  runtimeMinutes < 90

90_to_120:
  runtimeMinutes >= 90
  AND runtimeMinutes <= 120

over_120:
  runtimeMinutes >= 120
```

Boundary behavior must match `RECOMMENDATION_SPEC.md`.

------------------------------------------------------------------------

# 14. Scoring Implementation

For a standard mood:

``` text
distance =
  (5 - moodScore)^2
  + (5 - situationScore)^2
```

Lower distance wins.

### Tie-breaking

1.  Lower distance.
2.  Higher mood score.
3.  Higher situation score.
4.  Random among remaining ties.

Keep this implementation in one function so it can be replaced later.

------------------------------------------------------------------------

# 15. Surprise Me Implementation

`surprise_me` should not look up a nonexistent mood score.

Suggested flow:

``` text
Time filter
→ session exclusion
→ rank by Situation fit
→ retain strong candidates
→ randomly select from candidate pool
```

The exact pool size should be configurable.

Example configuration:

``` text
SURPRISE_POOL_SIZE = 10
```

Do not expose this implementation detail to users.

------------------------------------------------------------------------

# 16. Minimum Fit Threshold

The recommendation service must support a configurable threshold.

Example configuration:

``` text
MIN_RECOMMENDATION_FIT = 5
```

Do not freeze this value before testing.

The initial implementation can use a temporary value in development.

The threshold should be easy to change without rewriting the ranking
algorithm.

------------------------------------------------------------------------

# 17. Try Another State

The frontend should maintain a `recommendationSessionId`.

The server should persist or otherwise reliably retrieve the movies
already shown in that session.

On `Try Another`:

``` text
existing session preferences
+
excluded movie IDs
→ recommendation service
```

The user does not need to reselect preferences.

------------------------------------------------------------------------

# 18. Catalog Management

The MVP catalog target is:

**100--300 movies**

Do not build a complex CMS.

A seed/import script is sufficient.

Suggested process:

``` text
TMDB
 ↓
fetch metadata
 ↓
create/update local movie record
 ↓
AI-assisted mood/situation tagging
 ↓
human review
 ↓
activate movie
```

Only `isActive = true` movies participate in recommendations.

------------------------------------------------------------------------

# 19. TMDB Integration

Use TMDB for metadata ingestion.

The application should not query TMDB live for every recommendation.

Instead:

``` text
TMDB → ingestion script → local database
```

This makes recommendations:

-   faster
-   deterministic
-   independent of external API availability
-   easier to test

Store the external ID so metadata can be refreshed later.

TMDB API credentials must remain server-side.

------------------------------------------------------------------------

# 20. Seed Data

The repository should contain a repeatable seed process.

Example:

``` text
npm run seed
```

The seed should be idempotent where practical:

-   existing movie → update
-   missing movie → insert
-   removed/deactivated movie → preserve record unless explicitly
    deleted

Do not manually insert hundreds of records through the UI.

------------------------------------------------------------------------

# 21. Environment Variables

At minimum:

``` text
DATABASE_URL
TMDB_API_KEY
```

If the deployment platform/session system requires additional secrets,
keep them server-side.

Never expose private API keys in client-side bundles.

------------------------------------------------------------------------

# 22. Security Basics

Even for a small MVP:

-   Validate all API input.
-   Use parameterized ORM/database queries.
-   Keep API secrets server-side.
-   Use secure cookies for anonymous identity where applicable.
-   Do not trust client-provided `userId`.
-   Rate-limit public endpoints if abuse becomes possible.
-   Do not store unnecessary personal data.

------------------------------------------------------------------------

# 23. Error Handling

Recommendation endpoint should return explicit statuses.

Example:

``` text
success
no_candidates
no_strong_match
invalid_input
service_error
```

The UI should map these to friendly states.

Do not leak stack traces or database errors to users.

------------------------------------------------------------------------

# 24. Testing Strategy

The recommendation engine is the most important unit to test before UI
polish.

### Unit tests

Test:

-   each Time boundary
-   each Mood
-   each Situation
-   score calculation
-   ranking
-   ties
-   session exclusions
-   no candidate
-   weak candidate
-   Surprise Me
-   Try Another

### Example

``` text
Given:
runtime = 108
mood score = 5
situation score = 4

Expected:
distance = 1
```

### Integration tests

At minimum:

``` text
preferences → API → recommendation
watchlist add → database → watchlist read
Try Another → excluded previous movie
```

------------------------------------------------------------------------

# 25. Observability

For MVP, keep it simple.

Log:

-   recommendation request
-   candidate count after Time filtering
-   candidate count after exclusions
-   selected movie
-   recommendation status
-   errors

Do not log sensitive information.

A basic event table is sufficient for product validation initially.

------------------------------------------------------------------------

# 26. Deployment

Recommended:

``` text
Git repository
      ↓
CI / deployment
      ↓
Web hosting
      ↓
Managed PostgreSQL
```

The MVP should have:

-   development environment
-   production environment
-   environment variables per environment
-   database migrations
-   repeatable seed process

------------------------------------------------------------------------

# 27. Engineering Order

Implement in this order:

### Phase 1 --- Foundation

-   Project setup
-   TypeScript
-   database connection
-   schema
-   migrations

### Phase 2 --- Catalog

-   Movie model
-   mood/situation score models
-   seed/import tooling
-   initial 100--300 curated movies

### Phase 3 --- Recommendation

-   Time filter
-   scoring
-   ranking
-   exclusion
-   Try Another
-   Surprise Me
-   tests

### Phase 4 --- Core UX

-   landing
-   preference form
-   recommendation result
-   loading/error/no-match states

### Phase 5 --- Record

-   anonymous identity
-   watchlist
-   recommendation session
-   events

### Phase 6 --- Validation

-   analytics review
-   recommendation edge cases
-   completion-rate measurement
-   catalog gap analysis

Do not start with accounts, imports, personalization, streaming
integrations, or extensions.

------------------------------------------------------------------------

# 28. Out of Scope

Explicitly out of MVP:

-   OAuth/social login
-   IMDb import
-   Letterboxd import
-   TV Time import
-   Browser extension
-   Streaming availability aggregation
-   Personalized ML ranking
-   Collaborative filtering
-   Chat interface
-   Social/community features
-   Reviews
-   Comments
-   Multi-person taste profiles
-   Native mobile app
-   Large-scale catalog ingestion
-   Real-time TMDB recommendation calls

------------------------------------------------------------------------

# 29. Definition of Done

The MVP technical implementation is complete when:

-   A user can open the web app without an account.
-   They can select Time + Mood + Situation on one page.
-   The API returns exactly one movie.
-   Time filtering works at all boundaries.
-   Mood/Situation scoring follows the recommendation spec.
-   Try Another excludes already shown movies.
-   Surprise Me works without a dedicated mood score.
-   No-strong-match is handled without forcing a bad recommendation.
-   A guest can add/remove movies from a watchlist.
-   Core events are stored.
-   Recommendation logic has automated tests.
-   The movie catalog can be reseeded/updated.
-   The app can be deployed without manual server intervention.

------------------------------------------------------------------------

# 30. Open Configuration / TBD Items

These should remain configurable until validated:

-   Minimum recommendation fit threshold.
-   Surprise Me candidate-pool size.
-   Whether Mood or Situation should eventually receive a different
    weight.
-   Exact feedback taxonomy.
-   Exact guest-session expiration/persistence strategy.
-   Final hosting/database provider if the team has an existing
    preference.

Do not turn these TBD items into permanent architecture prematurely.

------------------------------------------------------------------------

# 31. Engineering Principle

The technical system should make it easy to answer one product question:

> Does this product help people decide what to watch faster?

If a technical feature does not help test that question, it should
probably wait.
