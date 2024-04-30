/* eslint-env node */
const webpack = require("webpack");
const { styles } = require("@ckeditor/ckeditor5-dev-utils");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
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
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: styles.getPostCssConfig({
                themeImporter: {
                  themePath: require.resolve("@ckeditor/ckeditor5-theme-lark"),
                },
                minify: true,
              }),
            },
          },
        ],
      },
      {
        include: /@ckeditor/,
        test: /\.svg$/,
        use: ["raw-loader"],
      },
    ],
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
    new webpack.NormalModuleReplacementPlugin(
      /bold\.svg/,
      "!raw-loader!/node_modules/@zendeskgarden/svg-icons/src/12/bold-stroke.svg",
    ),
    new webpack.NormalModuleReplacementPlugin(
      /italic\.svg/,
      "!raw-loader!/node_modules/@zendeskgarden/svg-icons/src/12/italic-stroke.svg",
    ),
    new webpack.NormalModuleReplacementPlugin(
      /code\.svg/,
      "!raw-loader!/node_modules/@zendeskgarden/svg-icons/src/12/terminal-cli-stroke.svg",
    ),
    new webpack.NormalModuleReplacementPlugin(
      /codeblock\.svg/,
      "!raw-loader!/node_modules/@zendeskgarden/svg-icons/src/12/terminal-window-stroke.svg",
    ),
    new webpack.NormalModuleReplacementPlugin(
      /link\.svg/,
      "!raw-loader!/node_modules/@zendeskgarden/svg-icons/src/12/link-stroke.svg",
    ),
    new webpack.NormalModuleReplacementPlugin(
      /bulletedlist\.svg/,
      "!raw-loader!/node_modules/@zendeskgarden/svg-icons/src/12/list-bullet-stroke.svg",
    ),
    new webpack.NormalModuleReplacementPlugin(
      /numberedlist\.svg/,
      "!raw-loader!/node_modules/@zendeskgarden/svg-icons/src/12/list-number-stroke.svg",
    ),
    new webpack.NormalModuleReplacementPlugin(
      /upload\.svg/,
      "!raw-loader!/node_modules/@zendeskgarden/svg-icons/src/12/image-stroke.svg",
    ),
    new webpack.NormalModuleReplacementPlugin(
      /quote\.svg/,
      "!raw-loader!/node_modules/@zendeskgarden/svg-icons/src/12/quote-stroke.svg",
    ),
    new webpack.NormalModuleReplacementPlugin(
      /undo\.svg/,
      "!raw-loader!/node_modules/@zendeskgarden/svg-icons/src/12/edit-undo-stroke.svg",
    ),
    new webpack.NormalModuleReplacementPlugin(
      /redo\.svg/,
      "!raw-loader!/node_modules/@zendeskgarden/svg-icons/src/12/edit-redo-stroke.svg",
    ),
  ],
  optimization: {
    minimize: true,
    minimizer: [
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
};
