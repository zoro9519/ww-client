#! /usr/bin/env node

const { exec } = require('child_process');


exec('webpack --config node_modules/weweb-client/webpack.build.config.js -p --env=build', (error, stdout, stderr) => {
    if (error) {
        console.error(error);
        console.log('\x1b[41mError : build failed.\x1b[0m');
        console.log('\x1b[41mMake sur that package.json version is in correct format (ex: 1.0.4)\x1b[0m');
        return;
    }

    console.log('\x1b[42mBuild ok.\x1b[0m');
    console.log('\x1b[32mYou can now upload this object using "yarn upload" or "npm run upload" \x1b[0m');
});