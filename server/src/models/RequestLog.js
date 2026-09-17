import mongoose from 'mongoose';
import { env } from '../config/env.js';

export const REQUEST_OUTCOMES = ['allowed', 'blocked', 'upstream_error', 'unauthorized'];

const requestLogSchema = new mongoose.Schema(
  {
    endpointId: { type: mongoose.Schema.Types.ObjectId, ref: 'Endpoint', required: true },
    // Denormalised owner id so dashboard queries never need a join.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clientId: { type: String, required: true },
    clientIp: { type: String },
    method: { type: String, required: true },
    path: { type: String, required: true },
    outcome: { type: String, enum: REQUEST_OUTCOMES, required: true },
    statusCode: { type: Number, required: true },
    latencyMs: { type: Number },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  { versionKey: false },
);

requestLogSchema.index({ endpointId: 1, timestamp: -1 });
requestLogSchema.index({ endpointId: 1, clientId: 1, timestamp: -1 });
requestLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: env.LOG_RETENTION_DAYS * 24 * 60 * 60 });

export const RequestLog = mongoose.model('RequestLog', requestLogSchema);
