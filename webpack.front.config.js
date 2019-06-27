// webpack.config.js
const path = require('path')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const autoprefixer = require('autoprefixer');
const fs = require('fs')

const wewebClientVersion = '1.0.30'

const componentData = {
    name: process.env.npm_package_name,
    version: '',
    componentName: process.env.npm_package_name
}

const packageJson = {
    wewebClientVersion: wewebClientVersion,
    name: process.env.npm_package_name,
    version: process.env.npm_package_version,
    type: process.env.npm_package_type,
    sectionTypes: []
}

if (packageJson.type.toLowerCase() == 'section') {
    const basePath = './src/default_data';

    //Get default data index
    try {
        packageJson.sectionTypes = fs.readFileSync(basePath + '/index.js', 'utf8');
    } catch (error) {
        console.log('\x1b[41mError : ' + basePath + '/index.js not found\x1b[0m');
        return
    }

    //Eval default data index
    try {
        packageJson.sectionTypes = eval(packageJson.sectionTypes);
        if (!packageJson.sectionTypes || !packageJson.sectionTypes.length) {
            return
        }
    } catch (error) {
        console.log('\x1b[41mError : ' + basePath + '/index.js incorrect format, or no data defined\x1b[0m');
        return
    }

    //Parse section types
    for (let sectionType of packageJson.sectionTypes) {
        if (!sectionType.name) {
            console.log('\x1b[33mWarning : name not set for ', sectionType + '\x1b[0m');
            continue;
        }

        let data;

        //Get data
        try {
            data = fs.readFileSync(basePath + '/' + sectionType.name + '/data.json');
            data = JSON.parse(data);
        } catch (error) {
            console.log('\x1b[33mWarning : ' + basePath + '/' + sectionType.name + '/data.json' + ' not found or incorrect format\x1b[0m');
            continue;
        }

        sectionType.defaultData = data;

        //Get previews
        sectionType.previews = [];
        for (let i = 0; i < 10; i++) {
            if (fs.existsSync(basePath + '/' + sectionType.name + '/preview_' + i + '.jpg')) {
                sectionType.previews.push({
                    src: basePath + '/' + sectionType.name + '/preview_' + i + '.jpg',
                    name: 'preview_' + i + '.jpg'
                });
            }
            if (fs.existsSync(basePath + '/' + sectionType.name + '/preview_' + i + '.png')) {
                sectionType.previews.push({
                    src: basePath + '/' + sectionType.name + '/preview_' + i + '.png',
                    name: 'preview_' + i + '.png'
                });
            }
        }
    }

}

fs.writeFileSync('./node_modules/weweb-client/assets/info.json', JSON.stringify(packageJson), function (err) {
    if (err) {
        throw new Error();
    }
});


module.exports = function () {

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

    const configFront = {
        name: 'front',
        entry: [
            'webpack-dev-server/client?https://localhost:' + port, // WebpackDevServer host and port
            'webpack/hot/only-dev-server', // "only" prevents reload on syntax errors
            './src/index.js'
        ],
        mode: 'development',
        externals: {
            'vue': 'Vue'
        },
        devtool: 'inline-source-map',
        devServer: {
            contentBase: './node_modules/weweb-client/assets',
            hot: true,
            headers: {
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
                "Access-Control-Allow-Origin": "*"
            },
            historyApiFallback: {
                index: 'index.html'
            }
        },
        module: {
            rules: [
                {
                    test: /\.vue$/,
                    loader: 'vue-loader'
                },
                {
                    test: /\.vue$/,
                    loader: 'weweb-strip-block',
                    options: {
                        blocks: [
                            {
                                start: 'wwManager:start',
                                end: 'wwManager:end'
                            }
                        ]
                    }
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
                        'sass-loader',
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
            filename: "front.js"
        },
        plugins: [
            // make sure to include the plugin for the magic
            new VueLoaderPlugin()
        ]
    };

    if (port) {
        configFront.devServer.port = port;
        configFront.output.publicPath = 'https://localhost:' + port + '/';
    }
    else {
        console.log('\x1b[41mPLEASE DEFINE A PORT (ex : 8080)\x1b[0m');
        return null;
    }

    return [configFront];
}