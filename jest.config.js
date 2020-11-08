const packageInfo = require("./package.json");

module.exports = {
  preset: "ts-jest",
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts"],
  globals: {
    DEFINED_VERSION: packageInfo.version,
  },
  moduleFileExtensions: ["js", "json", "jsx", "ts", "tsx", "node", "d.ts"],
  moduleNameMapper: {
    "\\.(css|sass)$": "identity-obj-proxy",
  },
  transform: {
    "\\.svg$": "jest-raw-loader",
  },
};
