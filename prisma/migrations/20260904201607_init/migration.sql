-- CreateEnum
CREATE TYPE "TimePreference" AS ENUM ('under_90', 'time_90_120', 'over_120');

-- CreateEnum
CREATE TYPE "MoodPreference" AS ENUM ('cozy_relax', 'funny', 'thrill_tense', 'emotional', 'thoughtful_mind_bending', 'epic', 'surprise_me');

-- CreateEnum
CREATE TYPE "ScoredMood" AS ENUM ('cozy_relax', 'funny', 'thrill_tense', 'emotional', 'thoughtful_mind_bending', 'epic');

-- CreateEnum
CREATE TYPE "SituationPreference" AS ENUM ('alone', 'partner', 'friends', 'family', 'kids');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('session_started', 'preferences_submitted', 'recommendation_shown', 'movie_accepted', 'try_another', 'watchlist_added');

-- CreateTable
CREATE TABLE "Movie" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tmdbId" INTEGER,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "overview" TEXT,
    "posterPath" TEXT,
    "backdropPath" TEXT,
    "releaseDate" TIMESTAMP(3),
    "releaseYear" INTEGER,
    "runtimeMinutes" INTEGER NOT NULL,
    "genres" TEXT[],
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovieMoodScore" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "mood" "ScoredMood" NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "MovieMoodScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovieSituationScore" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "situation" "SituationPreference" NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "MovieSituationScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousUser" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnonymousUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationSession" (
    "id" TEXT NOT NULL,
    "anonymousUserId" TEXT NOT NULL,
    "timePreference" "TimePreference" NOT NULL,
    "moodPreference" "MoodPreference" NOT NULL,
    "situationPreference" "SituationPreference" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RecommendationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationAttempt" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "moodScore" INTEGER,
    "situationScore" INTEGER NOT NULL,
    "distance" INTEGER NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "anonymousUserId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "anonymousUserId" TEXT NOT NULL,
    "sessionId" TEXT,
    "eventType" "EventType" NOT NULL,
    "movieId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Movie_slug_key" ON "Movie"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_tmdbId_key" ON "Movie"("tmdbId");

-- CreateIndex
CREATE INDEX "Movie_isActive_isValidated_idx" ON "Movie"("isActive", "isValidated");

-- CreateIndex
CREATE UNIQUE INDEX "MovieMoodScore_movieId_mood_key" ON "MovieMoodScore"("movieId", "mood");

-- CreateIndex
CREATE UNIQUE INDEX "MovieSituationScore_movieId_situation_key" ON "MovieSituationScore"("movieId", "situation");

-- CreateIndex
CREATE INDEX "RecommendationSession_anonymousUserId_idx" ON "RecommendationSession"("anonymousUserId");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationAttempt_sessionId_attemptNumber_key" ON "RecommendationAttempt"("sessionId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_anonymousUserId_movieId_key" ON "WatchlistItem"("anonymousUserId", "movieId");

-- CreateIndex
CREATE INDEX "Event_eventType_idx" ON "Event"("eventType");

-- CreateIndex
CREATE INDEX "Event_anonymousUserId_idx" ON "Event"("anonymousUserId");

-- AddForeignKey
ALTER TABLE "MovieMoodScore" ADD CONSTRAINT "MovieMoodScore_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieSituationScore" ADD CONSTRAINT "MovieSituationScore_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationSession" ADD CONSTRAINT "RecommendationSession_anonymousUserId_fkey" FOREIGN KEY ("anonymousUserId") REFERENCES "AnonymousUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationAttempt" ADD CONSTRAINT "RecommendationAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RecommendationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationAttempt" ADD CONSTRAINT "RecommendationAttempt_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_anonymousUserId_fkey" FOREIGN KEY ("anonymousUserId") REFERENCES "AnonymousUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_anonymousUserId_fkey" FOREIGN KEY ("anonymousUserId") REFERENCES "AnonymousUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
