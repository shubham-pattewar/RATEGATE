import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export async function connectDb(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  logger.info({ host: mongoose.connection.host, db: mongoose.connection.name }, 'mongodb connected');

  mongoose.connection.on('error', (err) => logger.error({ err }, 'mongodb error'));
  mongoose.connection.on('disconnected', () => logger.warn('mongodb disconnected'));
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
