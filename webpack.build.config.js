// webpack.config.js
const path = require('path')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const autoprefixer = require('autoprefixer');
const fs = require('fs');

const getPackageJson = function () {
    try {
        let packageJSON

        packageJSON = fs.readFileSync('../../package.json', 'utf8')
        packageJSON = JSON.parse(packageJSON)

        if (!packageJSON.name) {
            console.log('\x1b[41mError : "name" not found in package.json.\x1b[0m')
            return
        }

        if (!packageJSON.type) {
            console.log('\x1b[41mError : "type" not found in package.json.\x1b[0m')
            return
        }

        return packageJSON;
    } catch (error) {
        console.log('\x1b[41mError : ./package.json not found or incorrect format.\x1b[0m', error)
        return null
    }
}

const packageJSON = getPackageJson();
if (!packageJSON) {
    console.log('\x1b[41mError : package.json not found\x1b[0m');
    return;
}

const version = packageJSON.version;
const versionRegex = /^[\d\.]*$/g
if (!versionRegex.test(version)) {
    console.log('\x1b[41mError : package.json version must be an integer (got : ' + packageJSON.version + ')\x1b[0m');
    return;
}

const isSection = packageJSON.type == 'section';

const componentData = {
    name: packageJSON.name,
    version: isSection ? packageJSON.version : '',
    componentName: packageJSON.name + (isSection ? '-' + packageJSON.version.replace(/[\.]/g, "-") : '')
}

module.exports = [