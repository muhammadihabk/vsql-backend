import mongoose from 'mongoose';

export class DuplicateKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateKeyError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function handleDBErrors(error: any, entityName: string) {
  console.log('DB error', error);
  if (error.code === 11000) {
    throw new DuplicateKeyError(`${entityName} already exists`);
  }
  if (error instanceof mongoose.Error.ValidationError) {
    throw new ValidationError('Validation error');
  }
}
