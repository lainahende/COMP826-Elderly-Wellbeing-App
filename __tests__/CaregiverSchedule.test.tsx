import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import { Alert } from "react-native";

/* --------------------------------------------------
   Mock functions
-------------------------------------------------- */

const mockGetLinkedElderlyUserId = jest.fn();
const mockGetReminderSchedule = jest.fn();
const mockSaveReminderSchedule = jest.fn();

const mockBack = jest.fn();

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
    getReminderSchedule: mockGetReminderSchedule,
    saveReminderSchedule: mockSaveReminderSchedule,
  })),
}));

/* --------------------------------------------------
   Load screen after mocks
-------------------------------------------------- */

const CaregiverSchedule = require("../src/app/caregiver/schedule").default;

/* --------------------------------------------------
   Tests
-------------------------------------------------- */

describe("CaregiverSchedule", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetLinkedElderlyUserId.mockResolvedValue("elderly123");

    mockGetReminderSchedule.mockResolvedValue([]);

    mockSaveReminderSchedule.mockResolvedValue("reminder1");

    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  test("renders reminder schedule screen", async () => {
    await render(<CaregiverSchedule />);

    await waitFor(() => {
      expect(screen.getByText("Reminder Schedule")).toBeTruthy();
    });

    expect(screen.getByText("Add a reminder")).toBeTruthy();

    expect(screen.getByText("Reminder Times")).toBeTruthy();
  });

  test("back button returns to caregiver dashboard", async () => {
    await render(<CaregiverSchedule />);

    await waitFor(() => {
      expect(screen.getByText("‹ Back")).toBeTruthy();
    });

    await fireEvent.press(screen.getByText("‹ Back"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  test("loads existing reminder schedule", async () => {
    mockGetReminderSchedule.mockResolvedValue([
      {
        id: "reminder1",
        elderlyUserId: "elderly123",
        times: ["08:00", "12:00", "18:00"],
      },
    ]);

    await render(<CaregiverSchedule />);

    await waitFor(() => {
      expect(screen.getByText("08:00")).toBeTruthy();
    });

    expect(screen.getByText("12:00")).toBeTruthy();

    expect(screen.getByText("18:00")).toBeTruthy();

    expect(screen.getByText("8:00 AM")).toBeTruthy();

    expect(screen.getByText("12:00 PM")).toBeTruthy();

    expect(screen.getByText("6:00 PM")).toBeTruthy();

    expect(mockGetLinkedElderlyUserId).toHaveBeenCalledWith("caregiver123");

    expect(mockGetReminderSchedule).toHaveBeenCalledWith("elderly123");
  });

  test("shows empty state when there are no reminders", async () => {
    mockGetReminderSchedule.mockResolvedValue([]);

    await render(<CaregiverSchedule />);

    await waitFor(() => {
      expect(screen.getByText("No reminders configured")).toBeTruthy();
    });

    expect(
      screen.getByText(
        "Add a reminder time above to create the wellbeing schedule.",
      ),
    ).toBeTruthy();
  });

  test("adds a valid reminder", async () => {
    await render(<CaregiverSchedule />);

    await waitFor(() => {
      expect(screen.getByText("No reminders configured")).toBeTruthy();
    });

    await fireEvent.changeText(screen.getByLabelText("Reminder time"), "09:30");

    await fireEvent.press(screen.getByLabelText("Add reminder"));

    await waitFor(() => {
      expect(screen.getByText("09:30")).toBeTruthy();
    });

    expect(screen.getByText("9:30 AM")).toBeTruthy();
  });

  test("rejects invalid reminder time", async () => {
    await render(<CaregiverSchedule />);

    await waitFor(() => {
      expect(screen.getByText("No reminders configured")).toBeTruthy();
    });

    await fireEvent.changeText(screen.getByLabelText("Reminder time"), "25:99");

    await fireEvent.press(screen.getByLabelText("Add reminder"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Invalid Time",
      "Enter the time using 24-hour HH:mm format, for example 08:30.",
    );

    expect(screen.queryByText("25:99")).toBeNull();
  });

  test("rejects duplicate reminder time", async () => {
    mockGetReminderSchedule.mockResolvedValue([
      {
        id: "reminder1",
        elderlyUserId: "elderly123",
        times: ["08:00"],
      },
    ]);

    await render(<CaregiverSchedule />);

    await waitFor(() => {
      expect(screen.getByText("08:00")).toBeTruthy();
    });

    await fireEvent.changeText(screen.getByLabelText("Reminder time"), "08:00");

    await fireEvent.press(screen.getByLabelText("Add reminder"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Duplicate Reminder",
      "This reminder time already exists.",
    );
  });

  test("deletes a reminder", async () => {
    mockGetReminderSchedule.mockResolvedValue([
      {
        id: "reminder1",
        elderlyUserId: "elderly123",
        times: ["08:00", "18:00"],
      },
    ]);

    await render(<CaregiverSchedule />);

    await waitFor(() => {
      expect(screen.getByText("08:00")).toBeTruthy();
    });

    await fireEvent.press(screen.getByLabelText("Delete reminder 8:00 AM"));

    await waitFor(() => {
      expect(screen.queryByText("08:00")).toBeNull();
    });

    expect(screen.queryByText("8:00 AM")).toBeNull();

    expect(screen.getByText("18:00")).toBeTruthy();

    expect(screen.getByText("6:00 PM")).toBeTruthy();
  });

  test("saves reminder schedule to Firestore", async () => {
    mockGetReminderSchedule.mockResolvedValue([
      {
        id: "reminder1",
        elderlyUserId: "elderly123",
        times: ["08:00", "18:00"],
      },
    ]);

    await render(<CaregiverSchedule />);

    await waitFor(() => {
      expect(screen.getByText("08:00")).toBeTruthy();
    });

    await fireEvent.changeText(screen.getByLabelText("Reminder time"), "12:00");

    await fireEvent.press(screen.getByLabelText("Add reminder"));

    await waitFor(() => {
      expect(screen.getByText("12:00")).toBeTruthy();
    });

    await fireEvent.press(screen.getByText("Save Schedule"));

    await waitFor(() => {
      expect(mockSaveReminderSchedule).toHaveBeenCalledWith("elderly123", [
        "08:00",
        "12:00",
        "18:00",
      ]);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      "Schedule Saved",
      "The wellbeing reminder schedule has been updated.",
    );
  });

  test("saves an empty reminder schedule", async () => {
    mockGetReminderSchedule.mockResolvedValue([]);

    await render(<CaregiverSchedule />);

    await waitFor(() => {
      expect(screen.getByText("Save Schedule")).toBeTruthy();
    });

    await fireEvent.press(screen.getByText("Save Schedule"));

    await waitFor(() => {
      expect(mockSaveReminderSchedule).toHaveBeenCalledWith("elderly123", []);
    });
  });

  test("shows no linked user message when caregiver has no elderly account", async () => {
    mockGetLinkedElderlyUserId.mockResolvedValue(null);

    await render(<CaregiverSchedule />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "No elderly user is linked to this caregiver account.",
        ),
      ).toBeTruthy();
    });

    expect(screen.getByText("No Linked User")).toBeTruthy();

    expect(mockGetReminderSchedule).not.toHaveBeenCalled();
  });

  test("back button works when no elderly user is linked", async () => {
    mockGetLinkedElderlyUserId.mockResolvedValue(null);

    await render(<CaregiverSchedule />);

    await waitFor(() => {
      expect(screen.getByText("No Linked User")).toBeTruthy();
    });

    await fireEvent.press(screen.getByText("‹ Back"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  test("shows saving state while schedule is being saved", async () => {
    let resolveSave!: (value: string) => void;

    const pendingSave = new Promise<string>((resolve) => {
      resolveSave = resolve;
    });

    mockSaveReminderSchedule.mockReturnValue(pendingSave);

    await render(<CaregiverSchedule />);

    await waitFor(() => {
      expect(screen.getByText("Save Schedule")).toBeTruthy();
    });

    /*
     * Important:
     * Do NOT await this press.
     *
     * handleSave is deliberately waiting on
     * pendingSave, so awaiting the press would
     * prevent us from checking the intermediate
     * "Saving..." state.
     */
    fireEvent.press(screen.getByText("Save Schedule"));

    await waitFor(() => {
      expect(screen.getByText("Saving...")).toBeTruthy();
    });

    expect(mockSaveReminderSchedule).toHaveBeenCalledWith("elderly123", []);

    await act(async () => {
      resolveSave("reminder1");

      await pendingSave;
    });

    await waitFor(() => {
      expect(screen.getByText("Save Schedule")).toBeTruthy();
    });
  });
});
