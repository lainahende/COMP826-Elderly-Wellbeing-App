import { act, render, screen, waitFor } from "@testing-library/react-native";

import { beforeEach, describe, expect, jest, test } from "@jest/globals";

/* --------------------------------------------------
   Mock functions
-------------------------------------------------- */

const mockGetLinkedElderlyUserId = jest.fn();
const mockSubscribeToCheckIns = jest.fn();

/* --------------------------------------------------
   Mock Firebase
-------------------------------------------------- */

jest.mock("../src/config/firebase", () => ({
  auth: {
    currentUser: {
      uid: "caregiver123",
    },
  },

  db: {},
}));

/* --------------------------------------------------
   Mock DatabaseService
-------------------------------------------------- */

jest.mock("../src/services/DatabaseService", () => ({
  DatabaseService: jest.fn().mockImplementation(() => ({
    getLinkedElderlyUserId: mockGetLinkedElderlyUserId,

    subscribeToCheckIns: mockSubscribeToCheckIns,
  })),
}));

/* --------------------------------------------------
   Load screen after mocks
-------------------------------------------------- */

const CaregiverHistoryScreen = require("../src/app/caregiver/history").default;

/* --------------------------------------------------
   Tests
-------------------------------------------------- */

describe("CaregiverHistoryScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetLinkedElderlyUserId.mockResolvedValue("elderly123");

    mockSubscribeToCheckIns.mockImplementation((_elderlyUserId, callback) => {
      callback([]);

      return jest.fn();
    });
  });

  /* ==================================================
     Loading linked elderly user
  ================================================== */

  test("subscribes to check-ins for linked elderly user", async () => {
    await render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(mockGetLinkedElderlyUserId).toHaveBeenCalledWith("caregiver123");
    });

    expect(mockSubscribeToCheckIns).toHaveBeenCalledWith(
      "elderly123",
      expect.any(Function),
    );
  });

  /* ==================================================
     Empty state
  ================================================== */

  test("shows empty state when no check-ins exist", async () => {
    mockSubscribeToCheckIns.mockImplementation((_elderlyUserId, callback) => {
      callback([]);

      return jest.fn();
    });

    await render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText("No check-in records found.")).toBeTruthy();
    });
  });

  /* ==================================================
     Completed check-ins
  ================================================== */

  test("displays completed check-in from today", async () => {
    const today = new Date();

    mockSubscribeToCheckIns.mockImplementation((_elderlyUserId, callback) => {
      callback([
        {
          id: "checkin1",
          elderlyUserId: "elderly123",
          status: "completed",

          timestamp: {
            toDate: () => today,
          },
        },
      ]);

      return jest.fn();
    });

    await render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Today -/)).toBeTruthy();
    });

    expect(screen.getByText("✓ Completed")).toBeTruthy();
  });

  test("displays yesterday for check-in from previous day", async () => {
    const yesterday = new Date();

    yesterday.setDate(yesterday.getDate() - 1);

    mockSubscribeToCheckIns.mockImplementation((_elderlyUserId, callback) => {
      callback([
        {
          id: "checkin1",
          elderlyUserId: "elderly123",
          status: "completed",

          timestamp: {
            toDate: () => yesterday,
          },
        },
      ]);

      return jest.fn();
    });

    await render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Yesterday -/)).toBeTruthy();
    });
  });

  /* ==================================================
     Missed check-ins
  ================================================== */

  test("displays missed status", async () => {
    const today = new Date();

    mockSubscribeToCheckIns.mockImplementation((_elderlyUserId, callback) => {
      callback([
        {
          id: "checkin1",
          elderlyUserId: "elderly123",
          status: "missed",

          timestamp: {
            toDate: () => today,
          },
        },
      ]);

      return jest.fn();
    });

    await render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText("Missed")).toBeTruthy();
    });
  });

  /* ==================================================
     Sorting
  ================================================== */

  test("sorts check-ins newest first", async () => {
    const older = new Date();

    older.setHours(older.getHours() - 2);

    const newer = new Date();

    newer.setHours(newer.getHours() - 1);

    mockSubscribeToCheckIns.mockImplementation((_elderlyUserId, callback) => {
      callback([
        {
          id: "older",
          elderlyUserId: "elderly123",
          status: "completed",

          timestamp: {
            toDate: () => older,
          },
        },

        {
          id: "newer",
          elderlyUserId: "elderly123",
          status: "missed",

          timestamp: {
            toDate: () => newer,
          },
        },
      ]);

      return jest.fn();
    });

    await render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(screen.getAllByText(/Today -/).length).toBe(2);
    });

    const statusItems = screen.getAllByText(/Completed|Missed/);

    expect(statusItems[0].props.children).toBe("Missed");

    expect(statusItems[1].props.children).toBe("✓ Completed");
  });

  /* ==================================================
     Real-time updates
  ================================================== */

  test("updates history when a new check-in arrives", async () => {
    let checkInCallback: ((checkIns: any[]) => void) | undefined;

    mockSubscribeToCheckIns.mockImplementation((_elderlyUserId, callback) => {
      checkInCallback = callback;

      callback([]);

      return jest.fn();
    });

    await render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText("No check-in records found.")).toBeTruthy();
    });

    const now = new Date();

    await act(async () => {
      checkInCallback?.([
        {
          id: "checkin-new",
          elderlyUserId: "elderly123",
          status: "completed",

          timestamp: {
            toDate: () => now,
          },
        },
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText("✓ Completed")).toBeTruthy();
    });

    expect(screen.getByText(/Today -/)).toBeTruthy();
  });

  /* ==================================================
     No linked elderly user
  ================================================== */

  test("shows message when caregiver has no linked elderly user", async () => {
    mockGetLinkedElderlyUserId.mockResolvedValue(null);

    await render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "No elderly user is linked to this caregiver account.",
        ),
      ).toBeTruthy();
    });

    expect(mockSubscribeToCheckIns).not.toHaveBeenCalled();
  });
});
