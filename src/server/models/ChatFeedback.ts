import mongoose, { Document, Schema, Types } from 'mongoose';
import { IUser } from './User';

export type FeedbackType = 'helpful' | 'not_helpful' | 'inaccurate' | 'inappropriate';

export interface IChatFeedback extends Document {
  user: Types.ObjectId | IUser;
  chatId: Types.ObjectId;
  messageIndex: number;
  type: FeedbackType;
  comment?: string;
  createdAt: Date;
}

const ChatFeedbackSchema = new Schema<IChatFeedback>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'ChatHistory',
      required: true,
      index: true,
    },
    messageIndex: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['helpful', 'not_helpful', 'inaccurate', 'inappropriate'],
      required: true,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for unique feedback per message
ChatFeedbackSchema.index({ chatId: 1, messageIndex: 1, user: 1 }, { unique: true });

// Register model
export const ChatFeedback = mongoose.model<IChatFeedback>('ChatFeedback', ChatFeedbackSchema);

export default ChatFeedback; 