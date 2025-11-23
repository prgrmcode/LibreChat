// export * from './app';
// export * from './common';
// export * from './crypto';
// export * from './schema';
// export * from './utils';
// export { createModels } from './models';
// export { createMethods } from './methods';
// export type * from './types';
// export type * from './methods';
// export { default as logger } from './config/winston';
// export { default as meiliLogger } from './config/meiliLogger';

// Export all modules first
export * from './app';
export * from './common';
export * from './crypto';
export * from './schema';
export * from './utils';

// Import the functions we need to re-export
import { createModels } from './models/index';
import { createMethods } from './methods/index';
import logger from './config/winston';
import meiliLogger from './config/meiliLogger';

// Re-export as named exports
export { createModels, createMethods, logger, meiliLogger };

// Export types
export type * from './types';
export type * from './methods';

// CRITICAL: Add a side effect that prevents tree-shaking
// This forces Rollup to include these exports
if (typeof createModels === 'undefined' || typeof createMethods === 'undefined') {
  throw new Error('Critical exports are missing');
}