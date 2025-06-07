import mongoose, { Document, Schema, Types } from 'mongoose';
import { IUser } from './User';

export interface IChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IChatHistory extends Document {
  user: Types.ObjectId | IUser;
  messages: IChatMessage[];
  title: string;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for individual chat messages
const ChatMessageSchema = new Schema<IChatMessage>(
  {
    role: {
      type: String,
      enum: ['system', 'user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Schema for chat history
const ChatHistorySchema = new Schema<IChatHistory>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    messages: [ChatMessageSchema],
    title: {
      type: String,
      default: 'New Chat',
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient queries
ChatHistorySchema.index({ user: 1, createdAt: -1 });
ChatHistorySchema.index({ user: 1, lastActive: -1 });

// Register model
export const ChatHistory = mongoose.model<IChatHistory>('ChatHistory', ChatHistorySchema);

export default ChatHistory; 