# Movie Decision Product
## Master Project Document — v0.1

**Status:** Early MVP / Validation  
**Last updated:** September 2026  
**Document purpose:** Single source of truth for the current product concept, decisions, assumptions, research conclusions, MVP scope, and unresolved questions.

---

# 1. Product Snapshot

## 1.1 One-line description

A movie decision-making product that helps people quickly decide **what to watch right now**, based on their current situation, mood, and preferences.

## 1.2 Core problem

The problem is not primarily a lack of movies or lack of recommendation engines.

The problem is:

> **I want to watch something, but I don't know what fits me right now.**

Users can face:

- Too many possible choices
- Decision fatigue
- Generic recommendations
- Recommendations that ignore the user's current context
- Repeated searching across movie platforms
- Difficulty translating a vague feeling or situation into a concrete movie choice
- Spending more time choosing than actually watching

## 1.3 Product thesis

Existing movie products often optimize for:

- discovery
- catalog browsing
- ratings
- generic personalization
- watch history
- social discovery

This product explores a different framing:

> **Movie selection as a decision-making problem rather than a content-discovery problem.**

The product should help users move from:

**"I want to watch something."**

to:

**"This is what I should watch right now."**

with as little cognitive effort as possible.

---

# 2. Product Positioning

## 2.1 The product IS

- A movie decision-making tool
- Context-aware recommendation
- Fast and low-friction
- Personalized
- Situation-aware
- Mood-aware
- Focused on reducing choice overload
- A system that narrows a large choice space into a small set of relevant options

## 2.2 The product IS NOT

- A Netflix clone
- A movie streaming service
- A generic movie database
- A social network
- A movie-rating community
- A chat-first entertainment assistant
- A platform whose primary value is endless browsing

This distinction is important because adding too many conventional movie features can destroy the core proposition.

---

# 3. Target User

## Primary user

People who:

- Watch movies or series relatively often
- Sometimes struggle to decide what to watch
- Have preferences but don't always know how to express them
- Care about whether something fits their current mood or situation
- Prefer making a decision quickly rather than browsing hundreds of titles

## Core Job To Be Done

> When I want to watch something but don't know what fits my current moment, help me find a small number of good options and feel confident choosing one.

## Emotional job

The user should feel:

> "I don't have to think about this anymore. This one fits."

That feeling of **decision relief** may be more important than showing the maximum number of recommendations.

---

# 4. Core Product Experience

The current conceptual flow is:

```text
User wants to watch something
            ↓
Selects current context
            ↓
Provides mood / preferences / constraints
            ↓
Recommendation system evaluates movies
            ↓
A small set of relevant movies is presented
            ↓
User chooses one
            ↓
User can save it / add it to Watchlist
```

The experience should optimize for:

1. Low cognitive load
2. Few interaction steps
3. High relevance
4. Confidence in the recommendation
5. Fast decision-making

---

# 5. Input Model

The current recommendation input model contains three major dimensions.

## 5.1 Situation

Represents the user's current context.

Examples may include:

- Watching alone
- Watching with partner
- Watching with friends
- Watching with family
- Short amount of time
- Wanting something for the evening
- Looking for a background/light watch
- Wanting something immersive

The exact taxonomy is still subject to validation.

**Status: HYPOTHESIS**

---

## 5.2 Mood

Represents how the user currently feels or what emotional experience they want.

Examples:

- Happy
- Relaxed
- Sad
- Excited
- Tense
- Curious
- Nostalgic
- Thoughtful
- Want something uplifting
- Want something emotionally intense

The product should distinguish between:

> "How I feel"

and:

> "How I want to feel."

This distinction may become important for recommendation quality.

**Status: HYPOTHESIS / OPEN**

---

## 5.3 Preferences / Filters

Users should be able to express concrete constraints and preferences.

Potential dimensions:

- Genre
- Runtime
- Release period
- Language
- Rating
- Content characteristics
- Familiarity / rewatch
- Other practical constraints

### Important UX decision

The current direction is:

> **Keep the relevant filters on one page rather than splitting them into multiple sequential steps.**

The goal is to give users control without creating a long questionnaire.

**Status: CONFIRMED**

---

# 6. Recommendation Engine

## 6.1 Purpose

The recommendation engine is responsible for transforming:

```text
User context
+ preferences
+ movie attributes
```

into:

```text
ranked movie candidates
```

The engine should optimize for **fit**, not simply popularity.

---

## 6.2 Current conceptual model

A movie has attributes.

The user provides:

- Situation
- Mood
- Preferences / constraints

The system compares the two and produces a relevance score.

Conceptually:

```text
User Input
    ↓
Candidate Filtering
    ↓
Feature Matching
    ↓
Scoring
    ↓
Ranking
    ↓
Top Recommendations
```

---

## 6.3 Situation + Mood scoring

An earlier idea was to combine situation and mood into a single score.

However:

> **The exact scoring model is NOT considered finalized.**

We have not yet established that a simple additive model such as:

```text
Final Score = Situation Score + Mood Score + Preference Score
```

is necessarily the best approach.

Potential problems with a naïve additive model:

- Different dimensions may not have equal importance
- Some constraints should be hard filters rather than scores
- A strong mood match may not compensate for a critical mismatch
- Some attributes interact with one another
- Recommendation quality cannot be assumed from mathematical simplicity

Therefore the scoring architecture remains an active product/technical question.

**Status: OPEN**

---

# 7. AI Role

AI should support the recommendation system rather than automatically become the entire system.

Potential AI responsibilities:

- Understanding natural-language intent
- Interpreting ambiguous mood/context
- Translating vague user input into structured attributes
- Explaining why a movie was recommended
- Improving personalization over time
- Potentially assisting with metadata classification

AI should NOT be trusted blindly to:

- Invent movie information
- Produce arbitrary recommendations without grounding
- Replace deterministic constraints
- Become a generic chatbot with no product-specific value

The strongest architecture may be a combination of:

```text
Structured data
+
Deterministic constraints / scoring
+
AI interpretation
```

rather than "ask an LLM for three movies."

**Status: HYPOTHESIS**

---

# 8. Recommendation Output

The product should avoid recreating the same problem it is trying to solve.

Showing 50 recommendations can simply move the decision fatigue downstream.

The preferred direction is:

> **Small, high-confidence recommendation set.**

Potential output:

- Primary recommendation
- A few alternatives
- Reason for recommendation
- Key matching attributes
- Movie details
- Save / Watchlist action

The exact number of recommendations remains open.

**Status: OPEN**

---

# 9. Watchlist

Watchlist is currently considered part of the core product experience.

Possible role:

```text
Discover
   ↓
Save
   ↓
Build personal collection
   ↓
Return later
   ↓
Potentially improve future personalization
```

Watchlist should not become a generic database feature without a clear relationship to the decision problem.

Potential future role:

- Saved movies
- "What should I watch from my Watchlist?"
- Personalized recommendations from saved content
- Retention mechanism

**Status: CORE FEATURE / SOME BEHAVIOR OPEN**

---

# 10. MVP

## 10.1 MVP goal

The MVP is NOT intended to be a beautiful, complete movie platform.

The immediate goal is to answer:

> **Can this product help a user make a movie decision better and faster than their current behavior?**

## 10.2 Current MVP scope

### Include

- Basic onboarding / preferences
- Situation selection
- Mood selection
- Filters
- Recommendation engine
- Recommendation results
- Movie detail
- Watchlist

### Exclude for now

- Social features
- Community
- Complex conversational AI
- Streaming
- Advanced recommendation personalization
- Extensive profile systems
- Large-scale content platform features
- Complex gamification

The MVP should remain deliberately narrow.

---

# 11. Main User Flows

## Flow A — Find something to watch

```text
Home
 ↓
Start decision
 ↓
Situation + Mood + Filters
 ↓
Get recommendations
 ↓
View movie
 ↓
Choose / Save
```

This is the primary flow.

---

## Flow B — Explore recommendation

```text
Recommendation
 ↓
Movie details
 ↓
Why this fits
 ↓
Watch / Save
```

---

## Flow C — Watchlist

```text
Watchlist
 ↓
Browse saved movies
 ↓
Select movie
 ↓
View details
```

Potential future extension:

```text
Watchlist
 ↓
"What should I watch from here?"
 ↓
Context-aware ranking
```

---

# 12. UX / UI Direction

## Current visual direction

- Dark mode
- Soft Neo-Brutalism
- Strong typography
- Card-based interactions
- High visual contrast
- Playful but functional
- Clear hierarchy
- Minimal unnecessary decoration

The visual style should support the product's personality without making the decision process slower.

### Design principle

> **Personality can be expressive; decision-making should remain simple.**

A visually impressive interface that makes the user work harder is a failure for this product.

---

# 13. Data Strategy

The recommendation engine depends heavily on movie metadata.

Potential movie attributes include:

- Genre
- Runtime
- Release year
- Language
- Country
- Cast
- Director
- Rating
- Keywords
- Themes
- Mood-related attributes
- Situational suitability
- Content characteristics

The key challenge is that some recommendation dimensions—especially **mood and situation**—are not always directly available in conventional movie datasets.

Therefore some attributes may require:

- Derived metadata
- Manual curation
- Classification
- LLM-assisted tagging
- User feedback

This is an important technical/product dependency.

---

# 14. Iranian Movies

Iranian movie support is a potentially valuable differentiator, but it introduces additional complexity.

Questions that need to be solved:

- What reliable metadata sources are available?
- How complete is the dataset?
- Which attributes are available?
- How can missing metadata be filled?
- How should Persian-language metadata be normalized?
- Are there legal restrictions around metadata/content?
- Does the product only recommend movies, or also link users to where they can watch them?
- How much manual curation is required?

Important distinction:

> **Movie metadata rights and movie/content distribution rights are different problems.**

The product may be able to recommend a movie without owning or distributing the movie itself.

**Status: OPEN / RESEARCH AREA**

---

# 15. Competitive Positioning

The broad competitive landscape includes products focused on:

- Streaming discovery
- Movie databases
- Ratings
- Watchlists
- Personalized recommendations
- Social discovery
- AI movie recommendation

The product's intended differentiation is not:

> "We also recommend movies."

It is:

> **"We help you decide what to watch based on what fits your current moment."**

This distinction must remain central.

If the product eventually becomes another movie catalog with filters, the differentiation weakens considerably.

---

# 16. Validation Hypotheses

The product currently rests on several hypotheses.

## H1 — The problem exists

People experience meaningful friction when deciding what to watch.

**Status:** Supported enough to justify MVP testing, but still requires product-specific validation.

---

## H2 — Context improves recommendations

Situation and mood can make recommendations more useful than generic preference-based recommendations.

**Status:** HYPOTHESIS

---

## H3 — Users prefer fewer better options

Users may prefer a small set of highly relevant recommendations over large recommendation lists.

**Status:** HYPOTHESIS

---

## H4 — Decision confidence matters

A useful recommendation is not only one that is objectively relevant; it should make the user feel confident enough to choose it.

**Status:** HYPOTHESIS

---

## H5 — Watchlist can contribute to retention

Saving recommendations may create a useful recurring behavior.

**Status:** HYPOTHESIS

---

## H6 — AI can improve interpretation

AI may be particularly useful for translating vague human intent into structured recommendation inputs.

**Status:** HYPOTHESIS

---

# 17. Business Model

Potential monetization directions have been discussed, but no model should currently be treated as final.

Possible directions include:

- Freemium
- Premium personalization
- Advanced recommendation features
- Affiliate / referral revenue
- Streaming or rental referrals
- Partnerships

The business model should come after establishing repeated user value.

A key principle:

> Do not monetize the existence of a recommendation engine before proving that users repeatedly value the decision it helps them make.

**Status: OPEN**

---

# 18. Technical MVP Direction

The immediate technical goal is not production-scale architecture.

The first milestone is:

> **A live, testable prototype that demonstrates the core decision loop.**

The architecture should therefore prioritize:

- Fast iteration
- Replaceable recommendation logic
- Clean separation between UI and scoring
- Easy modification of movie data
- Easy testing of recommendation hypotheses

The Score Engine should ideally be isolated so that different scoring approaches can be tested without rebuilding the rest of the product.

---

# 19. Current Product Principles

### Principle 1 — Solve the decision, not the browsing problem

The user came because they want to decide.

---

### Principle 2 — Fewer choices can be more valuable

More recommendations are not automatically better.

---

### Principle 3 — Context matters

The same person may want completely different movies at different moments.

---

### Principle 4 — AI is a component, not the product

The product's value should survive even if the underlying AI model changes.

---

### Principle 5 — Separate facts from hypotheses

Anything not validated should remain explicitly labeled.

---

### Principle 6 — MVP should prove the core behavior

Do not build peripheral features before validating the decision loop.

---

# 20. Decision Log

| ID | Decision | Status | Reason |
|---|---|---|---|
| D-01 | Product focuses on movie decision-making rather than generic discovery | CONFIRMED | This is the central product differentiation |
| D-02 | Current context is an important input to recommendations | CONFIRMED AS PRODUCT DIRECTION | Core hypothesis behind the concept |
| D-03 | Situation is one of the primary inputs | CONFIRMED | Helps model contextual relevance |
| D-04 | Mood is one of the primary inputs | CONFIRMED | Intended to capture emotional context |
| D-05 | Situation, mood and filters should be available on one page | CONFIRMED | Avoid unnecessary multi-step interaction |
| D-06 | Watchlist belongs in the MVP | CONFIRMED | Supports save/return behavior and potential personalization |
| D-07 | MVP should prioritize the core decision loop | CONFIRMED | Avoid feature creep |
| D-08 | Social/community features are outside MVP | CONFIRMED | Not necessary to validate core value |
| D-09 | Streaming functionality is outside MVP | CONFIRMED | Adds major complexity without proving the core hypothesis |
| D-10 | UI direction is dark + soft Neo-Brutalism | CURRENT DIRECTION | Fits intended personality and interaction style |
| D-11 | Recommendation output should be relatively small | CURRENT DIRECTION | Avoid recreating choice overload |
| D-12 | Score Engine is not finalized | OPEN | Several possible scoring architectures remain |
| D-13 | AI should complement structured recommendation logic | HYPOTHESIS | More controllable than fully generative recommendation |
| D-14 | Iranian movies are worth exploring | OPEN / RESEARCH | Potential differentiation but data complexity exists |
| D-15 | Business model is not finalized | OPEN | Product value should be validated first |

---

# 21. Open Questions

These are intentionally unresolved.

## Product

1. What is the minimum number of inputs required for a useful recommendation?
2. Does asking about mood actually improve recommendation quality?
3. Should users select "current mood" or "desired mood"?
4. How many recommendations should appear?
5. Should there always be one dominant recommendation?
6. How much explanation increases confidence without creating friction?

## Recommendation

7. Which attributes should be hard filters?
8. Which attributes should contribute to a score?
9. Should situation and mood have different weights?
10. Should scores be additive?
11. Should AI participate directly in ranking?
12. How should conflicting preferences be handled?
13. How do we measure recommendation quality?

## Data

14. Which movie dataset should be used for MVP?
15. How should mood/situation metadata be generated?
16. How much manual curation is needed?
17. What is the best approach for Iranian movie metadata?

## Business

18. Who is willing to pay?
19. What recurring value justifies payment?
20. Is affiliate revenue realistic?
21. Does the product work better as a standalone product or as a layer on top of streaming services?

## Retention

22. Why would someone come back tomorrow?
23. Can Watchlist create recurring behavior?
24. Can recommendations become meaningfully better over time?

---

# 22. What Needs Validation Next

The next stage should NOT be:

> Build everything.

It should be:

### Step 1 — Build a thin functional MVP

Enough to complete:

```text
Input
→ Recommendation
→ Decision
→ Save
```

### Step 2 — Test recommendation quality

Use a deliberately selected movie dataset.

### Step 3 — Test with real users

Measure:

- Time to decision
- Recommendation acceptance
- Skip rate
- Save rate
- User confidence
- Whether users agree that recommendations fit their situation
- Whether users would use the product again

### Step 4 — Iterate Score Engine

Only after seeing actual behavior should the scoring architecture become more sophisticated.

### Step 5 — Validate retention

Determine whether this solves a recurring problem rather than being a one-time novelty.

---

# 23. Current MVP Success Criteria

The MVP should eventually answer these questions:

### Problem

> Do people actually experience this decision problem strongly enough to seek a solution?

### Relevance

> Do situation + mood + preferences produce noticeably better recommendations?

### Speed

> Can the product reduce the time needed to choose?

### Confidence

> Does the user feel that the recommendation "fits"?

### Behavior

> Does the user actually choose/save a recommendation?

### Retention

> Is this useful enough to return to?

If these answers are negative, adding more features will not rescue the product.

---

# 24. Current State Summary

### CONFIRMED

- Core problem is framed as movie decision-making
- Context is central to the product
- Situation + mood + filters are core inputs
- Filters should be presented together on one page
- Watchlist is part of the MVP
- MVP should stay narrow
- Social/streaming/advanced features are not MVP priorities
- Product should provide a small set of relevant choices
- Current visual direction is dark + soft Neo-Brutalism

### HYPOTHESIS

- Situation improves recommendation quality
- Mood improves recommendation quality
- Users prefer fewer recommendations
- Decision confidence is a meaningful success metric
- Watchlist improves retention
- AI can improve intent interpretation
- AI + structured scoring is better than pure LLM recommendations

### OPEN

- Exact Score Engine architecture
- Weighting of situation/mood/preferences
- Hard filters vs soft scoring
- Number of recommendations
- Exact mood model
- Data strategy
- Iranian movie data pipeline
- Long-term personalization
- Business model
- Retention mechanism
- Monetization

---

# 25. North Star

The product should ultimately make this interaction feel almost effortless:

> **"Tell me what kind of moment you're in. I'll help you decide what to watch."**

The product succeeds if the user spends **less time deciding and more time watching something they are actually happy they chose.**

---

# 26. Document Maintenance Rules

This document should be updated whenever a meaningful product decision is made.

Use these labels:

- **CONFIRMED** — agreed decision supported by sufficient evidence
- **HYPOTHESIS** — current belief that still needs validation
- **OPEN** — unresolved question
- **REJECTED** — considered and explicitly discarded
- **EXPERIMENT** — temporary implementation used to test a hypothesis

Do not silently turn a hypothesis into a confirmed decision.

Every meaningful change should add an entry to the Decision Log with:

```text
Decision
Why
Evidence
Status
Date
```

The Master Document represents the **current state**.

The Decision Log represents **how we got here**.

Research documents represent **the evidence behind the decisions**.