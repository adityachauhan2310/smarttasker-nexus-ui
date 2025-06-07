import mongoose, { Document, Schema, Types } from 'mongoose';
import { IUser } from './User';

// Define notification types
export type NotificationType = 
  'TaskAssigned' | 
  'TaskDue' |
  'TaskOverdue' |
  'MentionedInComment' |
  'TeamChanged' |
  'RecurringTaskGenerated' |
  'TeamMemberAdded' |
  'TeamMemberRemoved' |
  'TeamLeaderChanged';

// Define notification priority levels
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// Reference types for polymorphic references
export type ReferenceType = 'Task' | 'Team' | 'User' | 'Comment' | 'RecurringTask';

// Interface for notification references (polymorphic)
export interface INotificationReference {
  refType: ReferenceType;
  refId: Types.ObjectId;
}

// Base notification interface
export interface INotification extends Document {
  user: Types.ObjectId | IUser;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  readAt?: Date;
  reference?: INotificationReference; // Polymorphic reference
  relatedRefs?: INotificationReference[]; // Additional related references
  data?: Record<string, any>; // Additional data specific to notification type
  emailSent: boolean;
  emailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  markAsRead(): Promise<INotification>;
}

// Reference schema for polymorphic references
const NotificationReferenceSchema = new Schema({
  refType: {
    type: String,
    enum: ['Task', 'Team', 'User', 'Comment', 'RecurringTask'],
    required: true
  },
  refId: {
    type: Schema.Types.ObjectId,
    required: true
  }
}, { _id: false });

// Create notification schema
const NotificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: [
        'TaskAssigned',
        'TaskDue',
        'TaskOverdue',
        'MentionedInComment',
        'TeamChanged',
        'RecurringTaskGenerated',
        'TeamMemberAdded',
        'TeamMemberRemoved',
        'TeamLeaderChanged'
      ],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date
    },
    reference: {
      type: NotificationReferenceSchema
    },
    relatedRefs: [NotificationReferenceSchema],
    data: {
      type: Schema.Types.Mixed
    },
    emailSent: {
      type: Boolean,
      default: false
    },
    emailSentAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Method to mark notification as read
NotificationSchema.methods.markAsRead = async function(): Promise<INotification> {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// Create indexes for efficient queries
NotificationSchema.index({ user: 1, createdAt: -1 }); // For user's notification feed
NotificationSchema.index({ user: 1, read: 1 }); // For unread count
NotificationSchema.index({ 'reference.refType': 1, 'reference.refId': 1 }); // For finding notifications related to a specific entity
NotificationSchema.index({ emailSent: 1, priority: 1 }); // For finding notifications to send emails for

// Register model
export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification; 