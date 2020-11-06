const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const portfinder = require("portfinder-sync");
const packageInfo = require("./package.json");

const isDevelopment = process.argv.includes("serve");
const library = "suggestions";

module.exports = {
  devtool: isDevelopment ? "inline-source-map" : false,
  entry: {
    main: path.resolve("./src/index.ts"),
  },
  output: {
    filename: "index.js",
    path: path.resolve("./lib"),
    library,
  },
  mode: isDevelopment ? "development" : "production",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: { loader: "ts-loader" },
      },
      {
        test: /\.sass$/,
        use: [
          {
            loader: "style-loader",
            options: {
              injectType: "singletonStyleTag",
            },
          },
          {
            loader: "css-loader",
            options: {
              modules: {
                localIdentName: isDevelopment
                  ? "[folder]-[name]-[local]"
                  : "sug-[hash]",
              },
            },
          },
          {
            loader: "sass-loader",
          },
        ],
      },
      {
        test: /\.svg$/,
        use: [{ loader: "raw-loader" }],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      DEFINED_VERSION: JSON.stringify(packageInfo.version),
    }),
    isDevelopment &&
      new HtmlWebpackPlugin({
        template: path.resolve("./dev/index.ejs"),
        templateParameters: { library },
      }),
  ].filter(Boolean),
  resolve: {
    extensions: [".ts", ".js"],
  },

  devServer: {
    contentBase: path.resolve("./lib"),
    injectClient: false,
    port: portfinder.getPort(8080),
    open: true,
  },
};
