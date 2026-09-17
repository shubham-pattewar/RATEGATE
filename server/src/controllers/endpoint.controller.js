import * as endpointService from '../services/endpoint.service.js';

// Keep API identifiers independent of MongoDB's internal `_id` convention.
// The dashboard and proxy URLs consume the stable, string `id` property.
function serializeEndpoint(doc) {
  const endpoint = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return { ...endpoint, id: String(endpoint._id) };
}

export async function create(req, res) {
  const doc = await endpointService.createEndpoint(req.user._id, req.body);
  res.status(201).json({ endpoint: serializeEndpoint(doc) });
}

export async function list(req, res) {
  const docs = await endpointService.listEndpoints(req.user._id);
  res.json({ endpoints: docs.map(serializeEndpoint) });
}

export async function get(req, res) {
  const doc = await endpointService.getEndpoint(req.user._id, req.params.id);
  res.json({ endpoint: serializeEndpoint(doc) });
}

export async function update(req, res) {
  const doc = await endpointService.updateEndpoint(req.user._id, req.params.id, req.body);
  res.json({ endpoint: serializeEndpoint(doc) });
}

export async function remove(req, res) {
  await endpointService.deleteEndpoint(req.user._id, req.params.id);
  res.status(204).end();
}
