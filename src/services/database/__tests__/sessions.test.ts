import {
  resolveAnonymousUser,
  recordEvent,
  startSession,
  getSessionExclusions,
  recordAttempt,
  acceptAttempt,
  completeSession,
} from "../sessions";
import { prisma } from "../prisma";

jest.mock("../prisma", () => ({
  prisma: {
    anonymousUser: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    event: {
      create: jest.fn(),
    },
    recommendationSession: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    recommendationAttempt: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

describe("sessions service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("resolveAnonymousUser", () => {
    it("creates a new anonymous user when no cookie is provided", async () => {
      (prisma.anonymousUser.create as jest.Mock).mockResolvedValue({ id: "anon-new-1" });
      (prisma.anonymousUser.update as jest.Mock).mockResolvedValue({ id: "anon-new-1" });

      const result = await resolveAnonymousUser(undefined);

      expect(prisma.anonymousUser.findUnique).not.toHaveBeenCalled();
      expect(prisma.anonymousUser.create).toHaveBeenCalledWith({ data: {} });
      expect(prisma.anonymousUser.update).toHaveBeenCalledWith({
        where: { id: "anon-new-1" },
        data: { lastSeenAt: expect.any(Date) },
      });
      expect(result.anonymousUserId).toBe("anon-new-1");
      expect(result.setCookie.value).toBe("anon-new-1");
      expect(result.setCookie.name).toBe("mda_anonymous_id");
      expect(result.setCookie.httpOnly).toBe(true);
      expect(result.setCookie.sameSite).toBe("lax");
    });

    it("reuses existing anonymous user when cookie ID is found", async () => {
      (prisma.anonymousUser.findUnique as jest.Mock).mockResolvedValue({ id: "anon-exist-1" });
      (prisma.anonymousUser.update as jest.Mock).mockResolvedValue({ id: "anon-exist-1" });

      const result = await resolveAnonymousUser("anon-exist-1");

      expect(prisma.anonymousUser.findUnique).toHaveBeenCalledWith({ where: { id: "anon-exist-1" } });
      expect(prisma.anonymousUser.create).not.toHaveBeenCalled();
      expect(result.anonymousUserId).toBe("anon-exist-1");
    });

    it("creates a new user when cookie ID is not found in database", async () => {
      (prisma.anonymousUser.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.anonymousUser.create as jest.Mock).mockResolvedValue({ id: "anon-new-2" });
      (prisma.anonymousUser.update as jest.Mock).mockResolvedValue({ id: "anon-new-2" });

      const result = await resolveAnonymousUser("anon-expired");

      expect(prisma.anonymousUser.findUnique).toHaveBeenCalledWith({ where: { id: "anon-expired" } });
      expect(prisma.anonymousUser.create).toHaveBeenCalledWith({ data: {} });
      expect(result.anonymousUserId).toBe("anon-new-2");
    });
  });

  describe("recordEvent", () => {
    it("creates an event record with optional fields populated", async () => {
      (prisma.event.create as jest.Mock).mockResolvedValue({ id: "ev-1" });

      await recordEvent({
        anonymousUserId: "u1",
        eventType: "session_started",
        sessionId: "s1",
        movieId: "m1",
        metadata: { source: "test" },
      });

      expect(prisma.event.create).toHaveBeenCalledWith({
        data: {
          anonymousUserId: "u1",
          eventType: "session_started",
          sessionId: "s1",
          movieId: "m1",
          metadata: { source: "test" },
        },
      });
    });

    it("defaults null for omitted optional event fields", async () => {
      (prisma.event.create as jest.Mock).mockResolvedValue({ id: "ev-2" });

      await recordEvent({
        anonymousUserId: "u1",
        eventType: "recommendation_shown",
      });

      expect(prisma.event.create).toHaveBeenCalledWith({
        data: {
          anonymousUserId: "u1",
          eventType: "recommendation_shown",
          sessionId: null,
          movieId: null,
          metadata: null,
        },
      });
    });
  });

  describe("startSession", () => {
    it("creates a session with mapped time preference and records event", async () => {
      (prisma.recommendationSession.create as jest.Mock).mockResolvedValue({ id: "sess-1" });
      (prisma.event.create as jest.Mock).mockResolvedValue({ id: "ev-3" });

      const session = await startSession(
        { time: "90_to_120", mood: "funny", situation: "friends" },
        "u1"
      );

      expect(prisma.recommendationSession.create).toHaveBeenCalledWith({
        data: {
          anonymousUserId: "u1",
          timePreference: "time_90_120",
          moodPreference: "funny",
          situationPreference: "friends",
        },
      });
      expect(session.id).toBe("sess-1");
      expect(prisma.event.create).toHaveBeenCalledWith({
        data: {
          anonymousUserId: "u1",
          eventType: "session_started",
          sessionId: "sess-1",
          movieId: null,
          metadata: null,
        },
      });
    });

    it("correctly maps under_90 and over_120 time preferences", async () => {
      (prisma.recommendationSession.create as jest.Mock).mockResolvedValue({ id: "sess-2" });

      await startSession({ time: "under_90", mood: "cozy_relax", situation: "alone" }, "u1");
      expect(prisma.recommendationSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ timePreference: "under_90" }),
        })
      );

      await startSession({ time: "over_120", mood: "epic", situation: "partner" }, "u1");
      expect(prisma.recommendationSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ timePreference: "over_120" }),
        })
      );
    });
  });

  describe("getSessionExclusions", () => {
    it("returns movieIds from session attempts", async () => {
      (prisma.recommendationSession.findFirst as jest.Mock).mockResolvedValue({
        id: "sess-1",
        attempts: [{ movieId: "mov-1" }, { movieId: "mov-2" }],
      });

      const exclusions = await getSessionExclusions("sess-1", "u1");
      expect(exclusions).toEqual(["mov-1", "mov-2"]);
    });

    it("returns empty array if session is not found", async () => {
      (prisma.recommendationSession.findFirst as jest.Mock).mockResolvedValue(null);

      const exclusions = await getSessionExclusions("sess-missing", "u1");
      expect(exclusions).toEqual([]);
    });
  });

  describe("recordAttempt", () => {
    it("creates an attempt when session exists", async () => {
      (prisma.recommendationSession.findFirst as jest.Mock).mockResolvedValue({ id: "sess-1" });
      (prisma.recommendationAttempt.create as jest.Mock).mockResolvedValue({ id: "att-1" });

      const res = await recordAttempt({
        sessionId: "sess-1",
        movieId: "mov-1",
        attemptNumber: 1,
        moodScore: 5,
        situationScore: 4,
        distance: 2,
      });

      expect(res).toEqual({ id: "att-1" });
      expect(prisma.recommendationAttempt.create).toHaveBeenCalledWith({
        data: {
          sessionId: "sess-1",
          movieId: "mov-1",
          attemptNumber: 1,
          moodScore: 5,
          situationScore: 4,
          distance: 2,
          accepted: false,
        },
      });
    });

    it("returns null if session does not exist", async () => {
      (prisma.recommendationSession.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await recordAttempt({
        sessionId: "sess-missing",
        movieId: "mov-1",
        attemptNumber: 1,
        moodScore: 5,
        situationScore: 4,
        distance: 2,
      });

      expect(res).toBeNull();
      expect(prisma.recommendationAttempt.create).not.toHaveBeenCalled();
    });
  });

  describe("acceptAttempt", () => {
    it("returns true when an attempt was updated", async () => {
      (prisma.recommendationAttempt.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await acceptAttempt("sess-1", "mov-1");
      expect(result).toBe(true);
      expect(prisma.recommendationAttempt.updateMany).toHaveBeenCalledWith({
        where: { sessionId: "sess-1", movieId: "mov-1" },
        data: { accepted: true },
      });
    });

    it("returns false when no attempt was updated", async () => {
      (prisma.recommendationAttempt.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await acceptAttempt("sess-1", "mov-unknown");
      expect(result).toBe(false);
    });
  });

  describe("completeSession", () => {
    it("updates completedAt when session exists", async () => {
      (prisma.recommendationSession.findFirst as jest.Mock).mockResolvedValue({ id: "sess-1" });
      (prisma.recommendationSession.update as jest.Mock).mockResolvedValue({ id: "sess-1" });

      await completeSession("sess-1");
      expect(prisma.recommendationSession.update).toHaveBeenCalledWith({
        where: { id: "sess-1" },
        data: { completedAt: expect.any(Date) },
      });
    });

    it("does nothing when session is not found", async () => {
      (prisma.recommendationSession.findFirst as jest.Mock).mockResolvedValue(null);

      await completeSession("sess-missing");
      expect(prisma.recommendationSession.update).not.toHaveBeenCalled();
    });
  });
});
