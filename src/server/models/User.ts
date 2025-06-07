import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt, { Secret } from 'jsonwebtoken';
import config from '../config/config';

// Add notification preferences interface
export interface INotificationPreferences {
  emailDisabled?: string[]; // Array of notification types for which emails are disabled
  inAppDisabled?: string[]; // Array of notification types for which in-app notifications are disabled
  workingHours?: {
    start: string; // Format: "HH:MM" in 24h format
    end: string; // Format: "HH:MM" in 24h format
    timezone: string; // e.g., "America/New_York"
    enabledDays: number[]; // 0-6, where 0 is Sunday
  };
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role: 'admin' | 'user' | 'team_leader' | 'team_member';
  isActive: boolean;
  verificationToken?: string;
  verified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  teamId?: Types.ObjectId;
  notificationPreferences?: INotificationPreferences;
  lastLogin?: Date;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
  
  comparePassword(enteredPassword: string): Promise<boolean>;
  generateAuthToken(): string;
  generateRefreshToken(): string;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please add a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'team_leader', 'team_member'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    verificationToken: String,
    verified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
    },
    notificationPreferences: {
      emailDisabled: [String],
      inAppDisabled: [String],
      workingHours: {
        start: {
          type: String,
          default: "09:00" // 9 AM
        },
        end: {
          type: String,
          default: "17:00" // 5 PM
        },
        timezone: {
          type: String,
          default: "UTC"
        },
        enabledDays: {
          type: [Number],
          default: [1, 2, 3, 4, 5] // Monday to Friday
        }
      }
    },
    lastLogin: {
      type: Date,
    },
    refreshToken: {
      type: String,
      select: false, // Don't include in default queries
    },
  },
  {
    timestamps: true,
  }
);

// Create index for email field for faster queries
UserSchema.index({ email: 1 });

// Pre-save middleware to hash password before saving
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    console.log('Password not modified, skipping hash');
    return next();
  }

  try {
    // Don't hash already hashed passwords
    if (this.password.startsWith('$2b$') || this.password.startsWith('$2a$')) {
      console.log('Password appears to be already hashed, skipping rehash');
      return next();
    }
    
    console.log('Hashing new password');
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    console.log(`Comparing passwords - user: ${this.email}`);
    console.log(`Stored hash: ${this.password.substring(0, 20)}...`);
    
    // Use bcrypt to compare the plain text password with the hash
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log(`Password match result: ${isMatch}`);
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error);
    throw new Error('Password comparison failed');
  }
};

// Method to generate JWT auth token
UserSchema.methods.generateAuthToken = function (): string {
  const payload = {
    id: this._id,
    email: this.email,
    name: this.name,
    role: this.role,
  };
  
  const secret: Secret = config.jwtSecret;
  // Cast expiresIn to string so TypeScript accepts it
  const options: jwt.SignOptions = { 
    expiresIn: config.jwtExpire as string | number
  };
  
  return jwt.sign(payload, secret, options);
};

// Method to generate refresh token
UserSchema.methods.generateRefreshToken = function (): string {
  const payload = {
    id: this._id,
  };
  
  const secret: Secret = config.jwtRefreshSecret;
  // Cast expiresIn to string so TypeScript accepts it
  const options: jwt.SignOptions = { 
    expiresIn: config.jwtRefreshExpire as string | number 
  };
  
  const refreshToken = jwt.sign(payload, secret, options);
  
  // Save refresh token to user
  this.refreshToken = refreshToken;
  
  return refreshToken;
};

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User; 