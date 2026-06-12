import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
  password?: string;
  googleId?: string;
  provider: "local" | "google";
  favorites: string[];
  watchedMovies: string[];
  watchlist: string[];
  ratings: { id: string; value: number }[];
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
    // Optional: accounts created via Google OAuth have no local password.
    type: String,
    required: function (this: IUser) {
      return this.provider !== "google";
    },
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  provider: {
    type: String,
    enum: ["local", "google"],
    default: "local",
  },
  favorites: {
    type: [String],
    default: []
  },
  watchedMovies: {
    type: [String],
    default: []
  },
  watchlist: {
    type: [String],
    default: []
  },
  ratings: {
    type: [
      {
        id: { type: String, required: true },
        value: { type: Number, min: 1, max: 5, required: true },
        _id: false,
      },
    ],
    default: []
  }
});

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
