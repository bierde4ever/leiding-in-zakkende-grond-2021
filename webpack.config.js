const path = require("path")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")

let mode = "development"
let target = "web"
let devtool = "source-map"

if (process.env.NODE_ENV === "production") {
  mode = "production"
  target = "browserslist"
  devtool = "hidden-source-map" // set to undefined if no source map must be generated
}

module.exports = {
  mode: mode,
  target: target,
  output: {
    filename: "[name].[contenthash].bundle.js",
    path: path.resolve(__dirname, "dist"),
  },

  entry: {
    main: "./src/app.ts",
  },

  module: {
    rules: [
      {
        test: /\.(s[ac]|c)ss$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader", "sass-loader"],
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },

  //externals: {
  //    jquery: "jQuery",
  //  },

  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },

  plugins: [
    // Clean the build directory before each build.
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
  ],
  devtool: devtool,
  devServer: {
    contentBase: "./dist",
    hot: true,
  },
}
