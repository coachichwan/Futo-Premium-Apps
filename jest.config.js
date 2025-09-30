module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  moduleNameMapper: {
    // Mock recharts library as it has issues rendering in JSDOM
    'recharts': '<rootDir>/__mocks__/recharts.js'
  },
};
