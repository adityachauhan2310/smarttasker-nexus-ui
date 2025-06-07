import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Check, 
  X,
  Loader2,
  Filter,
  Eye,
  EyeOff,
  Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useUsers, useDeleteUser, useUpdateUser, useResetUserPassword } from '@/hooks/useApi';
import AddUserModal from '@/components/modals/AddUserModal';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { User } from '@/types/auth';
import { PaginationMeta } from '@/types/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast as sonnerToast } from 'sonner';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  
  const pageSize = 10;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { toast } = useToast();
  const { data: usersData, isLoading, isError, refetch } = useUsers({ 
    page, 
    limit: pageSize,
    search: debouncedSearchTerm.trim() !== '' ? debouncedSearchTerm : undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined
  });
  
  const deleteUserMutation = useDeleteUser();
  const updateUserMutation = useUpdateUser();
  const resetUserPasswordMutation = useResetUserPassword();

  const openAddUserModal = () => setIsAddUserModalOpen(true);
  const closeAddUserModal = () => setIsAddUserModalOpen(false);

  const confirmDeleteUser = (userId: string) => {
    setUserToDelete(userId);
  };

  const cancelDeleteUser = () => {
    setUserToDelete(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      sonnerToast.loading("Deleting user...");
      await deleteUserMutation.mutateAsync(userToDelete);
      sonnerToast.success("User deleted successfully");
      setUserToDelete(null);
      refetch();
    } catch (error) {
      console.error('Error deleting user:', error, error?.response?.data);
      sonnerToast.error(`Failed to delete user. ${error?.message || ''} ${error?.response?.data?.message || ''}`);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      sonnerToast.loading(`${currentStatus ? "Deactivating" : "Activating"} user...`);
      await updateUserMutation.mutateAsync({
        userId,
        userData: { isActive: !currentStatus },
      });
      sonnerToast.success(`User ${!currentStatus ? "activated" : "deactivated"} successfully`);
      refetch();
    } catch (error) {
      console.error('Error updating user status:', error, error?.response?.data);
      sonnerToast.error(`Failed to update user status. ${error?.message || ''} ${error?.response?.data?.message || ''}`);
    }
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setPage(1); // Reset to first page when filter changes
  };

  // Get users from response data 
  const users: User[] = Array.isArray(usersData?.data) ? usersData.data : [];

  // Get pagination info
  const pagination: PaginationMeta | undefined = usersData?.pagination;

  // Function to get the total number of pages
  const getTotalPages = () => {
    if (!pagination) return 1;
    return pagination.pages || pagination.totalPages || 1;
  };

  // Function to format date in a readable format
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Unknown';
    }
  };

  // Function to render role badge with appropriate styling
  const renderRoleBadge = (role: string) => {
    let variant: "default" | "secondary" | "outline" = "outline";
    
    if (role === 'admin') {
      variant = "default";
    } else if (role === 'team_leader') {
      variant = "secondary";
    }
    
    return (
      <Badge variant={variant} className="capitalize whitespace-nowrap">
        {role.replace('_', ' ')}
      </Badge>
    );
  };

  // Function to render status badge with appropriate styling
  const renderStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"} className="capitalize whitespace-nowrap">
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-100 via-blue-50 to-purple-100 dark:from-slate-950 dark:via-blue-950/90 dark:to-purple-950/90 py-10 px-2">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1 flex items-center gap-3">
              <span className="inline-block bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-transparent bg-clip-text">User Management</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-300 text-lg font-light">Manage users, roles, and permissions</p>
          </div>
          <Button 
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg text-white font-semibold px-6 py-2 rounded-xl"
            onClick={openAddUserModal}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 rounded-2xl">
          <CardHeader className="pb-2 border-b border-gray-200 dark:border-gray-800">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-500" />
              Users
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">Manage all system users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 py-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border-0 shadow focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="w-full md:w-[220px]">
                <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                  <SelectTrigger className="rounded-xl bg-white/70 dark:bg-slate-800/70 border-0 shadow">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="team_leader">Team Leaders</SelectItem>
                    <SelectItem value="team_member">Team Members</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Users Table */}
            {isLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, index) => (
                  <div key={index} className="flex items-center justify-between p-6 bg-white/60 dark:bg-slate-800/60 rounded-2xl shadow animate-pulse">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-14 w-14 rounded-full" />
                      <div>
                        <Skeleton className="h-5 w-44 mb-2" />
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-14 w-14 text-red-500 mb-4" />
                <h3 className="text-2xl font-semibold">Failed to load users</h3>
                <p className="text-gray-500">Please try again later</p>
                <Button 
                  variant="outline" 
                  onClick={() => refetch()}
                  className="mt-6"
                >
                  Retry
                </Button>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-2xl font-semibold">No users found</h3>
                <p className="text-gray-500 mb-4">
                  {debouncedSearchTerm || roleFilter !== 'all' 
                    ? `No results for the current filters` 
                    : 'Add new users to get started'}
                </p>
                {(debouncedSearchTerm || roleFilter !== 'all') && (
                  <Button variant="outline" onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('all');
                  }}>
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-6 bg-white/90 dark:bg-slate-900/80 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-800 group">
                    <div className="flex items-center space-x-5 flex-1">
                      <Avatar className="h-14 w-14 shadow-lg">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-green-600 text-white text-xl">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex flex-wrap items-center gap-3 w-full">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{user.name}</h3>
                          {renderRoleBadge(user.role)}
                          <span className="flex-1"></span>
                          {renderStatusBadge(user.isActive)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          Last login: {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                        </p>
                      </div>
                    </div>
                    {/* Actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-50 dark:hover:bg-blue-900">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                          disabled={updateUserMutation.isPending}
                        >
                          {user.isActive ? (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => {
                            setResetPasswordUserId(user.id);
                            setResetPasswordModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => confirmDeleteUser(user.id)}
                          disabled={deleteUserMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && getTotalPages() > 1 && (
              <div className="flex justify-between items-center mt-10">
                <div className="text-sm text-gray-500">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, pagination.total)} of {pagination.total} users
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="rounded-lg"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= getTotalPages()}
                    className="rounded-lg"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add User Modal */}
        <AddUserModal
          isOpen={isAddUserModalOpen}
          onClose={closeAddUserModal}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!userToDelete} onOpenChange={cancelDeleteUser}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user
                account and remove their data from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteUserMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteUser} 
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete User'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reset Password Modal */}
        {resetPasswordModalOpen && (
          <ResetPasswordModal
            isOpen={resetPasswordModalOpen}
            onClose={() => { setResetPasswordModalOpen(false); setResetPasswordUserId(null); }}
            userId={resetPasswordUserId}
            onReset={async (password) => {
              try {
                await resetUserPasswordMutation.mutateAsync({ userId: resetPasswordUserId, password });
                setResetPasswordModalOpen(false);
                setResetPasswordUserId(null);
                refetch();
              } catch (error) {
                console.error('Error resetting password:', error, error?.response?.data);
                sonnerToast.error(`Failed to reset password. ${error?.message || ''} ${error?.response?.data?.message || ''}`);
              }
            }}
            isLoading={resetUserPasswordMutation.isPending}
          />
        )}
      </div>
    </div>
  );
};

const ResetPasswordModal = ({ isOpen, onClose, userId, onReset, isLoading }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Password</AlertDialogTitle>
          <AlertDialogDescription>
            Enter a new password for this user. It must be at least 6 characters.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="New password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={6}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword(v => !v)}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading || password.length < 6}
            onClick={() => onReset(password)}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Reset Password
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UserManagement;
