# MongoDB to Supabase Migration Plan

## Current Status

- Authentication: ✅ Migrated to Supabase Auth
- Database Schema: ✅ Created in Supabase via migration file
- Client API: ✅ Updated to use Supabase client
- Database Config: ✅ Updated database.ts to use Supabase
- Package.json: ✅ Removed MongoDB dependencies

## Migration Tasks Remaining

### Server Model Updates

1. Replace Mongoose models with TypeScript interfaces that match Supabase schema:
   - User → profiles table
   - Task → tasks table
   - Team → teams table
   - CalendarEvent → calendar_events table
   - RecurringTask → recurring_tasks table
   - Notification → notifications table
   - ChatHistory → Add chat_history table to Supabase

2. Create TypeScript type definitions for all tables

### Service Layer Updates

Update the following services to use Supabase client instead of Mongoose:
- `src/server/services/analyticsService.ts`
- `src/server/services/chatService.ts`
- `src/server/services/loginService.ts` 
- `src/server/services/notificationService.ts`
- `src/server/services/notificationMonitoringService.ts`
- `src/server/services/taskSchedulerService.ts`

### Utility Scripts Updates

Update these scripts to use Supabase:
- `src/server/utils/seedData.ts`
- `src/server/utils/seedCustomAdmin.ts` 
- `src/server/utils/resetAdminPassword.ts`
- `src/server/utils/initDatabase.ts`

### Controllers Updates

Review and update all controllers in `src/server/controllers/` to use Supabase.

## Migration Approach

1. **Create Type Definitions**: For each Supabase table, create TypeScript interfaces
2. **Service Layer Migration**: Start with one service at a time, fully test before moving to the next
3. **Update API Client**: Ensure the API client is updated to handle all endpoints using Supabase
4. **Utility Scripts**: Update utility scripts last after core functionality works

## Testing Plan

1. **Authentication Flow**:
   - Test login/logout
   - Test user profile access
   - Test role-based access

2. **Data Operations**:
   - Test CRUD operations on key entities (tasks, teams, users)
   - Test data relationships

3. **Business Logic**:
   - Test task assignment workflows
   - Test notification system
   - Test calendar functionality

## Post-Migration Cleanup

1. Remove any remaining MongoDB references
2. Update documentatiZon
3. Add monitoring for Supabase-specific metrics

## Development Environment Setup

1. Ensure all developers have access to Supabase project
2. Update environment variables in `.env` files
3. Document local development setup with Supabase 