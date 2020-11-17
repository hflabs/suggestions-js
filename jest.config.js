const packageInfo = require("./package.json");

module.exports = {
  preset: "ts-jest",
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts"],
  coverageReporters: ["json-summary"],
  globals: {
    DEFINED_VERSION: packageInfo.version,
  },
  moduleFileExtensions: ["ts", "d.ts", "js", "json"],
  moduleNameMapper: {
    "\\.(css|sass)$": "identity-obj-proxy",
  },
  transform: {
    "\\.svg$": "jest-raw-loader",
  },
};
