# UX_SPEC.md

## 1. Purpose

This document defines the user experience and screen-level behavior for
the Movie Decision MVP.

The product is a decision-making tool, not a general movie
discovery/catalog product.

### Core value proposition

**Time + Mood + Situation → 1 Movie**

The primary UX goal is to reduce the time and cognitive effort required
to decide what to watch.

The product should intentionally avoid presenting a large set of
recommendations after the user submits their preferences.

------------------------------------------------------------------------

## 2. MVP UX Principles

1.  **One recommendation at a time**
    -   The primary recommendation surface shows one movie.
    -   Do not show a grid of 3--5 "best matches" in the core flow.
    -   The user should feel that the product made the decision for
        them.
2.  **Fast path to a decision**
    -   The main flow should require only three preference selections:
        -   Time
        -   Mood
        -   Situation
    -   No account is required for the core MVP flow.
3.  **No genre-first UX**
    -   Genre is movie metadata, not a primary user filter.
    -   The user is choosing an experience rather than searching a
        conventional catalog.
4.  **No prompt writing**
    -   Users should not need to describe their mood in natural
        language.
    -   Use clear predefined choices.
5.  **Low cognitive load**
    -   Keep the number of visible choices limited.
    -   Explain unfamiliar concepts briefly rather than with long
        onboarding copy.
6.  **Decision completion over browsing**
    -   The key outcome is that the user accepts a movie, not that they
        browse many movies.
7.  **Try Another must not recreate search**
    -   "Try Another" should provide another suitable movie without
        exposing a large result list.
8.  **Dark, soft-neubrutalist visual direction**
    -   Dark-mode first.
    -   Strong typography.
    -   Chunky cards and controls.
    -   Visible borders and subtle shadows.
    -   Slightly playful, tactile UI.
    -   Avoid excessive decoration that competes with the decision.

------------------------------------------------------------------------

## 3. Primary User Flow

``` text
Landing
   ↓
Choose preferences
   ├── Time
   ├── Mood
   └── Situation
   ↓
Get recommendation
   ↓
One movie recommendation
   ├── Add to Watchlist
   ├── This works / Accept
   ├── Try Another
   └── Change Preferences
```

Optional secondary paths:

``` text
Landing → Watchlist
Recommendation → Watchlist
Recommendation → Movie details
Recommendation → Try Another
Recommendation → Change Preferences
```

------------------------------------------------------------------------

# 4. Screen Specifications

## 4.1 Landing / Home

### Goal

Immediately communicate the product's promise and get the user into the
decision flow.

### Primary content

-   Product name/logo
-   Short value proposition
-   Primary CTA: `Help Me Pick`
-   Optional secondary CTA: `My Watchlist`

### Suggested copy

Headline:

> Don't know what to watch?

Supporting copy:

> Tell us how much time you have, your mood, and who's watching. We'll
> pick one.

CTA:

> Help Me Pick

### Behavior

-   `Help Me Pick` → Preference screen.
-   `My Watchlist` → Watchlist screen.
-   No login wall.

### UX rule

Do not turn the landing page into a movie catalog.

------------------------------------------------------------------------

## 4.2 Preference Selection

### Goal

Collect all three recommendation inputs in a single page.

**Important: Time, Mood, and Situation are NOT separate steps. They
appear together on one page.**

### Layout

A vertically stacked or responsive three-section form:

1.  Time
2.  Mood
3.  Situation

A single primary CTA is placed at the bottom.

### Section: Time

Question:

> How much time do you have?

Options:

-   `Under 90 min`
-   `90–120 min`
-   `2+ hours`

Selection behavior:

-   Single select.
-   Selected state must be visually obvious.

### Section: Mood

Question:

> What's the vibe?

Options:

-   `Cozy / Relax`
-   `Funny`
-   `Thrill / Tense`
-   `Emotional`
-   `Thoughtful / Mind-bending`
-   `Epic`
-   `Surprise Me`

Selection behavior:

-   Single select.
-   `Surprise Me` is a mode, not a normal mood.
-   Selecting `Surprise Me` can visually communicate that the user is
    giving the system freedom over mood.

### Section: Situation

Question:

> Who are you watching with?

Options:

-   `Alone`
-   `Partner`
-   `Friends`
-   `Family`
-   `Kids`

Selection behavior:

-   Single select.

### CTA

Primary:

> Pick a Movie

Disabled until all required inputs are selected.

### Optional microcopy

> We'll pick the best fit --- not give you another list to scroll
> through.

This reinforces the product's differentiation.

------------------------------------------------------------------------

## 4.3 Recommendation Result

### Goal

Deliver the decision.

### Primary structure

-   Small context summary
-   One movie card
-   Primary acceptance action
-   Secondary actions

### Context summary

Example:

> For a cozy night with your partner · 90--120 min

This confirms that the system understood the request.

### Movie card

Minimum information:

-   Poster
-   Title
-   Release year
-   Runtime
-   Short one-line reason
-   Optional genres as supporting metadata

Example:

> **Why this fits:** Warm, easygoing, and engaging without asking too
> much from you tonight.

Do not expose internal mood/situation scores.

### Primary action

> This works

This represents a successful decision.

### Secondary actions

-   `Try Another`
-   `Change Preferences`
-   `Add to Watchlist`

### UX hierarchy

`This works` should be the visually strongest action.

`Try Another` should be available but should not look like an invitation
to browse endlessly.

`Change Preferences` should be less prominent.

### Success behavior

When the user selects `This works`:

-   Record `movie_accepted`.
-   Show a lightweight confirmation.
-   Offer a natural next action such as:
    -   `Add to Watchlist` if not already saved.
    -   `Start Over`.

Do not force an account.

------------------------------------------------------------------------

## 4.4 Try Another

### Goal

Allow the user to reject the current recommendation without opening a
catalog.

### Behavior

-   Keep the current Time, Mood, and Situation.
-   Exclude the current movie from the candidate set for the current
    session.
-   Return exactly one new recommendation.

### Important rule

`Try Another` is not "show me more results."

It is:

> "Make the decision again using the same constraints."

### Optional feedback

After one or more retries, lightweight feedback can be collected:

> Not quite right?

Possible reasons:

-   Too serious
-   Too long
-   Not my vibe
-   Seen it already
-   Other

This feedback can be stored as an event, but it should not be required
for MVP completion.

------------------------------------------------------------------------

## 4.5 Change Preferences

### Goal

Allow the user to adjust the decision criteria without restarting from
scratch.

### Behavior

-   Return to the preference screen.
-   Preserve existing selections.
-   User changes one or more fields.
-   `Pick a Movie` runs a new recommendation.

------------------------------------------------------------------------

## 4.6 Watchlist

### Goal

Provide the structured record that supports the product beyond a one-off
recommendation.

### MVP behavior

A user can:

-   Add a recommended movie to watchlist.
-   View saved movies.
-   Remove a movie.
-   Start a decision flow from the watchlist context if desired.

### Guest behavior

The MVP should support a lightweight guest identity.

The user should not be forced to create an account just to maintain a
short-term watchlist.

Implementation can use a server-side anonymous user/session identifier.

### Empty state

Example:

> Your watchlist is empty.

Supporting copy:

> Save movies you actually want to watch. We'll help you decide which
> one fits tonight.

CTA:

> Pick a Movie

### Important scope boundary

Do NOT implement watchlist import from IMDb, Letterboxd, TV Time, etc.
in the core MVP.

------------------------------------------------------------------------

## 4.7 Movie Details

### Goal

Give enough context to make the recommendation actionable without
turning the product into a catalog.

### Information

-   Poster
-   Title
-   Year
-   Runtime
-   Synopsis
-   Genres
-   Optional director/cast
-   Watchlist state

### External availability

Streaming availability is explicitly outside the core MVP unless a
simple, reliable link can be added without becoming a dependency.

------------------------------------------------------------------------

# 5. Surprise Me UX

`Surprise Me` is a recommendation mode.

It should not behave like a normal seventh mood score.

### Expected behavior

-   Time remains a hard constraint.
-   Situation remains a constraint/fit factor.
-   Mood is intentionally relaxed or randomized.
-   The system can select across moods while still avoiding obviously
    poor situation/time fits.

The UI should communicate:

> Let the system choose the vibe.

rather than:

> Surprise Me is another mood.

------------------------------------------------------------------------

# 6. No-Match / Weak-Match UX

The system should not force an obviously poor recommendation merely
because the candidate set is non-empty.

If no candidate passes the minimum recommendation threshold:

### State

> Nothing is a great fit right now.

Supporting copy:

> We can loosen one of your preferences and try again.

Possible actions:

-   `Relax Time`
-   `Change Mood`
-   `Change Situation`
-   `Surprise Me`

The exact threshold belongs to `RECOMMENDATION_SPEC.md`.

------------------------------------------------------------------------

# 7. Empty and Error States

## Movie data unavailable

> We couldn't pick a movie right now. Try again in a moment.

CTA:

> Try Again

## Watchlist unavailable

The recommendation flow should continue to work even if watchlist
persistence fails.

Do not block the core decision flow because of a non-critical record
feature.

## Network/API failure

Use a concise error state and preserve the user's selected preferences.

------------------------------------------------------------------------

# 8. Responsive Behavior

### Desktop

-   Centered decision container.
-   Preference sections can use cards/chips.
-   Recommendation card can be visually dominant.

### Mobile

-   Single-column layout.
-   Large touch targets.
-   Sticky or easily reachable primary CTA if needed.
-   Avoid horizontal scrolling for essential choices.

### Accessibility

-   Keyboard navigable.
-   Visible focus states.
-   Sufficient contrast.
-   Controls have clear selected/unselected states.
-   Do not rely on color alone.
-   Poster imagery must not be required to understand the
    recommendation.

------------------------------------------------------------------------

# 9. UX States to Implement

Minimum states:

1.  Landing
2.  Preferences --- empty
3.  Preferences --- partially selected
4.  Preferences --- complete
5.  Recommendation --- first result
6.  Recommendation --- after Try Another
7.  Recommendation --- accepted
8.  Recommendation --- weak/no match
9.  Watchlist --- empty
10. Watchlist --- populated
11. Movie details
12. Error/loading states

------------------------------------------------------------------------

# 10. MVP Exclusions

Do not build these into the core UX:

-   Account registration/login as a requirement
-   Social/community features
-   Reviews/comments
-   Chatbot interface
-   Genre browsing
-   Large movie catalog browsing
-   IMDb/Letterboxd/TV Time import
-   Streaming aggregation
-   Browser extension
-   Complex personalization
-   Multi-user profiles
-   Recommendation explanations that expose internal scoring
-   Multiple recommendation cards

------------------------------------------------------------------------

# 11. UX Success Criteria

The UX is successful if a first-time user can:

1.  Understand the product in seconds.
2.  Select Time + Mood + Situation on one page.
3.  Receive exactly one recommendation.
4.  Understand why the movie fits.
5.  Accept it or request another without starting a search session.
6.  Optionally save it to the watchlist.

The key behavioral metric is:

**Decision Completion Rate = accepted recommendations / recommendation
sessions**

A session ending with endless retries or abandonment is a product
failure signal, even if the recommendation algorithm technically
returned valid movies.


# 12. Visual Design Direction

## Visual Design Direction

The MVP should use a **Neo Soft Cinematic Brutalism** visual direction.

The visual language should combine:

* Soft, rounded UI elements with subtle brutalist characteristics
* Strong typography and clear visual hierarchy
* Generous spacing
* Bold but controlled borders
* Soft shadows / offset shadows where appropriate
* Slightly playful, expressive visual details
* High contrast between UI elements and the background
* A dark-mode-first experience
* Minimal visual clutter

The design should feel:

* Modern
* Playful
* Confident
* Slightly unconventional
* Easy to scan
* Fast and lightweight

### Important UI Principle

The visual style must support the core product goal: **reducing decision friction**.

The UI should not become visually complex just to demonstrate the Neo Soft Brutalism style.

Avoid:

* Excessive decorative elements
* Overly complex animations
* Visual noise
* Too many competing cards
* UI patterns that make the user spend more time deciding

### Design System Requirement

The visual styling should be implemented through reusable design tokens and reusable UI components wherever practical.

Colors, typography, spacing, border radius, shadows, borders, and other visual properties should be centralized rather than hard-coded throughout individual screens.

This is intentional so that the visual design can be changed later without rewriting the product logic or application flow.

The current Neo Soft Brutalism direction is a **visual design hypothesis**, not a permanent product requirement.

The implementation should therefore keep the UI layer sufficiently decoupled from the underlying recommendation logic, data model, and product rules.