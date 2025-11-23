module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  roots: ['<rootDir>'],
  coverageDirectory: 'coverage',
  testTimeout: 30000, // 30 seconds timeout for all tests
  setupFiles: [
    './test/jestSetup.js',
    './test/__mocks__/logger.js',
    './test/__mocks__/fetchEventSource.js',
  ],
  moduleNameMapper: {
    '~/(.*)': '<rootDir>/$1',
    '~/data/auth.json': '<rootDir>/__mocks__/auth.mock.json',
    '^openid-client/passport$': '<rootDir>/test/__mocks__/openid-client-passport.js', // Mock for the passport strategy part
    '^openid-client$': '<rootDir>/test/__mocks__/openid-client.js',
  },
  transformIgnorePatterns: ['/node_modules/(?!(openid-client|oauth4webapi|jose)/).*/'],

  // Explicitly tell Jest where to find modules
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Ensure proper module resolution
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/__tests__/**',
  ],
};
