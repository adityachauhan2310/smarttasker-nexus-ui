import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICalendarEvent extends Document {
  title: string;
  description?: string;
  date: Date;
  time?: string;
  duration?: number;
  type: 'meeting' | 'deadline' | 'task' | 'event' | 'maintenance' | 'audit' | 'hr';
  priority?: 'high' | 'medium' | 'low';
  impact?: 'high' | 'medium' | 'low';
  attendees?: mongoose.Types.ObjectId[];
  assigneeId?: mongoose.Types.ObjectId;
  assignedById?: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

interface CalendarEventModel extends Model<ICalendarEvent> {
  // Static methods if needed
}

const CalendarEventSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Event title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Event description cannot exceed 1000 characters']
    },
    date: {
      type: Date,
      required: [true, 'Event date is required']
    },
    time: {
      type: String,
      validate: {
        validator: function(v: string) {
          // Basic time format validation (HH:MM or HH:MM AM/PM)
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9](\s[AP]M)?$/.test(v);
        },
        message: props => `${props.value} is not a valid time format`
      }
    },
    duration: {
      type: Number,
      min: [1, 'Duration must be at least 1 minute'],
      max: [1440, 'Duration cannot exceed 24 hours (1440 minutes)']
    },
    type: {
      type: String,
      required: [true, 'Event type is required'],
      enum: {
        values: ['meeting', 'deadline', 'task', 'event', 'maintenance', 'audit', 'hr'],
        message: '{VALUE} is not a valid event type'
      },
      default: 'event'
    },
    priority: {
      type: String,
      enum: {
        values: ['high', 'medium', 'low'],
        message: '{VALUE} is not a valid priority level'
      },
      default: 'medium'
    },
    impact: {
      type: String,
      enum: {
        values: ['high', 'medium', 'low'],
        message: '{VALUE} is not a valid impact level'
      }
    },
    attendees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    status: {
      type: String,
      enum: {
        values: ['confirmed', 'tentative', 'cancelled'],
        message: '{VALUE} is not a valid event status'
      },
      default: 'confirmed'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for efficient querying
CalendarEventSchema.index({ date: 1 });
CalendarEventSchema.index({ assigneeId: 1, date: 1 });
CalendarEventSchema.index({ teamId: 1, date: 1 });
CalendarEventSchema.index({ type: 1, date: 1 });

export const CalendarEvent: CalendarEventModel = mongoose.model<ICalendarEvent, CalendarEventModel>('CalendarEvent', CalendarEventSchema);

export default CalendarEvent; 