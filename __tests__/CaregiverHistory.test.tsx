import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { beforeEach, describe, expect, jest, test } from "@jest/globals";

/* --------------------------------------------------
   Mock functions
-------------------------------------------------- */

const mockGetLinkedElderlyUserId = jest.fn();
const mockSubscribeToCheckIns = jest.fn();

const mockBack = jest.fn();

/* --------------------------------------------------
   Real-time callback
-------------------------------------------------- */

let checkInCallback: ((checkIns: any[]) => void) | undefined;

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
   Mock Expo Router
-------------------------------------------------- */

jest.mock("expo-router", () => ({
  router: {
    back: mockBack,
  },
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
   Helper
-------------------------------------------------- */

const sendCheckInSnapshot = async (records: any[]) => {
  await act(async () => {
    checkInCallback?.(records);
  });
};

/* --------------------------------------------------
   Tests
-------------------------------------------------- */

describe("CaregiverHistoryScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    checkInCallback = undefined;

    mockGetLinkedElderlyUserId.mockResolvedValue("elderly123");

    /*
     * Store callback without immediately firing it.
     * Tests trigger snapshots explicitly inside act().
     */
    mockSubscribeToCheckIns.mockImplementation((_elderlyUserId, callback) => {
      checkInCallback = callback;

      return jest.fn();
    });
  });

  /* ==================================================
     Loading linked elderly user
  ================================================== */

  test("subscribes to check-ins for linked elderly user", async () => {
    render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(mockGetLinkedElderlyUserId).toHaveBeenCalledWith("caregiver123");
    });

    expect(mockSubscribeToCheckIns).toHaveBeenCalledWith(
      "elderly123",
      expect.any(Function),
    );
  });

  test("renders history screen title", async () => {
    render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(checkInCallback).toBeDefined();
    });

    await sendCheckInSnapshot([]);

    expect(screen.getByText("Check-in History")).toBeTruthy();
  });

  test("back button returns to caregiver dashboard", async () => {
    render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(checkInCallback).toBeDefined();
    });

    await sendCheckInSnapshot([]);

    fireEvent.press(screen.getByText("‹ Back"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  /* ==================================================
     Empty state
  ================================================== */

  test("shows empty state when no check-ins exist", async () => {
    render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(checkInCallback).toBeDefined();
    });

    await sendCheckInSnapshot([]);

    expect(screen.getByText("No check-in records")).toBeTruthy();

    expect(
      screen.getByText("Completed and missed check-ins will appear here."),
    ).toBeTruthy();
  });

  /* ==================================================
     Completed check-ins
  ================================================== */

  test("displays completed check-in from today", async () => {
    const today = new Date();

    render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(checkInCallback).toBeDefined();
    });

    await sendCheckInSnapshot([
      {
        id: "checkin1",
        elderlyUserId: "elderly123",
        status: "completed",

        timestamp: {
          toDate: () => today,
        },
      },
    ]);

    expect(screen.getByText("Today")).toBeTruthy();

    expect(screen.getByText("✓ Completed")).toBeTruthy();
  });

  test("displays yesterday for check-in from previous day", async () => {
    const yesterday = new Date();

    yesterday.setDate(yesterday.getDate() - 1);

    render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(checkInCallback).toBeDefined();
    });

    await sendCheckInSnapshot([
      {
        id: "checkin1",
        elderlyUserId: "elderly123",
        status: "completed",

        timestamp: {
          toDate: () => yesterday,
        },
      },
    ]);

    expect(screen.getByText("Yesterday")).toBeTruthy();

    expect(screen.getByText("✓ Completed")).toBeTruthy();
  });

  test("displays older completed check-in date", async () => {
    const olderDate = new Date("2026-10-01T10:00:00");

    render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(checkInCallback).toBeDefined();
    });

    await sendCheckInSnapshot([
      {
        id: "checkin1",
        elderlyUserId: "elderly123",
        status: "completed",

        timestamp: {
          toDate: () => olderDate,
        },
      },
    ]);

    expect(screen.getByText("1 October 2026")).toBeTruthy();

    expect(screen.getByText("✓ Completed")).toBeTruthy();
  });

  /* ==================================================
     Missed check-ins
  ================================================== */

  test("displays missed status", async () => {
    const today = new Date();

    render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(checkInCallback).toBeDefined();
    });

    await sendCheckInSnapshot([
      {
        id: "checkin1",
        elderlyUserId: "elderly123",
        status: "missed",

        timestamp: {
          toDate: () => today,
        },
      },
    ]);

    expect(screen.getByText("Missed")).toBeTruthy();

    expect(
      screen.getByText(
        "No check-in was recorded during the scheduled check-in period.",
      ),
    ).toBeTruthy();
  });

  test("uses scheduled date and time for missed check-in when available", async () => {
    render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(checkInCallback).toBeDefined();
    });

    await sendCheckInSnapshot([
      {
        id: "missed1",
        elderlyUserId: "elderly123",
        status: "missed",

        scheduledDate: "2026-10-01",

        scheduledTime: "08:30",

        timestamp: {
          toDate: () => new Date("2026-10-01T12:00:00"),
        },
      },
    ]);

    expect(screen.getByText("1 October 2026")).toBeTruthy();

    expect(screen.getByText("8:30 AM")).toBeTruthy();

    expect(screen.getByText("Missed")).toBeTruthy();
  });

  /* ==================================================
     Sorting
  ================================================== */

  test("sorts check-ins newest first", async () => {
    const older = new Date("2026-10-01T08:00:00");

    const newer = new Date("2026-10-02T10:00:00");

    render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(checkInCallback).toBeDefined();
    });

    await sendCheckInSnapshot([
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

    const dates = screen.getAllByTestId("check-in-date");

    expect(dates[0].props.children).toContain("2 October 2026");

    expect(dates[1].props.children).toContain("1 October 2026");
  });

  /* ==================================================
     Real-time updates
  ================================================== */

  test("updates history when a new check-in arrives", async () => {
    render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(checkInCallback).toBeDefined();
    });

    await sendCheckInSnapshot([]);

    expect(screen.getByText("No check-in records")).toBeTruthy();

    const now = new Date();

    await sendCheckInSnapshot([
      {
        id: "checkin-new",
        elderlyUserId: "elderly123",
        status: "completed",

        timestamp: {
          toDate: () => now,
        },
      },
    ]);

    await waitFor(() => {
      expect(screen.getByText("✓ Completed")).toBeTruthy();
    });

    expect(screen.getByText("Today")).toBeTruthy();

    expect(screen.queryByText("No check-in records")).toBeNull();
  });

  /* ==================================================
     No linked elderly user
  ================================================== */

  test("shows message when caregiver has no linked elderly user", async () => {
    mockGetLinkedElderlyUserId.mockResolvedValue(null);

    render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "No elderly user is linked to this caregiver account.",
        ),
      ).toBeTruthy();
    });

    expect(screen.getByText("No Linked User")).toBeTruthy();

    expect(mockSubscribeToCheckIns).not.toHaveBeenCalled();
  });

  test("back button works when caregiver has no linked elderly user", async () => {
    mockGetLinkedElderlyUserId.mockResolvedValue(null);

    render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText("No Linked User")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("‹ Back"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
