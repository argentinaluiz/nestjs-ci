export class EntityNotFoundError extends Error {
  constructor(documentClass: { new (...args: any[]): any }, id: string) {
    super(`Entity ${documentClass.name} with id ${id} not found`);
    this.name = 'EntityNotFoundError';
  }
}
