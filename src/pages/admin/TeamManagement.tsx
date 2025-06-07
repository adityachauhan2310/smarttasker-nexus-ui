import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Users, Target, Search, Loader2, AlertCircle } from 'lucide-react';
import { useTeams } from '@/hooks/useApi';
import { Input } from '@/components/ui/input';
import CreateTeamModal from '@/components/modals/CreateTeamModal.jsx';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const TeamManagement = () => {
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: teamsData, isLoading, isError } = useTeams({
    page, 
    limit: pageSize,
    search: debouncedSearchTerm.trim() !== '' ? debouncedSearchTerm : undefined
  });

  const teams = teamsData?.data?.teams || [];
  const pagination = teamsData?.pagination;

  const openCreateTeamModal = () => setIsCreateTeamModalOpen(true);
  const closeCreateTeamModal = () => setIsCreateTeamModalOpen(false);

  // Function to format date in a readable format
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage teams across your organization
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          onClick={openCreateTeamModal}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative flex-1 max-w-lg">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search teams..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        // Loading skeletons
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-40 mb-2" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
                <div className="flex space-x-2 pt-2">
                  <Skeleton className="h-8 w-full rounded-lg" />
                  <Skeleton className="h-8 w-full rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium">Failed to load teams</h3>
          <p className="text-gray-500">Please try again later</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No teams found</h3>
          <p className="text-gray-500 mb-4">
            {debouncedSearchTerm ? `No results for "${debouncedSearchTerm}"` : 'Create a team to get started'}
          </p>
          {debouncedSearchTerm && (
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    active
                  </Badge>
                </div>
                <CardDescription>{team.description || 'No description'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Team Leader */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-green-600 text-white text-sm">
                      {team.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Team Leader
                    </p>
                    <p className="text-xs text-gray-500">
                      Created: {formatDate(team.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Team Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-2">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {team.memberIds ? team.memberIds.length : 0}
                    </div>
                    <div className="text-xs text-gray-500">Members</div>
                  </div>
                  <div className="p-2">
                    <div className="flex items-center justify-center mb-1">
                      <Target className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      -
                    </div>
                    <div className="text-xs text-gray-500">Active</div>
                  </div>
                  <div className="p-2">
                    <div className="flex items-center justify-center mb-1">
                      <Target className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      -
                    </div>
                    <div className="text-xs text-gray-500">Done</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Team
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit Team
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-500">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, pagination.total)} of {pagination.total} teams
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={closeCreateTeamModal}
      />
    </div>
  );
};

export default TeamManagement;
