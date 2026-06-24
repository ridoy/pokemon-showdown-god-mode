const path = require("path");

module.exports = {
  entry: "./src/main.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    // The content script runs in the page's MAIN world, so the bundle must not
    // leak globals or depend on a module loader. An IIFE keeps everything scoped.
    iife: true,
  },
  resolve: {
    extensions: [".js"],
  },
  performance: {
    // @smogon/calc ships a lot of dex data; the resulting bundle is large by design.
    hints: false,
  },
};
