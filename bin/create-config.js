#! /usr/bin/env node
const fs = require('fs');

if (!fs.existsSync('./package.json')) {
    console.log('\x1b[41mError : "./package.json" was not found.\x1b[0m');
    return;
}

let package = fs.readFileSync('./package.json');

try {
    package = JSON.parse(package);
} catch (error) {
    console.log('\x1b[41mError : unable to parse "./package.json".\x1b[0m');
    return;
}

const types = ['section', 'wwobject', 'plugin'];
if (!package.type) {
    console.log('\x1b[41mError : "type" not present in package.json.\x1b[0m');
    console.log('\x1b[41mShould be one of : "section", "wwobject", "plugin".\x1b[0m');
    return;
}
if (types.indexOf(package.type.toLowerCase()) === -1) {
    console.log('\x1b[41mError : "type" in package.json should be one of : "section", "wwobject", "plugin".\x1b[0m');
    return;
}



if (fs.existsSync('./ww-config.json')) {
    console.log('\x1b[44m"./ww-config.js" already exists.\x1b[0m');
}
else {
    if (package.type.toLowerCase() == "wwobject") {
        fs.writeFileSync("./ww-config.json",
            `{
    "componentPath": "./src/wwObject.vue",
    "content": {
        "type": "${package.name}",
        "data": {
        }
    },
    "upsales": {
    },
    "cmsOptions": {
    }
}`);
    }
    else {
        fs.writeFileSync("./ww-config.json",
            `{
    "componentPath": "./src/section.vue"
}`);
    }
}