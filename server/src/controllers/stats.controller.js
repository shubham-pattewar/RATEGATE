import { getEndpointStats } from '../services/stats.service.js';

export async function stats(req, res) {
  const { range } = req.query;
  const data = await getEndpointStats(req.user._id, req.params.id, range);
  res.json(data);
}
