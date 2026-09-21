export interface Reminder {
  id?: string;
  elderlyUserId: string;
  caregiverId: string;
  time: string;
  enabled: boolean;
}
