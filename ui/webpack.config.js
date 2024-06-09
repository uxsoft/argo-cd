'use strict;';

const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProd = process.env.NODE_ENV === 'production';

console.log(`Bundling in ${isProd ? 'production' : 'development'}...`);

const config = {
    entry: './src/app/index.tsx',
    devServer: {
        overlay: false,
        hot: !isProd
    },
    output: {
        filename: '[name].[contenthash].js',
        chunkFilename: '[name].[contenthash].chunk.js',
        path: __dirname + '/../../dist/app'
    },

    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json'],
        alias: { react: require.resolve('react') },
        fallback: { fs: false }
    },
    ignoreWarnings: [{
        module: new RegExp('/node_modules/argo-ui/.*')
    }],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'esbuild-loader',
                options: {
                    loader: 'tsx',
                    target: 'es2015',
                    tsconfigRaw: require('./tsconfig.json')
                }
            },
            {
                enforce: 'pre',
                exclude: [/node_modules\/react-paginate/, /node_modules\/monaco-editor/],
                test: /\.js$/,
                use: ['esbuild-loader'],
            },
            {
                test: /\.scss$/,
                use: [{ loader: "style-loader", options: { esModule: false } }, 'raw-loader', 'sass-loader']
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader']
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
            'process.env.NODE_ONLINE_ENV': JSON.stringify(process.env.NODE_ONLINE_ENV || 'offline'),
            'process.env.HOST_ARCH': JSON.stringify(process.env.HOST_ARCH || 'amd64'),
            'process.platform': JSON.stringify('browser'),
            'SYSTEM_INFO': JSON.stringify({
                version: process.env.ARGO_VERSION || 'latest'
            })
        }),
        new HtmlWebpackPlugin({ template: 'src/app/index.html' }),
        new CopyWebpackPlugin({
            patterns: [{
                from: 'src/assets',
                to: 'assets'
            },
            {
                from: 'node_modules/argo-ui/src/assets',
                to: 'assets'
            },
            {
                from: 'node_modules/@fortawesome/fontawesome-free/webfonts',
                to: 'assets/fonts'
            },
            {
                from: 'node_modules/redoc/bundles/redoc.standalone.js',
                to: 'assets/scripts/redoc.standalone.js'
            },
            {
                from: 'node_modules/monaco-editor/min/vs/base/browser/ui/codicons/codicon',
                to: 'assets/fonts'
            }
            ]
        }),
        new MonacoWebpackPlugin({
            // https://github.com/microsoft/monaco-editor-webpack-plugin#options
            languages: ['yaml']
        }),
        new ReactRefreshWebpackPlugin()
    ],
    devServer: {
        compress: false,
        historyApiFallback: {
            disableDotRule: true
        },
        port: 4000,
        host: process.env.ARGOCD_E2E_YARN_HOST || 'localhost',
        proxy: [
            {
                context: ['/extensions', '/api', '/auth', '/swagger-ui', '/swagger.json'],
                target: process.env.ARGOCD_API_URL || 'http://localhost:8080',
                secure: false
            },
            {
                context: ['/terminal'],
                target: process.env.ARGOCD_API_URL || 'ws://localhost:8080',
                ws: true,
            },
        ]
    }
};

if (!isProd) {
    config.devtool = 'eval-source-map';
}

module.exports = config;
