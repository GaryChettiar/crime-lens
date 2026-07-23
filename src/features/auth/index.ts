/**
 * Auth Feature
 *
 * Handles user authentication, login/logout flows, and session management.
 * Uses RTK Query authApi for server state.
 * Authentication is handled by Catalyst hosted auth — no signup/registration.
 */
export {
  useGetCurrentUserQuery,
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
} from '@/services/authApi';
export type { AuthUser } from '@/services/authApi';

export { LoginPage } from './components/LoginPage';
export { ProtectedRoute } from './components/ProtectedRoute';
export { PermissionGuard } from './components/PermissionGuard';
export { PermissionRoute } from './components/PermissionRoute';
export { InviteOnboardPage } from './components/InviteOnboardPage';
export { NoAccessPage } from './components/NoAccessPage';
