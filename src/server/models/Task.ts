import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { IUser } from './User';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface IComment {
  user: Types.ObjectId | IUser;
  text: string;
  createdAt: Date;
}

export interface ITask extends Document {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date;
  createdBy: Types.ObjectId | IUser;
  assignedTo: Types.ObjectId | IUser | null;
  tags: string[];
  comments: IComment[];
  recurringTaskId?: Types.ObjectId;
  completedAt?: Date;
  estimatedTime?: number; // In minutes
  actualTime?: number; // In minutes
  notificationsSent?: {
    dueSoon?: Date;
    overdue?: Date;
    reminders?: Date[];
  }; // Track notifications sent
  createdAt: Date;
  updatedAt: Date;
  markComplete(): Promise<ITask>;
  reassign(userId: Types.ObjectId | null): Promise<ITask>;
  addComment(userId: Types.ObjectId, text: string): Promise<ITask>;
}

const CommentSchema = new Schema<IComment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const TaskSchema: Schema<ITask> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    comments: [CommentSchema],
    recurringTaskId: {
      type: Schema.Types.ObjectId,
      ref: 'RecurringTask',
    },
    completedAt: {
      type: Date,
    },
    estimatedTime: {
      type: Number, // In minutes
      min: 0,
    },
    actualTime: {
      type: Number, // In minutes
      min: 0,
    },
    notificationsSent: {
      dueSoon: Date,
      overdue: Date,
      reminders: [Date]
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
TaskSchema.index({ createdBy: 1 });
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ recurringTaskId: 1 }); // Index for recurring tasks

// Method to mark task as complete
TaskSchema.methods.markComplete = async function (): Promise<ITask> {
  this.status = 'completed';
  this.completedAt = new Date();
  return await this.save();
};

// Method to reassign task
TaskSchema.methods.reassign = async function (userId: Types.ObjectId | null): Promise<ITask> {
  this.assignedTo = userId;
  
  // If it was completed and reassigned, set to in_progress
  if (this.status === 'completed' && userId) {
    this.status = 'in_progress';
    this.completedAt = undefined;
  }
  
  return await this.save();
};

// Method to add comment
TaskSchema.methods.addComment = async function (userId: Types.ObjectId, text: string): Promise<ITask> {
  this.comments.push({
    user: userId,
    text,
    createdAt: new Date(),
  });
  
  return await this.save();
};

const Task: Model<ITask> = mongoose.model<ITask>('Task', TaskSchema);

export default Task; 