export class ReminderManager {
  getNextReminder(
    reminderTimes: string[],
    now: Date = new Date(),
  ): string | null {
    if (reminderTimes.length === 0) {
      return null;
    }

    const sortedTimes = [...reminderTimes].sort();

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const time of sortedTimes) {
      const [hours, minutes] = time.split(":").map(Number);

      const reminderMinutes = hours * 60 + minutes;

      if (reminderMinutes > currentMinutes) {
        return time;
      }
    }

    return sortedTimes[0];
  }
}
