#! /usr/bin/env node
var shell = require("shelljs");
shell.cd("./node_modules/weweb-client");
shell.exec("node bin/_build.js", function (code, stdout, stderr) {
    if (code != 0) {
        console.log(stderr);
    }
});