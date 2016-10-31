"use strict";

const NODE_ENV = process.env.NODE_ENV || "development";

const CompressionPlugin = require("compression-webpack-plugin");

const StringReplacePlugin = require("string-replace-webpack-plugin");

const WebpackNotifierPlugin = require("webpack-notifier");

const BrowserSyncPlugin = require("browser-sync-webpack-plugin");

const CleanWebpackPlugin = require("clean-webpack-plugin");

const path = require("path");

const webpack = require("webpack");

const fs = require("fs");

const crypto = require("crypto");

const compress = require("compression");

const packagenpm = require("./package.json");

const ExtractTextPlugin = require("extract-text-webpack-plugin");

let extractHTML = new ExtractTextPlugin("[name].html");

let objBuildList = {};

/**
 * Templates
 */
objBuildList = Object.assign(
    objBuildList,
    {
        "./lib/CSDebug": ["./lib/CSDebug.ts"],
        "./dist/simple-typescript-example/index": ["./src/simple-typescript-example/index.ts"],
        "./dist/simple-javascript-example/index": ["./src/simple-typescript-example/index.ts"],
    }
);

/**
 * Plugins list
 */
let arrPlugins = [
    new WebpackNotifierPlugin(),
    new StringReplacePlugin(),
    extractHTML
];
/**
 * Add BrowserSync for development mode
 */
if (NODE_ENV == "development" || NODE_ENV == "production") {
    arrPlugins.push(
        new BrowserSyncPlugin({
            host: "localhost",
            port: 8080,
            server: {
                baseDir: ["./"],
                middleware: function (req, res, next) {
                    var gzip = compress();
                    gzip(req, res, next);
                }
            }
        })
    );
}
/**
 * Add uglifyer for production mode
 */
if (NODE_ENV == "production" || NODE_ENV == "testing") {
    arrPlugins.push(
        new webpack.optimize.UglifyJsPlugin({
            minimize: true,
            sourceMap: false,
            output: {
                comments: false
            },
            compressor: {
                warnings: false
            }
        })
    );
    arrPlugins.push(
        new CompressionPlugin({
            asset: "[path].gz[query]",
            algorithm: "gzip",
            test: /lib\/([0-9a-zA-Z-_\/]{1,})\.js$/,
            threshold: 10240,
            minRatio: 0.8
        })
    );
}
/**
 * Add additional plugins
 */
arrPlugins.push(
    new webpack.DefinePlugin({
        "process.env": {
            NODE_ENV: JSON.stringify(NODE_ENV)
        }
    })
);

arrPlugins.push(
    new CleanWebpackPlugin([
        "./dist"
    ])
);


module.exports = {
    entry: objBuildList,
    output: {
        filename: "[name].js",
        library: "CSDebug",
        libraryTarget: "umd",
        umdNamedDefine: true
    },
    externals: {
        "CSDebug": "CSDebug"
    },
    devtool: (NODE_ENV == "development" ? "inline-source-map" : (NODE_ENV == "testing" ? "inline-source-map" : "")),
    plugins: arrPlugins,
    resolve: {
        extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },
    resolveLoader: {
        root: path.join(__dirname, "node_modules"),
        extensions: ["", ".js", ".ts", ".jsx", ".tsx"]
    },
    module: {
        loaders: [
            {
                test: /\.ts(x?)$/,
                loaders: [
                    StringReplacePlugin.replace({
                        replacements: [
                            {
                                pattern: /#HASH#/gi,
                                replacement: function (string, pattern1) {
                                    return crypto.createHash("md5").update((new Date()).getTime().toString()).digest("hex");
                                }
                            },
                            {
                                pattern: /#PACKAGE_NAME#/gi,
                                replacement: function (string, pattern1) {
                                    return packagenpm.name;
                                }
                            },
                            {
                                pattern: /#PACKAGE_VERSION#/gi,
                                replacement: function (string, pattern1) {
                                    return packagenpm.version;
                                }
                            }
                        ]
                    }),
                    "babel-loader?presets[]=babel-preset-es2015-loose",
                    "ts-loader"
                ],
                exclude: /node_modules/
            },
            {
                test: /\.html/i,
                loader: extractHTML.extract(["html"])
            }
        ]
    }
};