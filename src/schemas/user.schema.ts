import { z } from 'zod';

export const getUsersQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val) : 10),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED'], {
    message: 'Status must be one of: ACTIVE, SUSPENDED, DELETED',
  }).optional(),
  isVerified: z.enum(['true', 'false'], {
    message: 'isVerified must be true or false',
  }).optional().transform((val) => val === 'true' ? true : val === 'false' ? false : undefined),
  search: z.string().min(1, 'Search term cannot be empty').optional(),
});

export const createUserSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email address')
      .optional(),
    phoneNumber: z
      .string()
      .min(1, 'Phone number cannot be empty')
      .optional(),
    countryCodeId: z
      .string()
      .cuid('Invalid country code ID format')
      .optional(),
    name: z
      .string()
      .min(1, 'Name cannot be empty')
      .optional(),
    isVerified: z
      .boolean()
      .optional()
      .default(false),
  })
  .refine((data) => data.email || data.phoneNumber, {
    message: 'Either email or phone number must be provided',
    path: ['email'],
  })
  .refine((data) => {
    if (data.phoneNumber && !data.countryCodeId) {
      return false;
    }
    return true;
  }, {
    message: 'Country code is required when phone number is provided',
    path: ['countryCodeId'],
  });

export const updateUserSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email address')
      .optional(),
    phoneNumber: z
      .string()
      .min(1, 'Phone number cannot be empty')
      .optional(),
    countryCodeId: z
      .string()
      .cuid('Invalid country code ID format')
      .optional(),
    name: z
      .string()
      .min(1, 'Name cannot be empty')
      .optional(),
  })
  .refine((data) => {
    if (data.phoneNumber && !data.countryCodeId) {
      return false;
    }
    return true;
  }, {
    message: 'Country code is required when phone number is provided',
    path: ['countryCodeId'],
  });

export const userIdParamSchema = z.object({
  id: z.cuid('Invalid user ID format'),
});

export const userIdParamSchemaUserId = z.object({
  userId: z.cuid('Invalid user ID format'),
});

export const userRoleParamsSchema = z.object({
  userId: z.cuid('Invalid user ID format'),
  roleId: z.cuid('Invalid role ID format'),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED'], {
    message: 'Status must be one of: ACTIVE, SUSPENDED, DELETED',
  }),
});

export const updateUserSettingsSchema = z.object({
  deviceToken: z.string().optional(),
  selectedLanguage: z.string().min(2).max(5).optional(),
  timezone: z.string().optional(),
  appVersion: z.string().optional(),
}).refine((data) => {
  return data.deviceToken !== undefined ||
    data.selectedLanguage !== undefined ||
    data.timezone !== undefined ||
    data.appVersion !== undefined;
}, {
  message: 'At least one field must be provided (deviceToken, selectedLanguage, timezone, or appVersion)',
});

// Patch payload for UserApplicationData updates (mobile)
export const updateUserApplicationDataSchema = z.object({
  deviceId: z.string().optional(),
  deviceModel: z.string().optional(),
  osName: z.string().optional(),
  osVersion: z.string().optional(),
  appPlatform: z.string().optional(),
  fcmToken: z.string().optional(),
  notificationsEnabled: z.boolean().optional(),
  timezoneName: z.string().optional(),
  timezoneOffset: z.number().int().optional(),
  appVersion: z.string().optional(),
  buildNumber: z.string().optional(),
  lastKnownIpAddress: z.string().optional(),
  currentIpAddress: z.string().optional(),
}).refine((data) => {
  return Object.values(data).some((v) => v !== undefined);
}, {
  message: 'At least one field must be provided to update application data',
});

// Update user profile schema for mobile endpoint
export const updateUserProfileSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  selectedLanguage: z.string().min(2, 'Language code must be at least 2 characters').max(5, 'Language code cannot exceed 5 characters').optional(),
  profileUrl: z.string().url('Invalid profile URL').optional(),
}).refine((data) => {
  return data.name !== undefined || data.selectedLanguage !== undefined || data.profileUrl !== undefined;
}, {
  message: 'At least one field must be provided (name, selectedLanguage, or profileUrl)',
});

export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type UserIdParamUserId = z.infer<typeof userIdParamSchemaUserId>;
export type UserRoleParams = z.infer<typeof userRoleParamsSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserApplicationDataInput = z.infer<typeof updateUserApplicationDataSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;