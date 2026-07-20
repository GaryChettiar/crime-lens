import * as React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import {
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
  useDeleteUsersMutation,
  useInviteUserMutation,
  useGetInvitesQuery,
  useReinviteUserMutation,
} from '@/services/usersApi';
import { useGetAllRolesQuery } from '@/services/rolesApi';
import { useGetCurrentUserQuery } from '@/services/authApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import {
  Search,
  RefreshCw,
  UserPlus,
  MoreHorizontal,
  Check,
  X,
  Send,
  ChevronDown,
  Trash2,
  Users,
  UserCheck,
  Mail,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'all' | 'invites';

export function UsersPage() {
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  // API data
  const { data: usersData, isLoading, isError, refetch: refetchUsers } = useGetAllUsersQuery({ page, limit: pageSize });
  const { data: roles } = useGetAllRolesQuery();
  const { data: currentUser } = useGetCurrentUserQuery();
  const { data: invites, isLoading: invitesLoading, refetch: refetchInvites } = useGetInvitesQuery();

  // Mutations
  const [updateUserRole] = useUpdateUserRoleMutation();
  const [activateUser] = useActivateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const [deleteUsers] = useDeleteUsersMutation();
  const [inviteUserMutation, { isLoading: isInviting }] = useInviteUserMutation();
  const [reinviteUser] = useReinviteUserMutation();

  const usersList = usersData?.users || [];
  const totalUsers = usersData?.total || 0;

  const [search, setSearch] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<TabType>('all');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [expandedRow, setExpandedRow] = React.useState<string | null>(null);
  const [showBulkMenu, setShowBulkMenu] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  // Invite form
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteFeedback, setInviteFeedback] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [resendingEmail, setResendingEmail] = React.useState<string | null>(null);

  // Filtered users (client-side search on current page)
  const filteredUsers = React.useMemo(() => {
    return usersList.filter((u: any) => {
      const email = u.userInfo?.email || '';
      const name = u.userInfo?.name || '';
      if (search) {
        const q = search.toLowerCase();
        if (!name.toLowerCase().includes(q) && !email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [usersList, search]);

  const totalPages = Math.ceil(totalUsers / pageSize) || 1;

  const handleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map((u: any) => u.id)));
    }
  };

  const handleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleRoleChange = async (email: string, newRoleId: string) => {
    const role = roles?.find((r) => r.id === newRoleId);
    if (!role) return;
    try {
      await updateUserRole({ email, roleName: role.name }).unwrap();
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkAction = async (action: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      if (action === 'activate') {
        for (const u of filteredUsers) {
          if (ids.includes(u.id)) await activateUser(u.userInfo.email).unwrap();
        }
      } else if (action === 'deactivate') {
        for (const u of filteredUsers) {
          if (ids.includes(u.id)) await deactivateUser(u.userInfo.email).unwrap();
        }
      } else if (action === 'delete') {
        const emails = filteredUsers.filter(u => ids.includes(u.id)).map(u => u.userInfo.email);
        await deleteUsers(emails).unwrap();
      }
    } catch (e) {
      console.error(e);
    }

    setSelectedIds(new Set());
    setShowBulkMenu(false);
  };

  const handleDeleteUser = async (email: string) => {
    try {
      await deleteUsers([email]).unwrap();
      setConfirmDeleteId(null);
      setExpandedRow(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteFeedback(null);
    if (!currentUser?.id) {
      setInviteFeedback({ type: 'error', message: 'Your session could not be identified. Please sign in again.' });
      return;
    }
    try {
      const response = await inviteUserMutation({
        email: inviteEmail.trim(),
        invited_by: currentUser.id,
      }).unwrap();
      setInviteEmail('');
      setShowInviteModal(false);
      setActiveTab('invites');
      setInviteFeedback({ type: 'success', message: response.message || 'Invitation email sent successfully.' });
      refetchInvites();
      refetchUsers();
    } catch (e) {
      setInviteFeedback({
        type: 'error',
        message: (e as { data?: { message?: string } })?.data?.message || 'Unable to send the invitation. Please try again.',
      });
    }
  };

  const handleReinvite = async (email: string) => {
    setInviteFeedback(null);
    setResendingEmail(email);
    try {
      const response = await reinviteUser({ email }).unwrap();
      setInviteFeedback({ type: 'success', message: response.message || `Invitation resent to ${email}.` });
      refetchInvites();
    } catch (e) {
      setInviteFeedback({
        type: 'error',
        message: (e as { data?: { message?: string } })?.data?.message || `Unable to resend the invitation to ${email}.`,
      });
    } finally {
      setResendingEmail(null);
    }
  };

  const TABS: { key: TabType; label: string; icon: React.ElementType; count: number }[] = [
    { key: 'all', label: 'Users', icon: UserCheck, count: totalUsers },
    { key: 'invites', label: 'Invites', icon: Mail, count: invites?.length ?? 0 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">User Management</h1>
            <p className="text-sm mt-0.5 text-muted-foreground">
              Manage platform users, roles, and invitations.
            </p>
          </div>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => setShowInviteModal(true)}
          >
            <UserPlus className="h-4 w-4" />
            Invite User
          </button>
        </div>

        {inviteFeedback && (
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm',
              inviteFeedback.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                : 'border-danger/30 bg-danger/10 text-danger',
            )}
            role="status"
          >
            {inviteFeedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            <span>{inviteFeedback.message}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="admin-card p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                className="admin-input pl-10"
                placeholder="Search users..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {/* Refresh */}
            <button className="admin-btn admin-btn-secondary" onClick={() => { refetchUsers(); refetchInvites(); }}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
              <div className="relative">
                <button
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowBulkMenu(!showBulkMenu)}
                >
                  Actions ({selectedIds.size})
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {showBulkMenu && (
                  <div className="absolute top-full mt-1 right-0 bg-card border border-border rounded-lg shadow-lg p-1 z-20 min-w-[160px]">
                    <button
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted flex items-center gap-2 text-foreground"
                      onClick={() => handleBulkAction('activate')}
                    >
                      <Check className="h-3.5 w-3.5 text-success" /> Activate
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted flex items-center gap-2 text-foreground"
                      onClick={() => handleBulkAction('deactivate')}
                    >
                      <X className="h-3.5 w-3.5 text-warning" /> Deactivate
                    </button>
                    <div className="border-t border-border my-1" />
                    <button
                      className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-danger/10 flex items-center gap-2 text-danger"
                      onClick={() => handleBulkAction('delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="admin-tabs mt-4">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab.key); setPage(1); }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={cn(
                      "ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full text-[10px] font-bold px-1.5",
                      activeTab === tab.key
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Users Tab */}
        {activeTab === 'all' && (
          <>
            {isLoading && <TableSkeleton columns={6} rows={6} />}
            {isError && (
              <ErrorState
                title="Failed to load users"
                message="Could not fetch users from the server."
                onRetry={refetchUsers}
              />
            )}
            {!isLoading && !isError && filteredUsers.length === 0 && (
              <EmptyState
                icon={Users}
                title="No users found"
                description={search ? 'Try a different search term.' : 'No users have been created yet.'}
              />
            )}
            {!isLoading && !isError && filteredUsers.length > 0 && (
              <div className="admin-card overflow-hidden">
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th className="w-[40px]">
                          <input
                            type="checkbox"
                            checked={selectedIds.size === filteredUsers.length && filteredUsers.length > 0}
                            onChange={handleSelectAll}
                            className="h-4 w-4 accent-primary"
                          />
                        </th>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th className="w-[100px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user: any) => {
                        const name = user.userInfo?.name || 'Unknown';
                        const email = user.userInfo?.email || '';
                        const roleId = user.roles?.[0]?.id || '';
                        const statusKey = user.isArchived ? 'inactive' : 'active';

                        return (
                        <React.Fragment key={user.id}>
                          <tr className={selectedIds.has(user.id) ? 'selected' : ''}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedIds.has(user.id)}
                                onChange={() => handleSelect(user.id)}
                                className="h-4 w-4 accent-primary"
                              />
                            </td>
                            <td>
                              <div className="flex items-center gap-3">
                                <div
                                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground bg-primary shrink-0"
                                >
                                  {name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </div>
                                <span className="font-semibold text-sm text-foreground">{name}</span>
                              </div>
                            </td>
                            <td>
                              <span className="text-sm text-muted-foreground">{email}</span>
                            </td>
                            <td>
                              <select
                                className="text-xs font-medium px-2 py-1 rounded-md border border-border bg-card text-foreground cursor-pointer"
                                value={roleId}
                                onChange={(e) => handleRoleChange(email, e.target.value)}
                              >
                                {(roles || []).map((r) => (
                                  <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <span className={cn(
                                "admin-badge",
                                statusKey === 'active' ? 'admin-badge-active' : 'admin-badge-inactive'
                              )}>
                                {statusKey === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-1">
                                <button
                                  className="p-1.5 rounded-md hover:bg-muted"
                                  title="Expand"
                                  onClick={() => setExpandedRow(expandedRow === user.id ? null : user.id)}
                                >
                                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedRow === user.id && (
                            <tr>
                              <td colSpan={6} className="bg-muted/30 p-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground">Phone</p>
                                    <p className="text-foreground">{user.userInfo?.phone || '—'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground">ID</p>
                                    <p className="text-foreground font-mono text-xs">{user.id}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                  {user.isArchived ? (
                                    <button
                                      className="admin-btn admin-btn-primary text-xs py-1.5"
                                      onClick={async () => {
                                        await activateUser(email);
                                      }}
                                    >
                                      <Check className="h-3.5 w-3.5" /> Activate
                                    </button>
                                  ) : (
                                    <button
                                      className="admin-btn admin-btn-secondary text-xs py-1.5"
                                      onClick={async () => {
                                        await deactivateUser(email);
                                      }}
                                    >
                                      <X className="h-3.5 w-3.5" /> Deactivate
                                    </button>
                                  )}
                                  <button
                                    className="admin-btn admin-btn-danger text-xs py-1.5"
                                    onClick={() => setConfirmDeleteId(email)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );})}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
                    <span className="text-xs text-muted-foreground">
                      Page {page} of {totalPages} ({totalUsers} total)
                    </span>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          className={cn(
                            "h-8 w-8 rounded-md text-xs font-medium transition-colors",
                            p === page
                              ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                              : 'text-muted-foreground hover:bg-muted'
                          )}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Invites Tab */}
        {activeTab === 'invites' && (
          <>
            {invitesLoading && <TableSkeleton columns={5} rows={4} />}
            {!invitesLoading && (!invites || invites.length === 0) && (
              <EmptyState
                icon={Mail}
                title="No invitations"
                description="No pending user invitations. Send an invite to get started."
                action={
                  <button className="admin-btn admin-btn-primary text-xs" onClick={() => setShowInviteModal(true)}>
                    <UserPlus className="h-3.5 w-3.5" /> Invite User
                  </button>
                }
              />
            )}
            {!invitesLoading && invites && invites.length > 0 && (
              <div className="admin-card overflow-hidden">
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Invited By</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invites.map((inv) => (
                        <tr key={inv.id}>
                          <td className="font-semibold text-foreground">{inv.email}</td>
                          <td>
                            <span className="admin-badge admin-badge-role">{inv.roleName || inv.roleId || 'Default role'}</span>
                          </td>
                          <td className="text-muted-foreground">{inv.invitedBy || '—'}</td>
                          <td>
                            <span className={cn(
                              "admin-badge",
                              inv.status === 'pending' ? 'admin-badge-pending' :
                              inv.status === 'accepted' ? 'admin-badge-active' : 'admin-badge-inactive'
                            )}>
                              {inv.status}
                            </span>
                          </td>
                          <td>
                            {inv.status !== 'accepted' && (
                              <button
                                className="admin-btn admin-btn-ghost text-xs py-1 px-2 gap-1.5"
                                onClick={() => handleReinvite(inv.email)}
                                disabled={resendingEmail === inv.email}
                              >
                                {resendingEmail === inv.email ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                {resendingEmail === inv.email ? 'Sending...' : 'Resend'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-1 text-foreground">Invite User</h2>
              <p className="text-sm mb-5 text-muted-foreground">
                Send an invitation email to a new platform user. Their default role is assigned by the server.
              </p>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Email Address</label>
                  <input
                    className="admin-input"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@crimelens.gov.in"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowInviteModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={isInviting}>
                    {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send Invite
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-6">
              <h2 className="text-lg font-bold mb-2 text-foreground">Delete User</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Are you sure you want to permanently delete this user? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button className="admin-btn admin-btn-secondary" onClick={() => setConfirmDeleteId(null)}>
                  Cancel
                </button>
                <button className="admin-btn admin-btn-danger" onClick={() => handleDeleteUser(confirmDeleteId)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
