export type UserRole = "elderly" | "caregiver";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;

  elderlyUserId?: string;
}
