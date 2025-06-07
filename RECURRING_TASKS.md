# Recurring Tasks System

This document explains the recurring task generation system implemented in SmartTasker.

## Overview

The recurring task system allows users to define task patterns that automatically generate new tasks at specified intervals. These patterns can be customized with various options including frequency, skip conditions, and task templates.

## Key Features

- **Multiple Frequencies**: Daily, weekly, monthly, and yearly recurring patterns
- **Smart Scheduling**: Skip weekends, holidays, or specific dates
- **Templated Tasks**: Define a task template once and auto-generate instances
- **Flexible Controls**: Pause, resume, or modify patterns without affecting existing tasks
- **Advanced Options**: Support for end dates, maximum occurrences, and variable intervals

## Recurring Task Pattern Definition

A recurring task pattern contains:

| Field | Description | Example |
|-------|-------------|---------|
| `title` | Name of the recurring pattern | "Weekly Team Meeting" |
| `description` | Description of the pattern | "Regular team sync meetings" |
| `frequency` | How often tasks repeat | "weekly" |
| `interval` | Units between recurrences | 1 (every week), 2 (every other week) |
| `daysOfWeek` | For weekly patterns, which days | [1, 3] (Monday and Wednesday) |
| `dayOfMonth` | For monthly patterns, which day | 15 (15th of month), -1 (last day) |
| `startDate` | When to start generating | "2023-05-01" |
| `endDate` | Optional date to stop | "2023-12-31" |
| `maxOccurrences` | Optional limit to generations | 10 (generate 10 times then stop) |
| `skipWeekends` | Whether to skip weekend dates | true/false |
| `skipHolidays` | Whether to skip holidays | true/false |
| `skipDates` | Specific dates to skip | ["2023-07-04", "2023-11-24"] |
| `taskTemplate` | Template for generated tasks | See task template section |

## Task Template

The task template defines the properties each generated task will have:

```json
{
  "title": "Meeting {{date}}",
  "description": "Team sync meeting #{{count}}",
  "priority": "medium",
  "assignedTo": "userId",
  "estimatedTime": 60,
  "tags": ["meeting", "team"]
}
```

### Template Variables

- `{{date}}`: Replaced with the occurrence date (YYYY-MM-DD)
- `{{count}}`: Replaced with the task number (1, 2, 3...)

## Example Patterns

### 1. Daily Standup Meeting

```json
{
  "title": "Daily Standup",
  "frequency": "daily",
  "interval": 1,
  "skipWeekends": true,
  "startDate": "2023-06-01",
  "taskTemplate": {
    "title": "Daily Standup {{date}}",
    "description": "15-minute team sync meeting",
    "priority": "medium",
    "estimatedTime": 15
  }
}
```

### 2. Bi-weekly Team Meeting

```json
{
  "title": "Team Meeting",
  "frequency": "weekly",
  "interval": 2,
  "daysOfWeek": [2], // Tuesday
  "startDate": "2023-06-01",
  "taskTemplate": {
    "title": "Team Meeting {{date}}",
    "description": "Full team sync #{{count}}",
    "priority": "high",
    "estimatedTime": 60
  }
}
```

### 3. Monthly Report

```json
{
  "title": "Monthly Report",
  "frequency": "monthly",
  "interval": 1,
  "dayOfMonth": -1, // Last day of month
  "skipWeekends": true,
  "startDate": "2023-06-01",
  "taskTemplate": {
    "title": "Prepare Monthly Report for {{date}}",
    "description": "Monthly progress report #{{count}}",
    "priority": "high",
    "estimatedTime": 120
  }
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recurring-tasks` | List all recurring task patterns |
| GET | `/api/recurring-tasks/:id` | Get a specific recurring task pattern |
| POST | `/api/recurring-tasks` | Create a new recurring task pattern |
| PUT | `/api/recurring-tasks/:id` | Update a recurring task pattern |
| DELETE | `/api/recurring-tasks/:id` | Delete a recurring task pattern |
| PUT | `/api/recurring-tasks/:id/pause` | Pause a recurring task pattern |
| PUT | `/api/recurring-tasks/:id/resume` | Resume a paused pattern |
| POST | `/api/recurring-tasks/:id/generate` | Generate tasks immediately |
| GET | `/api/recurring-tasks/:id/stats` | Get pattern statistics |
| POST | `/api/recurring-tasks/:id/skip-date` | Add a date to skip |
| DELETE | `/api/recurring-tasks/:id/skip-date/:dateId` | Remove a skip date |

## Task Generation Process

The system generates tasks through the following process:

1. A scheduled job runs at regular intervals (default: every 15 minutes)
2. The job queries for recurring patterns with `nextGenerationDate` in the past
3. For each pattern, it calculates the next occurrence date based on the pattern rules
4. It checks if a task should be generated for that date (not skipped, not past end date)
5. If a task should be generated, it creates a new task using the template
6. It updates the recurring pattern with the new `nextGenerationDate` and increments `tasksGenerated`

## Handling Special Cases

### Skip Logic

The system can skip task generation for:
- Weekends (Saturday/Sunday)
- Holidays (configurable)
- Specific dates listed in the pattern

### End Conditions

A recurring pattern stops generating tasks when:
- The current date is past the `endDate` (if specified)
- The number of tasks generated reaches `maxOccurrences` (if specified)
- The pattern is manually paused

### Pattern Modifications

When a recurring pattern is modified:
- Only future tasks are affected
- Already generated tasks remain unchanged
- The `nextGenerationDate` is recalculated if frequency-related fields change

## Timezone Handling

All dates are stored in UTC. When calculating occurrence dates, the system uses the server's timezone. For production use, consider implementing explicit timezone settings in the recurring pattern definition. 