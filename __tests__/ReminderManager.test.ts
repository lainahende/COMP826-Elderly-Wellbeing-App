import { describe, expect, test } from "@jest/globals";

import { ReminderManager } from "../src/managers/ReminderManager";

describe("ReminderManager", () => {
  test("returns the next reminder later today", () => {
    const manager = new ReminderManager();

    const now = new Date("2026-10-01T09:00:00");

    const reminderTimes = ["08:00", "10:00", "18:00"];

    const result = manager.getNextReminder(reminderTimes, now);

    expect(result).toBe("10:00");
  });

  test("returns the first reminder tomorrow when all reminders have passed", () => {
    const manager = new ReminderManager();

    const now = new Date("2026-10-01T20:00:00");

    const reminderTimes = ["08:00", "10:00", "18:00"];

    const result = manager.getNextReminder(reminderTimes, now);

    expect(result).toBe("08:00");
  });

  test("returns null when no reminders exist", () => {
    const manager = new ReminderManager();

    const now = new Date("2026-10-01T09:00:00");

    const result = manager.getNextReminder([], now);

    expect(result).toBeNull();
  });

  test("handles unsorted reminder times", () => {
    const manager = new ReminderManager();

    const now = new Date("2026-10-01T09:00:00");

    const reminderTimes = ["18:00", "08:00", "10:00"];

    const result = manager.getNextReminder(reminderTimes, now);

    expect(result).toBe("10:00");
  });
});
