import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  async requestPermissions(): Promise<boolean> {
    const existing = await Notifications.getPermissionsAsync();

    if (existing.granted) {
      return true;
    }

    const result = await Notifications.requestPermissionsAsync();

    return result.granted;
  }

  async scheduleDailyReminder(time: string): Promise<string> {
    const [hourText, minuteText] = time.split(":");

    const hour = Number(hourText);
    const minute = Number(minuteText);

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "Wellbeing Check-in",
        body: "It's time to complete your wellbeing check-in.",
        data: {
          type: "wellbeing-reminder",
        },
      },

      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }

  async scheduleReminderTimes(times: string[]): Promise<string[]> {
    const ids: string[] = [];

    for (const time of times) {
      const id = await this.scheduleDailyReminder(time);

      ids.push(id);
    }

    return ids;
  }

  async cancelAllReminders() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}
