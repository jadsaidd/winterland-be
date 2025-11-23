export interface CreatePermissionDto {
  name: string;
  resource: string;
  action: string;
}

export interface UpdatePermissionDto {
  name?: string;
  resource?: string;
  action?: string;
}

export interface AssignPermissionDto {
  permissionId: string;
  roleId: string;
}

export interface RevokePermissionDto {
  permissionId: string;
  roleId: string;
}
