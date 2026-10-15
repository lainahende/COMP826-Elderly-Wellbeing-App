import { beforeEach, describe, expect, jest, test } from "@jest/globals";

/* --------------------------------------------------
   Mock functions
-------------------------------------------------- */

const mockCreateMissedCheckIn = jest.fn();

/* --------------------------------------------------
   Mock DatabaseService
-------------------------------------------------- */

jest.mock("../src/services/DatabaseService", () => ({
  DatabaseService: jest.fn().mockImplementation(() => ({
    createMissedCheckIn: mockCreateMissedCheckIn,
  })),
}));

/* --------------------------------------------------
   Load manager after mocks
-------------------------------------------------- */

const {
  MissedCheckInManager,
} = require("../src/managers/MissedCheckInManager");

/* --------------------------------------------------
   Tests
-------------------------------------------------- */

describe("MissedCheckInManager", () => {
  let manager: InstanceType<typeof MissedCheckInManager>;

  beforeEach(() => {
    jest.clearAllMocks();

    manager = new MissedCheckInManager();

    mockCreateMissedCheckIn.mockResolvedValue("missed123");
  });

  /* ==================================================
       Individual reminder
    ================================================== */

  test("does not mark reminder missed during grace period", () => {
    const now = new Date("2026-10-13T10:20:00");

    const result = manager.isReminderMissed("10:00", [], now);

    expect(result).toBe(false);
  });

  test("marks reminder missed after grace period with no check-in", () => {
    const now = new Date("2026-10-13T10:31:00");

    const result = manager.isReminderMissed("10:00", [], now);

    expect(result).toBe(true);
  });

  test("does not mark reminder missed when check-in occurred during grace period", () => {
    const now = new Date("2026-10-13T10:45:00");

    const checkIns = [new Date("2026-10-13T10:15:00")];

    const result = manager.isReminderMissed("10:00", checkIns, now);

    expect(result).toBe(false);
  });

  test("ignores check-ins before reminder time", () => {
    const now = new Date("2026-10-13T10:45:00");

    const checkIns = [new Date("2026-10-13T09:45:00")];

    const result = manager.isReminderMissed("10:00", checkIns, now);

    expect(result).toBe(true);
  });

  test("ignores check-ins after grace period", () => {
    const now = new Date("2026-10-13T11:00:00");

    const checkIns = [new Date("2026-10-13T10:45:00")];

    const result = manager.isReminderMissed("10:00", checkIns, now);

    expect(result).toBe(true);
  });

  /* ==================================================
       Multiple reminders
    ================================================== */

  test("returns all missed reminder times", () => {
    const now = new Date("2026-10-13T15:00:00");

    const result = manager.getMissedReminderTimes(
      ["08:00", "10:00", "14:00", "18:00"],
      [],
      now,
    );

    expect(result).toEqual(["08:00", "10:00", "14:00"]);
  });

  test("does not return future reminders", () => {
    const now = new Date("2026-10-13T10:00:00");

    const result = manager.getMissedReminderTimes(
      ["08:00", "10:00", "18:00"],
      [],
      now,
    );

    expect(result).toEqual(["08:00"]);
  });

  test("does not return reminders with completed check-ins", () => {
    const now = new Date("2026-10-13T15:00:00");

    const checkIns = [
      new Date("2026-10-13T08:10:00"),

      new Date("2026-10-13T14:20:00"),
    ];

    const result = manager.getMissedReminderTimes(
      ["08:00", "10:00", "14:00"],
      checkIns,
      now,
    );

    expect(result).toEqual(["10:00"]);
  });

  test("returns no missed reminders when all completed", () => {
    const now = new Date("2026-10-13T19:00:00");

    const checkIns = [
      new Date("2026-10-13T08:05:00"),

      new Date("2026-10-13T12:10:00"),

      new Date("2026-10-13T18:15:00"),
    ];

    const result = manager.getMissedReminderTimes(
      ["08:00", "12:00", "18:00"],
      checkIns,
      now,
    );

    expect(result).toEqual([]);
  });

  /* ==================================================
       Scheduled date
    ================================================== */

  test("formats scheduled date as YYYY-MM-DD", () => {
    const date = new Date("2026-10-13T15:00:00");

    expect(manager.getScheduledDate(date)).toBe("2026-10-13");
  });

  /* ==================================================
       Processing missed reminders
    ================================================== */

  test("creates missed check-in records for overdue reminders", async () => {
    const now = new Date("2026-10-13T15:00:00");

    mockCreateMissedCheckIn
      .mockResolvedValueOnce("missed0800")
      .mockResolvedValueOnce("missed1000");

    const result = await manager.processMissedReminders(
      "elderly123",
      ["08:00", "10:00", "18:00"],
      [],
      now,
    );

    expect(mockCreateMissedCheckIn).toHaveBeenCalledWith(
      "elderly123",
      "08:00",
      "2026-10-13",
    );

    expect(mockCreateMissedCheckIn).toHaveBeenCalledWith(
      "elderly123",
      "10:00",
      "2026-10-13",
    );

    expect(mockCreateMissedCheckIn).toHaveBeenCalledTimes(2);

    expect(result).toEqual(["missed0800", "missed1000"]);
  });

  test("does not create missed records for future reminders", async () => {
    const now = new Date("2026-10-13T10:00:00");

    const result = await manager.processMissedReminders(
      "elderly123",
      ["10:00", "18:00"],
      [],
      now,
    );

    expect(mockCreateMissedCheckIn).not.toHaveBeenCalled();

    expect(result).toEqual([]);
  });

  test("does not create missed record when check-in was completed", async () => {
    const now = new Date("2026-10-13T11:00:00");

    const completedCheckIns = [new Date("2026-10-13T10:15:00")];

    const result = await manager.processMissedReminders(
      "elderly123",
      ["10:00"],
      completedCheckIns,
      now,
    );

    expect(mockCreateMissedCheckIn).not.toHaveBeenCalled();

    expect(result).toEqual([]);
  });

  test("only creates records for missed reminders", async () => {
    const now = new Date("2026-10-13T15:00:00");

    const completedCheckIns = [new Date("2026-10-13T08:10:00")];

    mockCreateMissedCheckIn.mockResolvedValue("missed1000");

    const result = await manager.processMissedReminders(
      "elderly123",
      ["08:00", "10:00", "18:00"],
      completedCheckIns,
      now,
    );

    expect(mockCreateMissedCheckIn).toHaveBeenCalledTimes(1);

    expect(mockCreateMissedCheckIn).toHaveBeenCalledWith(
      "elderly123",
      "10:00",
      "2026-10-13",
    );

    expect(result).toEqual(["missed1000"]);
  });
});
