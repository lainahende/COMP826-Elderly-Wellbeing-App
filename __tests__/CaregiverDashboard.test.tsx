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

const mockLogout = jest.fn();

const mockPush = jest.fn();
const mockReplace = jest.fn();

const mockGetLinkedElderlyUserId = jest.fn();
const mockGetUserProfile = jest.fn();
const mockGetReminderSchedule = jest.fn();
const mockGetCheckIns = jest.fn();
const mockSubscribeToCheckIns = jest.fn();

const mockGetNextReminder = jest.fn();

const mockProcessMissedReminders = jest.fn();

const mockRequestPermissions = jest.fn();
const mockSendMissedCheckInNotification = jest.fn();

/* --------------------------------------------------
   Real-time callback
-------------------------------------------------- */

let checkInCallback: ((checkIns: any[]) => void | Promise<void>) | undefined;

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
    getCheckIns: mockGetCheckIns,
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
   Mock MissedCheckInManager
-------------------------------------------------- */

jest.mock("../src/managers/MissedCheckInManager", () => ({
  MissedCheckInManager: jest.fn().mockImplementation(() => ({
    processMissedReminders: mockProcessMissedReminders,
  })),
}));

/* --------------------------------------------------
   Mock NotificationService
-------------------------------------------------- */

jest.mock("../src/services/NotificationService", () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    requestPermissions: mockRequestPermissions,

    sendMissedCheckInNotification: mockSendMissedCheckInNotification,
  })),
}));

/* --------------------------------------------------
   Import dashboard after mocks
-------------------------------------------------- */

const CaregiverDashboard = require("../src/app/caregiver/dashboard").default;

/* --------------------------------------------------
   Helper
-------------------------------------------------- */

const sendCheckInSnapshot = async (records: any[]) => {
  await act(async () => {
    await checkInCallback?.(records);
  });
};

/* --------------------------------------------------
   Tests
-------------------------------------------------- */

describe("CaregiverDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    checkInCallback = undefined;

    mockGetLinkedElderlyUserId.mockResolvedValue("elderly123");

    mockGetUserProfile.mockResolvedValue({
      id: "elderly123",
      name: "Mary Smith",
      email: "mary@example.com",
      role: "elderly",
    });

    mockGetReminderSchedule.mockResolvedValue([]);

    mockGetCheckIns.mockResolvedValue([]);

    mockGetNextReminder.mockReturnValue(null);

    /*
     * Store the real-time callback without triggering it
     * during render. Individual tests trigger snapshots
     * inside act() when required.
     */
    mockSubscribeToCheckIns.mockImplementation((_elderlyUserId, callback) => {
      checkInCallback = callback;

      return jest.fn();
    });

    mockProcessMissedReminders.mockResolvedValue([]);

    mockRequestPermissions.mockResolvedValue(true);

    mockSendMissedCheckInNotification.mockResolvedValue("notification1");

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

  test("displays caregiver dashboard title", async () => {
    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Caregiver Dashboard")).toBeTruthy();
    });
  });

  test("displays linked elderly profile", async () => {
    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Mary Smith")).toBeTruthy();
    });

    expect(screen.getByText("mary@example.com")).toBeTruthy();

    expect(screen.getByText("Elderly Profile")).toBeTruthy();
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

  test("shows no check-in today when no check-ins exist", async () => {
    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(checkInCallback).toBeDefined();
    });

    await sendCheckInSnapshot([]);

    expect(screen.getByText("No check-in today")).toBeTruthy();

    expect(screen.getByText("No previous check-ins")).toBeTruthy();
  });

  test("shows checked in today when completed check-in exists", async () => {
    const today = new Date();

    await render(<CaregiverDashboard />);

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

    await waitFor(() => {
      expect(screen.getByText("✓ Checked in today")).toBeTruthy();
    });

    expect(screen.getByText(/Today at/)).toBeTruthy();
  });

  test("shows no check-in today when only a missed record exists", async () => {
    const today = new Date();

    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(checkInCallback).toBeDefined();
    });

    await sendCheckInSnapshot([
      {
        id: "missed1",
        elderlyUserId: "elderly123",
        status: "missed",

        timestamp: {
          toDate: () => today,
        },
      },
    ]);

    await waitFor(() => {
      expect(screen.getByText("No check-in today")).toBeTruthy();
    });

    expect(screen.getByText("No previous check-ins")).toBeTruthy();
  });

  test("uses latest completed record as the last check-in", async () => {
    const olderCompleted = new Date();

    olderCompleted.setHours(olderCompleted.getHours() - 2);

    const newerMissed = new Date();

    newerMissed.setHours(newerMissed.getHours() - 1);

    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(checkInCallback).toBeDefined();
    });

    await sendCheckInSnapshot([
      {
        id: "completed1",
        elderlyUserId: "elderly123",
        status: "completed",

        timestamp: {
          toDate: () => olderCompleted,
        },
      },

      {
        id: "missed1",
        elderlyUserId: "elderly123",
        status: "missed",

        timestamp: {
          toDate: () => newerMissed,
        },
      },
    ]);

    await waitFor(() => {
      expect(screen.getByText("✓ Checked in today")).toBeTruthy();
    });

    expect(screen.getByText(/Today at/)).toBeTruthy();
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
    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(screen.getByText("No reminder set")).toBeTruthy();
    });
  });

  /* ==================================================
     Missed reminder processing
  ================================================== */

  test("processes missed reminders for linked elderly user", async () => {
    const completedDate = new Date();

    mockGetReminderSchedule.mockResolvedValue([
      {
        id: "reminder1",

        elderlyUserId: "elderly123",

        times: ["08:00", "10:00"],
      },
    ]);

    mockGetCheckIns.mockResolvedValue([
      {
        id: "checkin1",

        elderlyUserId: "elderly123",

        status: "completed",

        timestamp: {
          toDate: () => completedDate,
        },
      },
    ]);

    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(mockProcessMissedReminders).toHaveBeenCalledWith(
        "elderly123",
        ["08:00", "10:00"],
        [completedDate],
      );
    });
  });

  test("only sends completed check-ins to missed reminder processor", async () => {
    const completedDate = new Date();

    const missedDate = new Date();

    mockGetReminderSchedule.mockResolvedValue([
      {
        id: "reminder1",

        elderlyUserId: "elderly123",

        times: ["08:00", "10:00"],
      },
    ]);

    mockGetCheckIns.mockResolvedValue([
      {
        id: "completed1",

        elderlyUserId: "elderly123",

        status: "completed",

        timestamp: {
          toDate: () => completedDate,
        },
      },

      {
        id: "missed1",

        elderlyUserId: "elderly123",

        status: "missed",

        timestamp: {
          toDate: () => missedDate,
        },
      },
    ]);

    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(mockProcessMissedReminders).toHaveBeenCalledWith(
        "elderly123",
        ["08:00", "10:00"],
        [completedDate],
      );
    });
  });

  /* ==================================================
     Missed check-in notifications
  ================================================== */

  test("does not notify for missed records already present on first snapshot", async () => {
    const today = new Date();

    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(checkInCallback).toBeDefined();
    });

    await sendCheckInSnapshot([
      {
        id: "oldMissed1",

        elderlyUserId: "elderly123",

        status: "missed",

        timestamp: {
          toDate: () => today,
        },
      },
    ]);

    expect(mockRequestPermissions).not.toHaveBeenCalled();

    expect(mockSendMissedCheckInNotification).not.toHaveBeenCalled();
  });

  test("notifies when a new missed check-in arrives", async () => {
    const today = new Date();

    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(checkInCallback).toBeDefined();
    });

    /*
     * First snapshot represents records already
     * present when the caregiver dashboard loads.
     */
    await sendCheckInSnapshot([]);

    /*
     * Second snapshot contains a newly-created
     * missed check-in.
     */
    await sendCheckInSnapshot([
      {
        id: "newMissed1",

        elderlyUserId: "elderly123",

        status: "missed",

        timestamp: {
          toDate: () => today,
        },
      },
    ]);

    await waitFor(() => {
      expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    });

    expect(mockSendMissedCheckInNotification).toHaveBeenCalledTimes(1);
  });

  test("does not notify twice for the same missed check-in", async () => {
    const today = new Date();

    const missedRecord = {
      id: "newMissed1",

      elderlyUserId: "elderly123",

      status: "missed",

      timestamp: {
        toDate: () => today,
      },
    };

    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(checkInCallback).toBeDefined();
    });

    await sendCheckInSnapshot([]);

    await sendCheckInSnapshot([missedRecord]);

    await sendCheckInSnapshot([missedRecord]);

    await waitFor(() => {
      expect(mockSendMissedCheckInNotification).toHaveBeenCalledTimes(1);
    });
  });

  test("does not send notification when permission is denied", async () => {
    const today = new Date();

    mockRequestPermissions.mockResolvedValue(false);

    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(checkInCallback).toBeDefined();
    });

    await sendCheckInSnapshot([]);

    await sendCheckInSnapshot([
      {
        id: "newMissed1",

        elderlyUserId: "elderly123",

        status: "missed",

        timestamp: {
          toDate: () => today,
        },
      },
    ]);

    await waitFor(() => {
      expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    });

    expect(mockSendMissedCheckInNotification).not.toHaveBeenCalled();
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

    expect(mockProcessMissedReminders).not.toHaveBeenCalled();
  });

  /* ==================================================
     Navigation
  ================================================== */

  test("history button navigates to caregiver history", async () => {
    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(screen.getByText("View Check-in History")).toBeTruthy();
    });

    await fireEvent.press(screen.getByText("View Check-in History"));

    expect(mockPush).toHaveBeenCalledWith("/caregiver/history");
  });

  test("schedule button navigates to reminder settings", async () => {
    await render(<CaregiverDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Manage Reminder Schedule")).toBeTruthy();
    });

    await fireEvent.press(screen.getByText("Manage Reminder Schedule"));

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

    await fireEvent.press(screen.getByText("Log Out"));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    expect(mockReplace).toHaveBeenCalledWith("/");
  });
});
