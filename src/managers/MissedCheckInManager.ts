import { DatabaseService } from "../services/DatabaseService";

export class MissedCheckInManager {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
  }

  isReminderMissed(
    reminderTime: string,
    checkIns: Date[],
    now: Date = new Date(),
    gracePeriodMinutes = 30,
  ): boolean {
    const [hour, minute] = reminderTime.split(":").map(Number);

    const reminderDate = new Date(now);

    reminderDate.setHours(hour, minute, 0, 0);

    const deadline = new Date(
      reminderDate.getTime() + gracePeriodMinutes * 60 * 1000,
    );

    // The reminder is still within
    // the grace period.
    if (now <= deadline) {
      return false;
    }

    // Check whether a completed
    // check-in occurred between
    // the reminder time and deadline.
    const completed = checkIns.some(
      (checkInDate) => checkInDate >= reminderDate && checkInDate <= deadline,
    );

    return !completed;
  }

  getMissedReminderTimes(
    reminderTimes: string[],
    checkIns: Date[],
    now: Date = new Date(),
    gracePeriodMinutes = 30,
  ): string[] {
    return reminderTimes.filter((reminderTime) =>
      this.isReminderMissed(reminderTime, checkIns, now, gracePeriodMinutes),
    );
  }

  getScheduledDate(date: Date = new Date()): string {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  async processMissedReminders(
    elderlyUserId: string,
    reminderTimes: string[],
    completedCheckIns: Date[],
    now: Date = new Date(),
    gracePeriodMinutes = 30,
  ): Promise<string[]> {
    const missedTimes = this.getMissedReminderTimes(
      reminderTimes,
      completedCheckIns,
      now,
      gracePeriodMinutes,
    );

    const scheduledDate = this.getScheduledDate(now);

    const createdIds: string[] = [];

    for (const reminderTime of missedTimes) {
      const id = await this.databaseService.createMissedCheckIn(
        elderlyUserId,
        reminderTime,
        scheduledDate,
      );

      createdIds.push(id);
    }

    return createdIds;
  }
}
