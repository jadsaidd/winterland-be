export interface CreateRoleDto {
  name: string;
  roleType?: 'WORKER' | 'CUSTOMER';
  description?: string;
}

export interface UpdateRoleDto {
  name?: string;
  roleType?: 'WORKER' | 'CUSTOMER';
  description?: string;
}

export interface AssignRoleDto {
  userId: string;
  roleId: string;
}

export interface RevokeRoleDto {
  userId: string;
  roleId: string;
}
