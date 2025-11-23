export interface CreateUserDto {
  email?: string;
  phoneNumber?: string;
  countryCodeId?: string;
  name?: string;
  isVerified?: boolean;
}

export interface UpdateUserDto {
  email?: string;
  phoneNumber?: string;
  countryCodeId?: string;
  name?: string;
}

export interface UserRoleAssignmentDto {
  userId: string;
  roleId: string;
}
