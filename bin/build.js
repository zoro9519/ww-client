#! /usr/bin/env node
var shell = require("shelljs");
shell.cd("./node_modules/weweb-client");
shell.exec("node bin/build2.js");