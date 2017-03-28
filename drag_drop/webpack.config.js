var path = require("path");

module.exports = function(env) {
  return {
    entry: "./app.ts",
    devtool: "source-map",
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: "bundle.js"
    },
    resolve: {
        // Add '.ts' and '.tsx' as a resolvable extension.
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
        loaders: [
            // all files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
            { test: /\.tsx?$/, loader: "ts-loader" }
        ]
    }
  };
};
