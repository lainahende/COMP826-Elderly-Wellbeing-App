import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import * as Notifications from "expo-notifications";

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),

  SchedulableTriggerInputTypes: {
    DAILY: "daily",
  },
}));

import { NotificationService } from "../src/services/NotificationService";

const mockGetPermissions =
  Notifications.getPermissionsAsync as jest.MockedFunction<
    typeof Notifications.getPermissionsAsync
  >;

const mockRequestPermissions =
  Notifications.requestPermissionsAsync as jest.MockedFunction<
    typeof Notifications.requestPermissionsAsync
  >;

const mockSchedule =
  Notifications.scheduleNotificationAsync as jest.MockedFunction<
    typeof Notifications.scheduleNotificationAsync
  >;

const mockCancelAll =
  Notifications.cancelAllScheduledNotificationsAsync as jest.MockedFunction<
    typeof Notifications.cancelAllScheduledNotificationsAsync
  >;

describe("NotificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns true when notification permission is already granted", async () => {
    mockGetPermissions.mockResolvedValue({
      granted: true,
      status: "granted",
      canAskAgain: true,
      expires: "never",
    } as any);

    const service = new NotificationService();

    const result = await service.requestPermissions();

    expect(result).toBe(true);

    expect(mockRequestPermissions).not.toHaveBeenCalled();
  });

  test("requests notification permission when not already granted", async () => {
    mockGetPermissions.mockResolvedValue({
      granted: false,
      status: "undetermined",
      canAskAgain: true,
      expires: "never",
    } as any);

    mockRequestPermissions.mockResolvedValue({
      granted: true,
      status: "granted",
      canAskAgain: true,
      expires: "never",
    } as any);

    const service = new NotificationService();

    const result = await service.requestPermissions();

    expect(mockRequestPermissions).toHaveBeenCalled();

    expect(result).toBe(true);
  });

  test("schedules a wellbeing reminder", async () => {
    mockSchedule.mockResolvedValue("notification123");

    const service = new NotificationService();

    const result = await service.scheduleDailyReminder("10:30");

    expect(mockSchedule).toHaveBeenCalled();

    expect(result).toBe("notification123");
  });

  test("schedules all configured reminder times", async () => {
    mockSchedule.mockResolvedValueOnce("one").mockResolvedValueOnce("two");

    const service = new NotificationService();

    const result = await service.scheduleReminderTimes(["08:00", "18:00"]);

    expect(mockSchedule).toHaveBeenCalledTimes(2);

    expect(result).toEqual(["one", "two"]);
  });

  test("cancels existing reminders", async () => {
    mockCancelAll.mockResolvedValue();

    const service = new NotificationService();

    await service.cancelAllReminders();

    expect(mockCancelAll).toHaveBeenCalledTimes(1);
  });
});
