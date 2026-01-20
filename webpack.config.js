/* eslint-env node */
const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = (env, argv) => ({
  entry: "./src/index.js",
  output: {
    filename: "main.js",
    libraryTarget: "umd",
    library: "HelpCenterWysiwyg",
    chunkFormat: false,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: "style-loader",
            options: {
              injectType: "singletonStyleTag",
              attributes: {
                "data-cke": true,
              },
            },
          },
          {
            loader: "css-loader",
          },
        ],
      },
      {
        include: /@ckeditor|@zendeskgarden/,
        test: /\.svg$/,
        use: ["raw-loader"],
      },
    ],
  },
  resolve: {
    alias: {
      "@ckeditor/ckeditor5-icons/dist/index.js": path.resolve(
        __dirname,
        "./icon-overrides/src/index.js",
      ),
      "@ckeditor/ckeditor5-icons-original": "@ckeditor/ckeditor5-icons",
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.CKEDITOR_LICENSE_KEY_PRODUCTION": JSON.stringify(
        process.env.CKEDITOR_LICENSE_KEY_PRODUCTION,
      ),
      "process.env.CKEDITOR_LICENSE_KEY_DEVELOPMENT": JSON.stringify(
        process.env.CKEDITOR_LICENSE_KEY_DEVELOPMENT,
      ),
    }),
    new CopyPlugin({
      patterns: [{ from: "LICENSE.md" }],
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      argv.mode === "production" &&
        new TerserPlugin({
          extractComments: false,
          terserOptions: {
            format: {
              comments: false,
            },
          },
        }),
    ],
  },
});
