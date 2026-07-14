import type { Role } from '@/types/database';

/** Roles that can access the /admin section (in addition to plain 'admin'). */
export const STAFF_ROLES: Role[] = ['editor', 'moderator', 'admin'];
