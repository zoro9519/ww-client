// webpack.config.js
const path = require('path')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const autoprefixer = require('autoprefixer');

const componentData = {
    name: process.env.npm_package_name,
    version: '',
    componentName: process.env.npm_package_name
}

module.exports = function () {
    const config = {
        name: 'manager',
        entry: './src/index.js',
        mode: 'development',
        externals: {
            'vue': 'Vue'
        },
        devtool: 'inline-source-map',
        devServer: {
            contentBase: './dist',
            "hot": true,
            headers: {
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
                "Access-Control-Allow-Origin": "*"
            }
        },
        module: {
            rules: [

                {
                    test: /\.vue$/,
                    loader: 'vue-loader'
                },
                {
                    test: /\.(js|vue)$/,
                    loader: 'string-replace-loader',
                    options: {
                        multiple: [
                            { search: '__NAME__', replace: componentData.name },
                            { search: '__VERSION__', replace: componentData.version },
                            { search: '__COMPONENT_NAME__', replace: componentData.componentName }
                        ]
                    }
                },
                // this will apply to both plain `.js` files
                // AND `<script>` blocks in `.vue` files
                {
                    test: /\.js$/,
                    loader: 'babel-loader'
                },
                // this will apply to both plain `.css` files
                // AND `<style>` blocks in `.vue` files
                {
                    test: /\.(css|scss)$/,
                    use: [
                        'vue-style-loader',
                        'css-loader',
                        {
                            loader: 'postcss-loader',
                            options: {
                                plugins: function () {
                                    return [autoprefixer]
                                }
                            }
                        },
                        'sass-loader'
                    ]
                },
                {
                    test: /\.(png|jpg|gif|svg)$/i,
                    use: [
                        {
                            loader: 'url-loader',
                            options: {
                                limit: 8192
                            }
                        }
                    ]
                }
            ]
        },
        output: {
            path: path.join(__dirname, "dist"),
            filename: "manager.js"
        },
        plugins: [
            // make sure to include the plugin for the magic
            new VueLoaderPlugin()
        ]
    }

    function findPara(param) {
        let result = '';
        process.argv.forEach((argv) => {
            if (argv.indexOf('--' + param) === -1) return;
            result = argv.split('=')[1];
        });
        return result;
    }

    let port = findPara('port');

    try {
        port = parseInt(port);
    }
    catch (e) {
        port = null;
    }

    if (port) {
        config.devServer.port = port;
        config.output.publicPath = 'https://localhost:' + port + '/';
    }
    else {
        console.log('\x1b[41mPLEASE DEFINE A PORT (ex : 8080)\x1b[0m');
        return null;
    }

    return config;
}