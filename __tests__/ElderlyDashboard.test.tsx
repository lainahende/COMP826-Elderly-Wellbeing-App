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
const mockCompleteCheckIn = jest.fn();

const mockPush = jest.fn();
const mockReplace = jest.fn();

const mockGetReminderSchedule = jest.fn();
const mockGetCheckIns = jest.fn();
const mockGetNextReminder = jest.fn();

const mockRequestPermissions = jest.fn();
const mockCancelAllReminders = jest.fn();
const mockScheduleReminderTimes = jest.fn();

/* --------------------------------------------------
   Mock Firebase
-------------------------------------------------- */

jest.mock("../src/config/firebase", () => ({
  auth: {
    currentUser: {
      uid: "elderly123",
    },
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
   Mock CheckInManager
-------------------------------------------------- */

jest.mock("../src/managers/CheckInManager", () => ({
  CheckInManager: jest.fn().mockImplementation(() => ({
    completeCheckIn: mockCompleteCheckIn,
  })),
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
   Mock DatabaseService
-------------------------------------------------- */

jest.mock("../src/services/DatabaseService", () => ({
  DatabaseService: jest.fn().mockImplementation(() => ({
    getReminderSchedule: mockGetReminderSchedule,
    getCheckIns: mockGetCheckIns,
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
   Mock NotificationService
-------------------------------------------------- */

jest.mock("../src/services/NotificationService", () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    requestPermissions: mockRequestPermissions,
    cancelAllReminders: mockCancelAllReminders,
    scheduleReminderTimes: mockScheduleReminderTimes,
  })),
}));

/* --------------------------------------------------
   Load dashboard after mocks
-------------------------------------------------- */

const ElderlyDashboard = require("../src/app/elderly/dashboard").default;

/* --------------------------------------------------
   Tests
-------------------------------------------------- */

describe("ElderlyDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetReminderSchedule.mockResolvedValue([]);
    mockGetNextReminder.mockReturnValue(null);

    mockGetCheckIns.mockResolvedValue([]);

    mockRequestPermissions.mockResolvedValue(true);
    mockCancelAllReminders.mockResolvedValue(undefined);
    mockScheduleReminderTimes.mockResolvedValue([]);
  });

  /* ==================================================
     Basic dashboard tests
  ================================================== */

  test("renders elderly dashboard content", async () => {
    await render(<ElderlyDashboard />);

    expect(screen.getByText("Good Morning")).toBeTruthy();

    expect(screen.getByText("Current Status")).toBeTruthy();

    expect(screen.getByText("Next Check-in")).toBeTruthy();

    expect(screen.getByText("How are you?")).toBeTruthy();

    expect(screen.getByText("I'M OK ✓")).toBeTruthy();

    expect(screen.getByText("View Check-in History")).toBeTruthy();

    expect(screen.getByText("Log Out")).toBeTruthy();
  });

  test("history button navigates to elderly history", async () => {
    await render(<ElderlyDashboard />);

    await fireEvent.press(screen.getByText("View Check-in History"));

    expect(mockPush).toHaveBeenCalledWith("/elderly/history");
  });

  test("logout signs user out and returns to login", async () => {
    mockLogout.mockResolvedValue(undefined);

    await render(<ElderlyDashboard />);

    await fireEvent.press(screen.getByText("Log Out"));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  /* ==================================================
     Check-in status tests
  ================================================== */

  test("shows no check-in today when no check-ins exist", async () => {
    mockGetCheckIns.mockResolvedValue([]);

    await render(<ElderlyDashboard />);

    await waitFor(() => {
      expect(screen.getByText("No check-in today")).toBeTruthy();
    });

    expect(screen.getByText("No previous check-ins")).toBeTruthy();
  });

  test("shows checked in today when a check-in exists today", async () => {
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

    await render(<ElderlyDashboard />);

    await waitFor(() => {
      expect(screen.getByText("✓ Checked in today")).toBeTruthy();
    });

    expect(screen.getByText(/Last check-in: Today at/)).toBeTruthy();
  });

  test("shows previous check-in when latest check-in was not today", async () => {
    const previousDate = new Date("2026-10-12T08:00:00");

    mockGetCheckIns.mockResolvedValue([
      {
        id: "checkin1",
        elderlyUserId: "elderly123",
        status: "completed",
        timestamp: {
          toDate: () => previousDate,
        },
      },
    ]);

    await render(<ElderlyDashboard />);

    await waitFor(() => {
      expect(screen.getByText("No check-in today")).toBeTruthy();
    });

    expect(screen.getByText(/Last check-in:/)).toBeTruthy();
  });

  test("uses the newest check-in as the last check-in", async () => {
    const older = new Date("2026-10-12T08:00:00");

    const newer = new Date("2026-10-13T09:30:00");

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
        status: "completed",
        timestamp: {
          toDate: () => newer,
        },
      },
    ]);

    await render(<ElderlyDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Last check-in: Today at/)).toBeTruthy();
    });
  });

  /* ==================================================
     Check-in action tests
  ================================================== */

  test("pressing I'M OK creates a check-in for the logged-in elderly user", async () => {
    mockCompleteCheckIn.mockResolvedValue("checkin123");

    await render(<ElderlyDashboard />);

    await fireEvent.press(screen.getByText("I'M OK ✓"));

    await waitFor(() => {
      expect(mockCompleteCheckIn).toHaveBeenCalledTimes(1);
    });

    expect(mockCompleteCheckIn).toHaveBeenCalledWith("elderly123");
  });

  test("updates current status after successful check-in", async () => {
    mockGetCheckIns.mockResolvedValue([]);

    mockCompleteCheckIn.mockResolvedValue("checkin123");

    await render(<ElderlyDashboard />);

    await waitFor(() => {
      expect(screen.getByText("No check-in today")).toBeTruthy();
    });

    await fireEvent.press(screen.getByText("I'M OK ✓"));

    await waitFor(() => {
      expect(screen.getByText("✓ Checked in today")).toBeTruthy();
    });

    expect(screen.getByText(/Last check-in: Today at/)).toBeTruthy();
  });

  test("prevents duplicate check-in submissions", async () => {
    let resolveCheckIn!: (value: string) => void;

    const pendingCheckIn = new Promise<string>((resolve) => {
      resolveCheckIn = resolve;
    });

    mockCompleteCheckIn.mockReturnValue(pendingCheckIn);

    await render(<ElderlyDashboard />);

    fireEvent.press(screen.getByText("I'M OK ✓"));

    await waitFor(() => {
      expect(screen.getByText("Saving...")).toBeTruthy();
    });

    expect(mockCompleteCheckIn).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText("Saving..."));

    expect(mockCompleteCheckIn).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveCheckIn("checkin123");
      await pendingCheckIn;
    });

    await waitFor(() => {
      expect(screen.getByText("I'M OK ✓")).toBeTruthy();
    });
  });

  test("shows saving state while check-in is being submitted", async () => {
    let resolveCheckIn!: (value: string) => void;

    const pendingCheckIn = new Promise<string>((resolve) => {
      resolveCheckIn = resolve;
    });

    mockCompleteCheckIn.mockReturnValue(pendingCheckIn);

    await render(<ElderlyDashboard />);

    fireEvent.press(screen.getByText("I'M OK ✓"));

    await waitFor(() => {
      expect(screen.getByText("Saving...")).toBeTruthy();
    });

    await act(async () => {
      resolveCheckIn("checkin123");
      await pendingCheckIn;
    });

    await waitFor(() => {
      expect(screen.getByText("I'M OK ✓")).toBeTruthy();
    });
  });

  test("returns check-in button to normal after successful submission", async () => {
    mockCompleteCheckIn.mockResolvedValue("checkin123");

    await render(<ElderlyDashboard />);

    await fireEvent.press(screen.getByText("I'M OK ✓"));

    await waitFor(() => {
      expect(screen.getByText("I'M OK ✓")).toBeTruthy();
    });
  });

  /* ==================================================
     Reminder display tests
  ================================================== */

  test("displays the next reminder time from reminder schedule", async () => {
    mockGetReminderSchedule.mockResolvedValue([
      {
        id: "reminder1",
        elderlyUserId: "elderly123",
        times: ["08:00", "10:00", "18:00"],
      },
    ]);

    mockGetNextReminder.mockReturnValue("10:00");

    await render(<ElderlyDashboard />);

    await waitFor(() => {
      expect(screen.getByText("10:00 AM")).toBeTruthy();
    });

    expect(mockGetReminderSchedule).toHaveBeenCalledWith("elderly123");

    expect(mockGetNextReminder).toHaveBeenCalledWith([
      "08:00",
      "10:00",
      "18:00",
    ]);
  });

  test("shows no reminder message when none are configured", async () => {
    mockGetReminderSchedule.mockResolvedValue([]);

    mockGetNextReminder.mockReturnValue(null);

    await render(<ElderlyDashboard />);

    await waitFor(() => {
      expect(screen.getByText("No reminder set")).toBeTruthy();
    });

    expect(mockScheduleReminderTimes).not.toHaveBeenCalled();
  });

  /* ==================================================
     Notification tests
  ================================================== */

  test("requests notification permission when reminders are configured", async () => {
    mockGetReminderSchedule.mockResolvedValue([
      {
        id: "reminder1",
        elderlyUserId: "elderly123",
        times: ["08:00", "18:00"],
      },
    ]);

    mockGetNextReminder.mockReturnValue("18:00");

    await render(<ElderlyDashboard />);

    await waitFor(() => {
      expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    });
  });

  test("schedules notifications for configured reminder times", async () => {
    mockGetReminderSchedule.mockResolvedValue([
      {
        id: "reminder1",
        elderlyUserId: "elderly123",
        times: ["08:00", "10:00", "18:00"],
      },
    ]);

    mockGetNextReminder.mockReturnValue("10:00");

    mockRequestPermissions.mockResolvedValue(true);

    await render(<ElderlyDashboard />);

    await waitFor(() => {
      expect(mockScheduleReminderTimes).toHaveBeenCalledWith([
        "08:00",
        "10:00",
        "18:00",
      ]);
    });
  });

  test("cancels existing reminders before scheduling new reminders", async () => {
    mockGetReminderSchedule.mockResolvedValue([
      {
        id: "reminder1",
        elderlyUserId: "elderly123",
        times: ["09:00", "17:00"],
      },
    ]);

    mockGetNextReminder.mockReturnValue("09:00");

    mockRequestPermissions.mockResolvedValue(true);

    await render(<ElderlyDashboard />);

    await waitFor(() => {
      expect(mockCancelAllReminders).toHaveBeenCalledTimes(1);

      expect(mockScheduleReminderTimes).toHaveBeenCalledWith([
        "09:00",
        "17:00",
      ]);
    });

    const cancelOrder = mockCancelAllReminders.mock.invocationCallOrder[0];

    const scheduleOrder = mockScheduleReminderTimes.mock.invocationCallOrder[0];

    expect(cancelOrder).toBeLessThan(scheduleOrder);
  });

  test("does not schedule reminders when notification permission is denied", async () => {
    mockGetReminderSchedule.mockResolvedValue([
      {
        id: "reminder1",
        elderlyUserId: "elderly123",
        times: ["08:00", "18:00"],
      },
    ]);

    mockGetNextReminder.mockReturnValue("18:00");

    mockRequestPermissions.mockResolvedValue(false);

    await render(<ElderlyDashboard />);

    await waitFor(() => {
      expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    });

    expect(mockCancelAllReminders).not.toHaveBeenCalled();

    expect(mockScheduleReminderTimes).not.toHaveBeenCalled();
  });

  test("does not request notification permission when no reminders exist", async () => {
    mockGetReminderSchedule.mockResolvedValue([]);

    await render(<ElderlyDashboard />);

    await waitFor(() => {
      expect(screen.getByText("No reminder set")).toBeTruthy();
    });

    expect(mockRequestPermissions).not.toHaveBeenCalled();

    expect(mockCancelAllReminders).not.toHaveBeenCalled();

    expect(mockScheduleReminderTimes).not.toHaveBeenCalled();
  });
});
