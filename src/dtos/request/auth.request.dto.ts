export interface RegisterUserDto {
  countryCodeId?: string;
  phoneNumber?: string;
  email?: string;
  name?: string;
  isVerified?: boolean;
  googleId?: string;
  googleVerifiedEmail?: boolean;
  appleId?: string;
  profilePictureUrl?: string;
  platform?: 'Mobile' | 'Dashboard';
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

export interface LoginUserDto {
  countryCode?: string;
  phoneNumber?: string;
  email?: string;
}

export interface GuestLoginDto {
  deviceId: string;
}
