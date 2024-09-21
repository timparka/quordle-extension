const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: "production",
  entry: {
    solver: path.resolve(__dirname, "..", "src", "solver.ts"),
    content: path.resolve(__dirname, "..", "src", "content.ts"),
    popup: path.resolve(__dirname, "..", "src", "popup.ts"),
  },
  output: {
    path: path.join(__dirname, "../dist"),
    filename: "[name].js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "./public/manifest.json", to: "./manifest.json" },
        { from: "./assets/word-bank.txt", to: "word-bank.txt" },
        { from: "public/popup.html", to: "popup.html" },
      ],
    }),
  ],
};
