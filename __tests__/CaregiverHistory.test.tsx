import { render, screen, waitFor } from "@testing-library/react-native";

import { beforeEach, describe, expect, jest, test } from "@jest/globals";

/* --------------------------------------------------
   Mock functions
-------------------------------------------------- */

const mockGetLinkedElderlyUserId = jest.fn();
const mockGetCheckIns = jest.fn();

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

    getCheckIns: mockGetCheckIns,
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

    mockGetCheckIns.mockResolvedValue([]);
  });

  test("loads check-ins for linked elderly user", async () => {
    await render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(mockGetLinkedElderlyUserId).toHaveBeenCalledWith("caregiver123");
    });

    expect(mockGetCheckIns).toHaveBeenCalledWith("elderly123");
  });

  test("shows empty state when no check-ins exist", async () => {
    mockGetCheckIns.mockResolvedValue([]);

    await render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText("No check-in records found.")).toBeTruthy();
    });
  });

  test("displays completed check-in from today", async () => {
    const today = new Date();

    mockGetCheckIns.mockResolvedValue([
      {
        id: "checkin1",
        elderlyUserId: "elderly123",
        status: "completed",

        timestamp: {
          toDate: () => today,
        },
      },
    ]);

    await render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Today -/)).toBeTruthy();
    });

    expect(screen.getByText("✓ Completed")).toBeTruthy();
  });

  test("displays yesterday for check-in from previous day", async () => {
    const yesterday = new Date();

    yesterday.setDate(yesterday.getDate() - 1);

    mockGetCheckIns.mockResolvedValue([
      {
        id: "checkin1",
        elderlyUserId: "elderly123",
        status: "completed",

        timestamp: {
          toDate: () => yesterday,
        },
      },
    ]);

    await render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Yesterday -/)).toBeTruthy();
    });
  });

  test("displays missed status", async () => {
    const today = new Date();

    mockGetCheckIns.mockResolvedValue([
      {
        id: "checkin1",
        elderlyUserId: "elderly123",
        status: "missed",

        timestamp: {
          toDate: () => today,
        },
      },
    ]);

    await render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText("Missed")).toBeTruthy();
    });
  });

  test("sorts check-ins newest first", async () => {
    const older = new Date();

    older.setHours(older.getHours() - 2);

    const newer = new Date();

    newer.setHours(newer.getHours() - 1);

    mockGetCheckIns.mockResolvedValue([
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

    await render(<CaregiverHistoryScreen />);

    await waitFor(() => {
      expect(screen.getAllByText(/Today -/).length).toBe(2);
    });

    const statusItems = screen.getAllByText(/Completed|Missed/);

    expect(statusItems[0].props.children).toBe("Missed");

    expect(statusItems[1].props.children).toBe("✓ Completed");
  });

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

    expect(mockGetCheckIns).not.toHaveBeenCalled();
  });
});
