import { updateFlowData, resetFlowData } from "../sessionStore";

describe("sessionStore", () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    resetFlowData();

    // Mock global window and sessionStorage in Node test environment
    const fakeSessionStorage = {
      getItem: jest.fn((key: string) => mockStorage[key] ?? null),
      setItem: jest.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: jest.fn(() => {
        mockStorage = {};
      }),
    };

    Object.defineProperty(global, "window", {
      value: { sessionStorage: fakeSessionStorage },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(global, "sessionStorage", {
      value: fakeSessionStorage,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    resetFlowData();
  });

  it("updates state and writes to sessionStorage", () => {
    updateFlowData({ state: "preferences", time: "under_90" });

    expect(sessionStorage.setItem).toHaveBeenCalled();
    const stored = JSON.parse(mockStorage["mda_flow_state_v1"]);
    expect(stored.state).toBe("preferences");
    expect(stored.time).toBe("under_90");
  });

  it("supports functional state updates", () => {
    updateFlowData({ shownMovieIds: ["m1"] });
    updateFlowData((prev) => ({
      shownMovieIds: [...prev.shownMovieIds, "m2"],
    }));

    const stored = JSON.parse(mockStorage["mda_flow_state_v1"]);
    expect(stored.shownMovieIds).toEqual(["m1", "m2"]);
  });

  it("resets flow data and removes from sessionStorage", () => {
    updateFlowData({ state: "result", time: "over_120", mood: "epic" });
    expect(mockStorage["mda_flow_state_v1"]).toBeDefined();

    resetFlowData();
    expect(sessionStorage.removeItem).toHaveBeenCalledWith("mda_flow_state_v1");
  });

  it("handles storage write exceptions without throwing", () => {
    (sessionStorage.setItem as jest.Mock).mockImplementationOnce(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => {
      updateFlowData({ mood: "funny" });
    }).not.toThrow();
  });
});
