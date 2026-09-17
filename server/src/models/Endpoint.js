import mongoose from 'mongoose';

export const RATE_LIMIT_ALGORITHMS = ['sliding_window'];

export const RATE_LIMIT_BOUNDS = {
  limit: { min: 1, max: 1_000_000 },
  windowMs: { min: 1_000, max: 24 * 60 * 60 * 1_000 },
};

const rateLimitSchema = new mongoose.Schema(
  {
    limit: {
      type: Number,
      required: true,
      min: RATE_LIMIT_BOUNDS.limit.min,
      max: RATE_LIMIT_BOUNDS.limit.max,
    },
    windowMs: {
      type: Number,
      required: true,
      min: RATE_LIMIT_BOUNDS.windowMs.min,
      max: RATE_LIMIT_BOUNDS.windowMs.max,
    },
    algorithm: {
      type: String,
      enum: RATE_LIMIT_ALGORITHMS,
      default: 'sliding_window',
    },
  },
  { _id: false },
);

const endpointSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    targetUrl: { type: String, required: true, trim: true },
    rateLimit: { type: rateLimitSchema, required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

endpointSchema.index({ userId: 1, createdAt: -1 });

export const Endpoint = mongoose.model('Endpoint', endpointSchema);
