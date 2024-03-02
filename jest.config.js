module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/app/$1",
    },
    roots: ['<rootDir>/app/lib/models'],
};
