import mongoose, { Document, Schema, Types } from 'mongoose';
import { IUser } from './User';
import { ITeam } from './Team';

// Interface for different metric types
export interface IMetricData {
  name: string;
  value: number;
  unit?: string; // e.g., "percent", "days", "count"
  metadata?: Record<string, any>;
}

// Interface for time series data points
export interface ITimeSeriesPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

// Interface for analytics data document
export interface IAnalyticsData extends Document {
  user?: Types.ObjectId | IUser;
  team?: Types.ObjectId | ITeam;
  type: 'user' | 'team' | 'system';
  category: 'tasks' | 'performance' | 'productivity' | 'engagement' | 'workload' | 'trends';
  metrics: IMetricData[];
  timeSeries?: {
    name: string;
    points: ITimeSeriesPoint[];
    interval: 'hourly' | 'daily' | 'weekly' | 'monthly';
  }[];
  generatedAt: Date;
  validUntil: Date; // Used for cache invalidation
  createdAt: Date;
  updatedAt: Date;
}

// Schema for individual metric data
const MetricDataSchema = new Schema<IMetricData>(
  {
    name: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    unit: String,
    metadata: Schema.Types.Mixed,
  },
  { _id: false }
);

// Schema for time series data points
const TimeSeriesPointSchema = new Schema<ITimeSeriesPoint>(
  {
    timestamp: {
      type: Date,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    label: String,
  },
  { _id: false }
);

// Schema for time series collection
const TimeSeriesSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    points: [TimeSeriesPointSchema],
    interval: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly'],
      default: 'daily',
    },
  },
  { _id: false }
);

// Main schema for analytics data
const AnalyticsDataSchema = new Schema<IAnalyticsData>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      index: true,
    },
    type: {
      type: String,
      enum: ['user', 'team', 'system'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['tasks', 'performance', 'productivity', 'engagement', 'workload', 'trends'],
      required: true,
      index: true,
    },
    metrics: [MetricDataSchema],
    timeSeries: [TimeSeriesSchema],
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    validUntil: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound indexes for efficient queries
AnalyticsDataSchema.index({ user: 1, type: 1, category: 1, generatedAt: -1 });
AnalyticsDataSchema.index({ team: 1, type: 1, category: 1, generatedAt: -1 });
AnalyticsDataSchema.index({ type: 1, category: 1, generatedAt: -1 });

// Register model
export const AnalyticsData = mongoose.model<IAnalyticsData>('AnalyticsData', AnalyticsDataSchema);

export default AnalyticsData; 