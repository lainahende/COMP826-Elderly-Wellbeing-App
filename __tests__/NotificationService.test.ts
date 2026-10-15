import { beforeEach, describe, expect, jest, test } from "@jest/globals";

/* --------------------------------------------------
   Mock functions
-------------------------------------------------- */

const mockGetPermissions = jest.fn();
const mockRequestPermissions = jest.fn();
const mockSchedule = jest.fn();
const mockCancelAll = jest.fn();
const mockSetNotificationHandler = jest.fn();

/* --------------------------------------------------
   Mock expo-notifications
-------------------------------------------------- */

jest.mock("expo-notifications", () => ({
  setNotificationHandler: mockSetNotificationHandler,

  getPermissionsAsync: mockGetPermissions,

  requestPermissionsAsync: mockRequestPermissions,

  scheduleNotificationAsync: mockSchedule,

  cancelAllScheduledNotificationsAsync: mockCancelAll,

  SchedulableTriggerInputTypes: {
    DAILY: "daily",
  },
}));

/* --------------------------------------------------
   Import service after mocks
-------------------------------------------------- */

const { NotificationService } = require("../src/services/NotificationService");

/* --------------------------------------------------
   Tests
-------------------------------------------------- */

describe("NotificationService", () => {
  let notificationService: InstanceType<typeof NotificationService>;

  beforeEach(() => {
    jest.clearAllMocks();

    notificationService = new NotificationService();

    mockGetPermissions.mockResolvedValue({
      granted: false,
    });

    mockRequestPermissions.mockResolvedValue({
      granted: true,
    });

    mockSchedule.mockResolvedValue("notification-id");

    mockCancelAll.mockResolvedValue(undefined);
  });

  test("returns true when notification permission is already granted", async () => {
    mockGetPermissions.mockResolvedValue({
      granted: true,
    });

    const result = await notificationService.requestPermissions();

    expect(result).toBe(true);

    expect(mockRequestPermissions).not.toHaveBeenCalled();
  });

  test("requests permission when not already granted", async () => {
    mockGetPermissions.mockResolvedValue({
      granted: false,
    });

    mockRequestPermissions.mockResolvedValue({
      granted: true,
    });

    const result = await notificationService.requestPermissions();

    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);

    expect(result).toBe(true);
  });

  test("returns false when notification permission is denied", async () => {
    mockGetPermissions.mockResolvedValue({
      granted: false,
    });

    mockRequestPermissions.mockResolvedValue({
      granted: false,
    });

    const result = await notificationService.requestPermissions();

    expect(result).toBe(false);
  });

  test("schedules one daily reminder", async () => {
    mockSchedule.mockResolvedValue("reminder-id");

    const result = await notificationService.scheduleDailyReminder("10:30");

    expect(mockSchedule).toHaveBeenCalledWith({
      content: {
        title: "Wellbeing Check-in",

        body: "It's time to complete your wellbeing check-in.",

        data: {
          type: "wellbeing-reminder",
        },
      },

      trigger: {
        type: "daily",
        hour: 10,
        minute: 30,
      },
    });

    expect(result).toBe("reminder-id");
  });

  test("schedules all configured reminder times", async () => {
    mockSchedule
      .mockResolvedValueOnce("reminder-1")
      .mockResolvedValueOnce("reminder-2")
      .mockResolvedValueOnce("reminder-3");

    const result = await notificationService.scheduleReminderTimes([
      "08:00",
      "12:00",
      "18:00",
    ]);

    expect(mockSchedule).toHaveBeenCalledTimes(3);

    expect(result).toEqual(["reminder-1", "reminder-2", "reminder-3"]);
  });

  test("cancels all scheduled reminders", async () => {
    await notificationService.cancelAllReminders();

    expect(mockCancelAll).toHaveBeenCalledTimes(1);
  });

  test("sends missed check-in notification", async () => {
    mockSchedule.mockResolvedValue("missed-notification");

    const result = await notificationService.sendMissedCheckInNotification();

    expect(mockSchedule).toHaveBeenCalledWith({
      content: {
        title: "Missed Wellbeing Check-in",

        body: "The elderly user has missed a scheduled wellbeing check-in.",

        data: {
          type: "missed-check-in",
        },
      },

      trigger: null,
    });

    expect(result).toBe("missed-notification");
  });
});
