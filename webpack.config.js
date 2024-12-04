const path = require('path');

module.exports = {
    entry: './app.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/dist/'
    },
    mode: 'development',
    devServer: {
        static: {
            directory: path.join(__dirname, './'),
        },
        port: 3000,
        hot: true
    }
}; 