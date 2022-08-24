/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    transform: {
      "^.+\\.(j|t)sx?$": "ts-jest",
    },
    transformIgnorePatterns: [
      "node_modules/(?!(node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)/.*)"
    ]
}
