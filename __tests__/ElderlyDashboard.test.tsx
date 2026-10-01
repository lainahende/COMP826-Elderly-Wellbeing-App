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
const mockGetNextReminder = jest.fn();

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
   Mock Reminder Manager
-------------------------------------------------- */
jest.mock("../src/services/DatabaseService", () => ({
  DatabaseService: jest.fn().mockImplementation(() => ({
    getReminderSchedule: mockGetReminderSchedule,
  })),
}));

jest.mock("../src/managers/ReminderManager", () => ({
  ReminderManager: jest.fn().mockImplementation(() => ({
    getNextReminder: mockGetNextReminder,
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
  });

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
  });

  test("shows no reminder message when none are configured", async () => {
    mockGetReminderSchedule.mockResolvedValue([]);

    mockGetNextReminder.mockReturnValue(null);

    await render(<ElderlyDashboard />);

    await waitFor(() => {
      expect(screen.getByText("No reminder set")).toBeTruthy();
    });
  });

  test("renders elderly dashboard content", async () => {
    await render(<ElderlyDashboard />);

    expect(screen.getByText("Good Morning")).toBeTruthy();

    expect(screen.getByText("Current Status")).toBeTruthy();

    expect(screen.getByText("✓ Checked in today")).toBeTruthy();

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

  test("pressing I'M OK creates a check-in for the logged-in elderly user", async () => {
    mockCompleteCheckIn.mockResolvedValue("checkin123");

    await render(<ElderlyDashboard />);

    await fireEvent.press(screen.getByText("I'M OK ✓"));

    await waitFor(() => {
      expect(mockCompleteCheckIn).toHaveBeenCalledTimes(1);
    });

    expect(mockCompleteCheckIn).toHaveBeenCalledWith("elderly123");
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
});
