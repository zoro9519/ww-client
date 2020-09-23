#! /usr/bin/env node

const fs = require("fs");

//get package.json
let package = fs.readFileSync("./package.json");

try {
    package = JSON.parse(package);
} catch (error) {
    console.log('\x1b[41mError : unable to parse "./package.json".\x1b[0m');
    return;
}

const types = ["section", "wwobject", "plugin"];
if (!package.type) {
    console.log('\x1b[41mError : "type" not present in package.json.\x1b[0m');
    console.log('\x1b[41mShould be one of : "section", "wwobject", "plugin".\x1b[0m');
    return;
}
if (types.indexOf(package.type.toLowerCase()) === -1) {
    console.log('\x1b[41mError : "type" in package.json should be one of : "section", "wwobject", "plugin".\x1b[0m');
    return;
}

//get ww-config.json
if (!fs.existsSync("./ww-config.json")) {
    console.log('\x1b[41mError : "./ww-config.json" was not found.\x1b[0m');
    console.log('\x1b[44mTo create "./ww-config.json" use "yarn create-config".\x1b[0m');
    return;
}

let config = fs.readFileSync("./ww-config.json");

try {
    config = JSON.parse(config);
} catch (error) {
    console.log('\x1b[41mError : unable to parse "./ww-config.json".\x1b[0m');
    return;
}

//Read componentPath
let componentPath = "";
if (!config.componentPath) {
    switch (package.type.toLowerCase()) {
        case "section":
            componentPath = "./src/section.vue";
            break;
        case "wwobject":
            componentPath = "./src/wwObject.vue";
            break;
        case "plugin":
            componentPath = "./src/plugin.vue";
            break;
        default:
            componentPath = "./src/section.vue";
            break;
    }

    console.log('\x1b[44mProperty "componentPath" not found in "ww-config.json". Using "' + componentPath + '".\x1b[0m');
} else {
    componentPath = config.componentPath;
}

if (!fs.existsSync(componentPath)) {
    console.log('\x1b[41m"' + componentPath + '" not found. Please check "componentPath" in "./ww-config.json".\x1b[0m');
}

//Create index.js
const tempIndexJs = "./node_modules/weweb-client/assets/index.js";
if (fs.existsSync(tempIndexJs)) {
    fs.unlinkSync(tempIndexJs);
}

let indexContent = "";

if (package.type.toLowerCase() === "plugin") {
    indexContent = `import plugin from '../../../${componentPath}'

    const name = "__NAME__";
    const version = '__VERSION__';

    wwLib.wwPlugins.add(name, plugin.init)
    `;
} else {
    let registerComponent = "";
    if (package.type.toLowerCase() === "section") {
        registerComponent = `wwLib && wwLib.wwSection && wwLib.wwSection.register && wwLib.wwSection.register(${JSON.stringify(config)});`;
    } else if (package.type.toLowerCase() === "wwobject") {
        registerComponent = `wwLib && wwLib.wwObject && wwLib.wwObject.register && wwLib.wwObject.register(${JSON.stringify(config)});`;
    }

    indexContent = `import component from '../../../${componentPath}'

    const name = "__NAME__";
    const version = '__VERSION__';

    const addComponent = function () {
        if (window.vm) {

            ${registerComponent}

            window.vm.addComponent({
                name: name,
                version: version,
                content: component
            });

            return true;
        }
        return false;
    }

    if (!addComponent()) {
        const iniInterval = setInterval(function () {
            if (addComponent()) {
                clearInterval(iniInterval);
            }
        }, 10);
    }
    `;
}

fs.writeFileSync(tempIndexJs, indexContent);

var shell = require("shelljs");

shell.cd("./node_modules/weweb-client");
shell.exec("node bin/_build.js", function(code, stdout, stderr) {
    if (code != 0) {
        console.log(stderr);
        return reject();
    }

    shell.cd("../../");

    console.log("\x1b[42mBuild ok.\x1b[0m");
});
