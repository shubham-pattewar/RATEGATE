import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer = null;

/**
 * Connects mongoose to a throwaway database. Uses TEST_MONGODB_URI when set
 * (e.g. a local mongod in CI), otherwise spins up mongodb-memory-server.
 */
export async function connectTestDb() {
  let uri = process.env.TEST_MONGODB_URI;
  if (!uri) {
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
  }
  await mongoose.connect(uri, { dbName: `rategate-test-${process.pid}` });
}

export async function clearTestDb() {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

export async function disconnectTestDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
