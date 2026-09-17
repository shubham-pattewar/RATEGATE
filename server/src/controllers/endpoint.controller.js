import * as endpointService from '../services/endpoint.service.js';

export async function create(req, res) {
  const doc = await endpointService.createEndpoint(req.user._id, req.body);
  res.status(201).json({ endpoint: doc });
}

export async function list(req, res) {
  const docs = await endpointService.listEndpoints(req.user._id);
  res.json({ endpoints: docs });
}

export async function get(req, res) {
  const doc = await endpointService.getEndpoint(req.user._id, req.params.id);
  res.json({ endpoint: doc });
}

export async function update(req, res) {
  const doc = await endpointService.updateEndpoint(req.user._id, req.params.id, req.body);
  res.json({ endpoint: doc });
}

export async function remove(req, res) {
  await endpointService.deleteEndpoint(req.user._id, req.params.id);
  res.status(204).end();
}
