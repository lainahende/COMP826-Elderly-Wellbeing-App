export interface MissedCheckIn {
  id?: string;
  elderlyUserId: string;
  reminderId: string;
  scheduledTime: Date;
  detectedAt: Date;
}
