#! /usr/bin/env node

var shell = require("shelljs");
shell.exec("webpack --config node_modules/weweb-client/webpack.build.config.js -p --env=build --display=none");