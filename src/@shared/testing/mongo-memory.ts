import { MongoMemoryServer } from 'mongodb-memory-server';

export class MongoMemory {
  private instance: MongoMemoryServer;

  async makeUri(): Promise<string> {
    this.instance = await MongoMemoryServer.create();
    return this.instance.getUri();
  }

  async close(): Promise<void> {
    if (this.instance) {
      await this.instance.stop();
    }
  }
}
