export interface AuthResult {
  user:         { id: string; email: string; displayName: string | null; role: string };
  accessToken:  string;
  refreshToken: string;
}
