#! /usr/bin/env node

const port = process.argv[2] || '8080'

var shell = require("shelljs");
shell.cd("node_modules/weweb-client/");
shell.exec("webpack-dev-server --config webpack.dev.config.js -d --inline --env=dev --hot --https --disableHostCheck=true --client-log-level=error --port=" + port);