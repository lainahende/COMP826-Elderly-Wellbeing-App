import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { beforeEach, describe, expect, jest, test } from "@jest/globals";

/* --------------------------------------------------
   Mock functions
-------------------------------------------------- */

const mockLogout = jest.fn();

const mockPush = jest.fn();
const mockReplace = jest.fn();

const mockGetLinkedElderlyUserId = jest.fn();
const mockGetUserProfile = jest.fn();
const mockGetReminderSchedule = jest.fn();

const mockGetNextReminder = jest.fn();
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
   Mock Expo Router
-------------------------------------------------- */

jest.mock("expo-router", () => ({
  router: {
    push: mockPush,
    replace: mockReplace,
  },
}));

/* --------------------------------------------------
   Mock AuthPresenter
-------------------------------------------------- */

jest.mock("../src/presenters/AuthPresenter", () => ({
  AuthPresenter: jest.fn().mockImplementation(() => ({
    logout: mockLogout,
  })),
}));

/* --------------------------------------------------
   Mock DatabaseService
-------------------------------------------------- */

jest.mock("../src/services/DatabaseService", () => ({
  DatabaseService: jest.fn().mockImplementation(() => ({
    getLinkedElderlyUserId: mockGetLinkedElderlyUserId,

    getUserProfile: mockGetUserProfile,

    getReminderSchedule: mockGetReminderSchedule,

    subscribeToCheckIns: mockSubscribeToCheckIns,
  })),
}));

/* --------------------------------------------------
   Mock ReminderManager
-------------------------------------------------- */

jest.mock("../src/managers/ReminderManager", () => ({
  ReminderManager: jest.fn().mockImplementation(() => ({
    getNextReminder: mockGetNextReminder,
  })),
}));

/* --------------------------------------------------
   Import dashboard AFTER mocks
-------------------------------------------------- */

const CaregiverDashboard = require("../src/app/caregiver/dashboard").default;

/* --------------------------------------------------
   Tests
-------------------------------------------------- */

describe("CaregiverDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetLinkedElderlyUserId.mockResolvedValue("elderly123");

    mockGetUserProfile.mockResolvedValue({
      id: "elderly123",
      name: "Mary Smith",
      email: "mary@example.com",
      role: "elderly",
    });

    mockGetReminderSchedule.mockResolvedValue([]);

    mockGetNextReminder.mockReturnValue(null);

    mockSubscribeToCheckIns.mockImplementation((_elderlyUserId, callback) => {
      callback([]);

      return jest.fn();
    });

    mockLogout.mockResolvedValue(undefined);
  });

  /* ==================================================
     Dashboard loading
  ================================================== */

  test("loads linked elderly user using caregiver ID", async () => {
    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(mockGetLinkedElderlyUserId).toHaveBeenCalledWith("caregiver123");
    });

    expect(mockGetUserProfile).toHaveBeenCalledWith("elderly123");
  });

  test("displays linked elderly profile", async () => {
    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Mary Smith")).toBeTruthy();
    });

    expect(screen.getByText("mary@example.com")).toBeTruthy();
  });

  /* ==================================================
     Real-time check-in status
  ================================================== */

  test("subscribes to linked elderly user's check-ins", async () => {
    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(mockSubscribeToCheckIns).toHaveBeenCalledWith(
        "elderly123",
        expect.any(Function),
      );
    });
  });

  test("shows no check-in today when elderly user has no check-ins", async () => {
    mockSubscribeToCheckIns.mockImplementation((_elderlyUserId, callback) => {
      callback([]);

      return jest.fn();
    });

    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(screen.getByText("No check-in today")).toBeTruthy();
    });

    expect(screen.getByText("No previous check-ins")).toBeTruthy();
  });

  test("shows checked in today when elderly user completed a check-in today", async () => {
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

    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(screen.getByText("✓ Checked in today")).toBeTruthy();
    });

    expect(screen.getByText(/Today at/)).toBeTruthy();
  });

  test("shows no check-in today when latest check-in is from an earlier day", async () => {
    const previousDate = new Date();

    previousDate.setDate(previousDate.getDate() - 1);

    mockSubscribeToCheckIns.mockImplementation((_elderlyUserId, callback) => {
      callback([
        {
          id: "checkin1",
          elderlyUserId: "elderly123",
          status: "completed",

          timestamp: {
            toDate: () => previousDate,
          },
        },
      ]);

      return jest.fn();
    });

    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(screen.getByText("No check-in today")).toBeTruthy();
    });

    expect(screen.queryByText("No previous check-ins")).toBeNull();
  });

  test("updates when a new real-time check-in arrives", async () => {
    let checkInCallback: ((checkIns: any[]) => void) | undefined;

    mockSubscribeToCheckIns.mockImplementation((_elderlyUserId, callback) => {
      checkInCallback = callback;

      callback([]);

      return jest.fn();
    });

    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(screen.getByText("No check-in today")).toBeTruthy();
    });

    const now = new Date();

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

    await waitFor(() => {
      expect(screen.getByText("✓ Checked in today")).toBeTruthy();
    });
  });

  /* ==================================================
     Reminder display
  ================================================== */

  test("displays next scheduled reminder", async () => {
    mockGetReminderSchedule.mockResolvedValue([
      {
        id: "reminder1",
        elderlyUserId: "elderly123",

        times: ["08:00", "14:30", "18:00"],
      },
    ]);

    mockGetNextReminder.mockReturnValue("14:30");

    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(screen.getByText("2:30 PM")).toBeTruthy();
    });

    expect(mockGetReminderSchedule).toHaveBeenCalledWith("elderly123");

    expect(mockGetNextReminder).toHaveBeenCalledWith([
      "08:00",
      "14:30",
      "18:00",
    ]);
  });

  test("shows no reminder set when elderly user has no reminders", async () => {
    mockGetReminderSchedule.mockResolvedValue([]);

    mockGetNextReminder.mockReturnValue(null);

    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(screen.getByText("No reminder set")).toBeTruthy();
    });
  });

  /* ==================================================
     No linked elderly account
  ================================================== */

  test("shows message when caregiver has no linked elderly user", async () => {
    mockGetLinkedElderlyUserId.mockResolvedValue(null);

    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "No elderly user is linked to this caregiver account.",
        ),
      ).toBeTruthy();
    });

    expect(mockGetUserProfile).not.toHaveBeenCalled();

    expect(mockSubscribeToCheckIns).not.toHaveBeenCalled();
  });

  /* ==================================================
     Navigation
  ================================================== */

  test("history button navigates to caregiver history", async () => {
    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(screen.getByText("View Check-in History")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("View Check-in History"));

    expect(mockPush).toHaveBeenCalledWith("/caregiver/history");
  });

  test("schedule button navigates to reminder settings", async () => {
    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Manage Reminder Schedule")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Manage Reminder Schedule"));

    expect(mockPush).toHaveBeenCalledWith("/caregiver/schedule");
  });

  /* ==================================================
     Logout
  ================================================== */

  test("logout signs caregiver out and returns to login", async () => {
    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Log Out")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Log Out"));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    expect(mockReplace).toHaveBeenCalledWith("/");
  });
});
