import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { IUser } from './User';
import Task, { ITask, TaskPriority } from './Task';

// Define the frequency types for recurring tasks
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Weekday type (0-6, where 0 is Sunday)
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface IRecurringTask extends Document {
  title: string;
  description?: string;
  frequency: RecurringFrequency;
  interval: number; // e.g., every 2 days, 3 weeks, 1 month
  daysOfWeek?: Weekday[]; // For weekly tasks, which days of week (0-6)
  dayOfMonth?: number; // For monthly tasks (1-31, or -1 for last day)
  startDate: Date;
  endDate?: Date;
  maxOccurrences?: number;
  tasksGenerated: number; // Count of tasks generated so far
  skipWeekends: boolean; // Whether to skip weekend dates
  skipHolidays: boolean; // Whether to skip holidays
  skipDates: Date[]; // Specific dates to skip
  lastGeneratedDate?: Date; // Date when tasks were last generated
  nextGenerationDate?: Date; // Next date to generate tasks
  paused: boolean; // Whether the recurring task is paused
  createdBy: Types.ObjectId | IUser;
  teamId?: Types.ObjectId; // Optional team association
  
  // Task template properties
  taskTemplate: {
    title: string; // Can use variables like {{date}}, {{count}}
    description?: string;
    priority: TaskPriority;
    assignedTo?: Types.ObjectId;
    estimatedTime?: number; // In minutes
    tags: string[];
  };
  
  // Methods
  calculateNextOccurrence(fromDate?: Date): Date;
  shouldGenerateTask(date: Date): boolean;
  generateTaskData(occurrenceDate: Date): Partial<ITask>;
  pause(): Promise<IRecurringTask>;
  resume(): Promise<IRecurringTask>;
}

const RecurringTaskSchema: Schema<IRecurringTask> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: [true, 'Frequency is required']
    },
    interval: {
      type: Number,
      required: [true, 'Interval is required'],
      min: [1, 'Interval must be at least 1']
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    dayOfMonth: {
      type: Number,
      min: -1, // -1 means last day of month
      max: 31
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now
    },
    endDate: {
      type: Date
    },
    maxOccurrences: {
      type: Number,
      min: 1
    },
    tasksGenerated: {
      type: Number,
      default: 0
    },
    skipWeekends: {
      type: Boolean,
      default: false
    },
    skipHolidays: {
      type: Boolean,
      default: false
    },
    skipDates: [{
      type: Date
    }],
    lastGeneratedDate: {
      type: Date
    },
    nextGenerationDate: {
      type: Date
    },
    paused: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team'
    },
    taskTemplate: {
      title: {
        type: String,
        required: [true, 'Task template title is required'],
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
      },
      assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      estimatedTime: {
        type: Number,
        min: 0
      },
      tags: [{
        type: String,
        trim: true
      }]
    }
  },
  {
    timestamps: true
  }
);

// Method to calculate the next occurrence date based on the pattern
RecurringTaskSchema.methods.calculateNextOccurrence = function(fromDate?: Date): Date {
  const currentDate = fromDate || (this.lastGeneratedDate ? new Date(this.lastGeneratedDate) : new Date());
  let nextDate = new Date(currentDate);
  
  // Add one day to start from the day after the last generation
  nextDate.setDate(nextDate.getDate() + 1);
  nextDate.setHours(0, 0, 0, 0); // Start of day
  
  // If using days of week, find the next matching day
  if (this.frequency === 'weekly' && this.daysOfWeek && this.daysOfWeek.length) {
    // Sort days to make search easier
    const sortedDays = [...this.daysOfWeek].sort((a, b) => a - b);
    
    // Look for the next day of week that matches
    let foundDay = false;
    let loopCount = 0; // Safety counter to prevent infinite loop
    const MAX_LOOPS = 7 * this.interval; // Maximum days to check
    
    while (!foundDay && loopCount < MAX_LOOPS) {
      const currentDayOfWeek = nextDate.getDay();
      
      // Check if current day is in our list of days
      if (sortedDays.includes(currentDayOfWeek)) {
        foundDay = true;
      } else {
        // Move to next day
        nextDate.setDate(nextDate.getDate() + 1);
        loopCount++;
      }
    }
    
    // If we couldn't find a day, calculate based on interval
    if (!foundDay) {
      const startDay = new Date(this.startDate);
      const diffTime = Math.abs(nextDate.getTime() - startDay.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const intervalDays = 7 * this.interval;
      const daysToAdd = intervalDays - (diffDays % intervalDays);
      
      nextDate.setDate(nextDate.getDate() + daysToAdd);
    }
  } else {
    // Handle non-weekly frequencies
    switch (this.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + this.interval - 1); // -1 because we already added one day
        break;
        
      case 'monthly':
        // Calculate for specific day of month
        nextDate.setDate(1); // First of month
        nextDate.setMonth(nextDate.getMonth() + this.interval); // Add interval months
        
        // Set to specific day of month
        if (this.dayOfMonth) {
          if (this.dayOfMonth === -1) {
            // Last day of month
            nextDate.setMonth(nextDate.getMonth() + 1);
            nextDate.setDate(0);
          } else {
            // Specific day of month
            // Ensure we don't exceed the days in the month
            const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
            nextDate.setDate(Math.min(this.dayOfMonth, lastDayOfMonth));
          }
        }
        break;
        
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + this.interval);
        break;
    }
  }
  
  // Check if we should skip this date (weekend, holiday, or in skipDates)
  let skipped = this.shouldSkipDate(nextDate);
  let safetyCounter = 0; // Prevent infinite loops
  
  while (skipped && safetyCounter < 100) { // Maximum 100 skips to prevent endless loop
    nextDate.setDate(nextDate.getDate() + 1);
    skipped = this.shouldSkipDate(nextDate);
    safetyCounter++;
  }
  
  return nextDate;
};

// Helper method to determine if a date should be skipped
RecurringTaskSchema.methods.shouldSkipDate = function(date: Date): boolean {
  // Check if date is in skipDates
  if (this.skipDates && this.skipDates.length) {
    const skipDate = this.skipDates.find(skipDate => {
      const d = new Date(skipDate);
      return d.getFullYear() === date.getFullYear() &&
             d.getMonth() === date.getMonth() &&
             d.getDate() === date.getDate();
    });
    
    if (skipDate) {
      return true;
    }
  }
  
  // Check for weekends if skipWeekends is true
  if (this.skipWeekends) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // 0 = Sunday, 6 = Saturday
      return true;
    }
  }
  
  // Holiday check would require a more complex implementation
  // Typically would use a holiday calendar service or library
  
  return false;
};

// Method to determine if a task should be generated for a given date
RecurringTaskSchema.methods.shouldGenerateTask = function(date: Date): boolean {
  // Check if the recurring task is paused
  if (this.paused) {
    return false;
  }
  
  // Check if we've reached max occurrences
  if (this.maxOccurrences && this.tasksGenerated >= this.maxOccurrences) {
    return false;
  }
  
  // Check if date is past end date
  if (this.endDate && date > this.endDate) {
    return false;
  }
  
  // Check if date should be skipped
  if (this.shouldSkipDate(date)) {
    return false;
  }
  
  return true;
};

// Method to generate task data for a specific occurrence date
RecurringTaskSchema.methods.generateTaskData = function(occurrenceDate: Date): Partial<ITask> {
  const count = this.tasksGenerated + 1;
  
  // Format date to YYYY-MM-DD for template usage
  const formattedDate = occurrenceDate.toISOString().split('T')[0];
  
  // Process title and description with variables
  let title = this.taskTemplate.title
    .replace(/{{date}}/g, formattedDate)
    .replace(/{{count}}/g, count.toString());
    
  let description = this.taskTemplate.description
    ? this.taskTemplate.description
      .replace(/{{date}}/g, formattedDate)
      .replace(/{{count}}/g, count.toString())
    : undefined;
  
  // Return the task data
  return {
    title,
    description,
    priority: this.taskTemplate.priority,
    assignedTo: this.taskTemplate.assignedTo,
    dueDate: occurrenceDate,
    createdBy: this.createdBy,
    tags: this.taskTemplate.tags || [],
    status: 'pending'
  };
};

// Method to pause recurring task generation
RecurringTaskSchema.methods.pause = async function(): Promise<IRecurringTask> {
  this.paused = true;
  return await this.save();
};

// Method to resume recurring task generation
RecurringTaskSchema.methods.resume = async function(): Promise<IRecurringTask> {
  this.paused = false;
  
  // Recalculate the next generation date
  if (!this.nextGenerationDate || this.nextGenerationDate < new Date()) {
    this.nextGenerationDate = this.calculateNextOccurrence();
  }
  
  return await this.save();
};

// Create indexes for better performance
RecurringTaskSchema.index({ createdBy: 1 });
RecurringTaskSchema.index({ teamId: 1 });
RecurringTaskSchema.index({ nextGenerationDate: 1 });
RecurringTaskSchema.index({ paused: 1 });

const RecurringTask: Model<IRecurringTask> = mongoose.model<IRecurringTask>(
  'RecurringTask',
  RecurringTaskSchema
);

export default RecurringTask; 