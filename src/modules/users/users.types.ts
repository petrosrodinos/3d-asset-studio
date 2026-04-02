export type Role = "USER" | "ADMIN";

export interface UserPublic {
  id: string;
  email: string;
  displayName: string | null;
  role: Role;
  tokenBalance: number;
}
