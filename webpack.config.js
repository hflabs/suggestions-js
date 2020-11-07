const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const path = require("path");
const webpack = require("webpack");
const { merge, mergeWithRules } = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const portfinder = require("portfinder-sync");
const packageInfo = require("./package.json");

const isServing = process.argv.includes("serve");
const library = "suggestions";

const config = {
  devtool: false,
  entry: {
    findById: path.resolve("./src/entrypoints/findById.ts"),
    suggest: path.resolve("./src/entrypoints/suggest.ts"),
  },
  output: {
    filename: "[name].js",
    path: path.resolve("./lib"),
    library,
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [{ loader: "ts-loader" }],
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
                localIdentName: "suggestions-[hash:8]",
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
    new webpack.DefinePlugin({
      DEFINED_VERSION: JSON.stringify(packageInfo.version),
    }),
  ],
  resolve: {
    extensions: [".ts", ".js"],
  },
};

module.exports = isServing
  ? merge(
      // Patch css-loader options
      mergeWithRules({
        module: {
          rules: {
            test: "match",
            use: {
              loader: "match",
              options: "replace",
            },
          },
        },
      })(config, {
        module: {
          rules: [
            {
              test: /\.sass$/,
              use: [
                {
                  loader: "css-loader",
                  options: {
                    modules: {
                      localIdentName: "[folder]-[name]-[local]",
                    },
                  },
                },
              ],
            },
          ],
        },
      }),
      {
        devtool: "inline-source-map",
        mode: "development",
        plugins: [
          new HtmlWebpackPlugin({
            chunks: "suggest",
            template: path.resolve("./dev/index.ejs"),
            templateParameters: { library },
          }),
        ],
        devServer: {
          contentBase: path.resolve("./lib"),
          injectClient: false,
          port: portfinder.getPort(8080),
          open: true,
        },
      }
    )
  : [
      merge(config, {
        name: "es6",
        plugins: [new CleanWebpackPlugin()],
      }),
      merge(
        // Add babel-loader for .ts files
        mergeWithRules({
          module: {
            rules: {
              test: "match",
              use: "prepend",
            },
          },
        })(config, {
          module: {
            rules: [
              {
                test: /\.ts$/,
                use: [
                  {
                    loader: "babel-loader",
                    options: {
                      plugins: [
                        [
                          "@babel/plugin-transform-runtime",
                          {
                            absoluteRuntime: false,
                            corejs: "3",
                            helpers: true,
                            regenerator: true,
                            useESModules: false,
                            version: "7.0.0-beta.0",
                          },
                        ],
                      ],
                    },
                  },
                ],
              },
            ],
          },
        }),
        {
          name: "IE",
          output: {
            filename: "[name].ie.js",
          },
        }
      ),
    ];
