import mongoose from 'mongoose';
import { RequestLog } from '../models/RequestLog.js';
import { getEndpoint } from './endpoint.service.js';

// ---------------------------------------------------------------------------
// Bucket configuration: given a range label, choose the MongoDB $dateTrunc
// unit and the number of milliseconds to look back.
// ---------------------------------------------------------------------------
const RANGE_CONFIG = {
  '1h':  { unit: 'minute',  bucketMs: 60_000,          lookbackMs: 60 * 60_000 },
  '6h':  { unit: 'hour',    bucketMs: 3_600_000,        lookbackMs: 6 * 3_600_000 },
  '24h': { unit: 'hour',    bucketMs: 3_600_000,        lookbackMs: 24 * 3_600_000 },
  '7d':  { unit: 'day',     bucketMs: 24 * 3_600_000,   lookbackMs: 7 * 24 * 3_600_000 },
};

const VALID_RANGES = Object.keys(RANGE_CONFIG);

/**
 * Returns a timeseries of request counts (allowed vs blocked) plus the top-10
 * clients by total request count for the given endpoint and time range.
 *
 * The caller must already have confirmed ownership of the endpoint.
 *
 * @param {string} userId         The requesting user's id (for ownership check)
 * @param {string} endpointId     The endpoint to query
 * @param {string} [range='24h']  One of '1h', '6h', '24h', '7d'
 */
export async function getEndpointStats(userId, endpointId, range = '24h') {
  if (!VALID_RANGES.includes(range)) {
    range = '24h';
  }

  // Confirm the endpoint exists and belongs to this user (throws 404/403 otherwise).
  await getEndpoint(userId, endpointId);

  const { unit, lookbackMs } = RANGE_CONFIG[range];
  const since = new Date(Date.now() - lookbackMs);
  const oid = new mongoose.Types.ObjectId(endpointId);

  // -------------------------------------------------------------------------
  // Pipeline 1 — time-bucketed request volume.
  //
  // $dateTrunc rounds each document's timestamp down to the nearest bucket
  // boundary (minute / hour / day).  We then group and count allowed vs blocked
  // per bucket, sort ascending so the chart is left-to-right in time order.
  // -------------------------------------------------------------------------
  const timeseriesPromise = RequestLog.aggregate([
    {
      $match: {
        endpointId: oid,
        timestamp: { $gte: since },
      },
    },
    {
      $group: {
        _id: {
          $dateTrunc: { date: '$timestamp', unit },
        },
        total:   { $sum: 1 },
        allowed: {
          $sum: { $cond: [{ $eq: ['$outcome', 'allowed'] }, 1, 0] },
        },
        blocked: {
          $sum: { $cond: [{ $eq: ['$outcome', 'blocked'] }, 1, 0] },
        },
        errors: {
          $sum: { $cond: [{ $eq: ['$outcome', 'upstream_error'] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        timestamp: '$_id',
        total: 1,
        allowed: 1,
        blocked: 1,
        errors: 1,
      },
    },
  ]);

  // -------------------------------------------------------------------------
  // Pipeline 2 — top clients by request count.
  // -------------------------------------------------------------------------
  const topClientsPromise = RequestLog.aggregate([
    {
      $match: {
        endpointId: oid,
        timestamp: { $gte: since },
      },
    },
    {
      $group: {
        _id: '$clientId',
        total:   { $sum: 1 },
        allowed: { $sum: { $cond: [{ $eq: ['$outcome', 'allowed'] }, 1, 0] } },
        blocked: { $sum: { $cond: [{ $eq: ['$outcome', 'blocked'] }, 1, 0] } },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        clientId: '$_id',
        total: 1,
        allowed: 1,
        blocked: 1,
      },
    },
  ]);

  // -------------------------------------------------------------------------
  // Pipeline 3 — summary totals for the period (used by the stats bar).
  // -------------------------------------------------------------------------
  const summaryPromise = RequestLog.aggregate([
    {
      $match: {
        endpointId: oid,
        timestamp: { $gte: since },
      },
    },
    {
      $group: {
        _id: null,
        total:          { $sum: 1 },
        allowed:        { $sum: { $cond: [{ $eq: ['$outcome', 'allowed'] }, 1, 0] } },
        blocked:        { $sum: { $cond: [{ $eq: ['$outcome', 'blocked'] }, 1, 0] } },
        avgLatencyMs:   { $avg: '$latencyMs' },
      },
    },
  ]);

  const [timeseries, topClients, [summary]] = await Promise.all([
    timeseriesPromise,
    topClientsPromise,
    summaryPromise,
  ]);

  return {
    range,
    since: since.toISOString(),
    summary: summary
      ? {
          total: summary.total,
          allowed: summary.allowed,
          blocked: summary.blocked,
          blockRate: summary.total > 0 ? Number((summary.blocked / summary.total).toFixed(4)) : 0,
          avgLatencyMs: summary.avgLatencyMs != null ? Math.round(summary.avgLatencyMs) : null,
        }
      : { total: 0, allowed: 0, blocked: 0, blockRate: 0, avgLatencyMs: null },
    timeseries,
    topClients,
  };
}

export { VALID_RANGES };
