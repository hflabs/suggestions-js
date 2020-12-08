const packageInfo = require("./package.json");

module.exports = {
  preset: "ts-jest",
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts"],
  coverageReporters: ["json-summary", "text"],
  globals: {
    DEFINED_VERSION: packageInfo.version,
  },
  moduleFileExtensions: ["js", "ts", "json"],
  moduleNameMapper: {
    "\\.(css|sass)$": "identity-obj-proxy",
  },
  transform: {
    "\\.svg$": "jest-raw-loader",
  },
};
