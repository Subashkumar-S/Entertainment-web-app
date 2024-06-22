import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: String;
  fullName: string;
  email: string;
  password: string;
  favorites: string[];
  watchedMovies: string[];
}


const userSchema: Schema<IUser> = new Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  favorites: {
    type: [String],
    default: []
  },
  watchedMovies: {
    type: [String],
    default: []
  }
});

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
