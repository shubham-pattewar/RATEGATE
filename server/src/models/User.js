import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },

    // The raw API key is never persisted: only its SHA-256 hash (for lookup on
    // proxy requests) and a short prefix so the owner can recognise it in the UI.
    apiKeyHash: { type: String, required: true, unique: true },
    apiKeyPrefix: { type: String, required: true },
    apiKeyCreatedAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.apiKeyHash;
        return ret;
      },
    },
  },
);

export const User = mongoose.model('User', userSchema);
