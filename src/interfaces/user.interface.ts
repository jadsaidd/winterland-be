export interface ITokenPayload {
  userId: string;
  email?: string | null;
  phoneNumber?: string | null;
  platform?: string;
  iat: number;
  exp: number;
}
