import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser } from './User';

export interface ITeam extends Document {
  name: string;
  description: string;
  leader: mongoose.Types.ObjectId;
  coLeaders: mongoose.Types.ObjectId[];
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  addMember(userId: mongoose.Types.ObjectId): Promise<ITeam>;
  removeMember(userId: mongoose.Types.ObjectId): Promise<ITeam>;
}

interface TeamModel extends Model<ITeam> {
  // Static methods if needed
}

const TeamSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [100, 'Team name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Team description cannot exceed 500 characters']
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Team leader is required']
    },
    coLeaders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add a virtual field to get member count
TeamSchema.virtual('memberCount').get(function (this: ITeam) {
  return this.members?.length || 0;
});

// Add a virtual field to get leaders count (primary + co-leaders)
TeamSchema.virtual('leaderCount').get(function (this: ITeam) {
  return (this.coLeaders?.length || 0) + 1; // +1 for the primary leader
});

// Method to add a member to the team
TeamSchema.methods.addMember = async function(userId: mongoose.Types.ObjectId): Promise<ITeam> {
  // Don't add if already in team
  if (this.members.some(member => member.toString() === userId.toString())) {
    return this;
  }
  
  this.members.push(userId);
  await this.save();
  return this;
};

// Method to remove a member from the team
TeamSchema.methods.removeMember = async function(userId: mongoose.Types.ObjectId): Promise<ITeam> {
  this.members = this.members.filter(member => member.toString() !== userId.toString());
  await this.save();
  return this;
};

// Compound index to optimize team queries
TeamSchema.index({ leader: 1, createdAt: -1 });
TeamSchema.index({ name: 'text' });

export const Team: TeamModel = mongoose.model<ITeam, TeamModel>('Team', TeamSchema);

export default Team; 