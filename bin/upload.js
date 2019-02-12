#! /usr/bin/env node

const inquirer = require('inquirer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const server = 'http://localhost:3000/api/v1'
const userPrefPath = path.join(process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + 'Library/Preferences' : '/var/local'), 'weweb_upload')
const userPrefFilename = 'user_pref.json'

let objectVersionId


/*=============================================m_ÔÔ_m=============================================\
  ASK USER FOR CREDENTIALS
\================================================================================================*/
const askCredentials = function () {
    const questions = [
        {
            name: 'email',
            type: 'input',
            message: 'Enter your WeWeb e-mail address:',
            validate: function (value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Please enter your e-mail address.';
                }
            }
        },
        {
            name: 'password',
            type: 'password',
            message: 'Enter your password:',
            validate: function (value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Please enter your password.';
                }
            }
        }
    ];
    return inquirer.prompt(questions);
}

/*=============================================m_ÔÔ_m=============================================\
  WRITE USER PREFS TO A FILE
\================================================================================================*/
const writeUserPref = function (userPref) {

    try {
        userPref = userPref || {};
        userPref = JSON.stringify(userPref);


        if (!fs.existsSync(userPrefPath)) {
            fs.mkdirSync(userPrefPath);
        }

        fs.writeFileSync(path.join(userPrefPath, userPrefFilename), userPref, function (err) {
            if (err) {
                throw new Error();
            }
        });

        return true;
    }
    catch (e) {
        return false;
    }

}

/*=============================================m_ÔÔ_m=============================================\
  GET USER PREFS FROM FILE
\================================================================================================*/
const readUserPref = function () {

    try {
        let userPref = null

        userPref = fs.readFileSync(path.join(userPrefPath, userPrefFilename), 'utf8')
        userPref = JSON.parse(userPref)

        return userPref;
    }
    catch (e) {
        return {};
    }

}

/*=============================================m_ÔÔ_m=============================================\
  GET PACKAGE.JSON
\================================================================================================*/
const getPackageJson = function () {
    try {
        let packageJSON

        packageJSON = fs.readFileSync('./package.json', 'utf8')
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
        console.log('\x1b[41mError : ./package.json not found or incorrect format.\x1b[0m')
        return null
    }
}

/*=============================================m_ÔÔ_m=============================================\
  CHECK IF TOKEN IS VALID
\================================================================================================*/
const isTokenValid = async function (token) {
    try {
        let response = await axios({
            method: 'get',
            url: server + '/users/me',
            headers: { 'wwauthmanagertoken': 'auth ' + token },
        })

        if (response.data.id) {
            return true;
        }
    }
    catch (error) {
    }

    return false;
}

/*=============================================m_ÔÔ_m=============================================\
  GET TOKEN FROM CREDENTIALS
\================================================================================================*/
const getToken = async function (credentials) {
    let response
    try {
        response = await axios.post(server + '/users/login', credentials)
    }
    catch (error) {
        return null
    }

    console.log('-- Credentials ok --')
    return response.data.token
}

/*=============================================m_ÔÔ_m=============================================\
  GET FILE
\================================================================================================*/
const getFile = function (path) {
    try {
        return new Buffer(fs.readFileSync(path, 'utf8'), 'utf-8')
    } catch (error) {
        return null
    }
}

/*=============================================m_ÔÔ_m=============================================\
  GET UPLOAD REQUEST URL
\================================================================================================*/
const getUploadRequestUrl = function (packageJson) {
    switch (packageJson.type) {
        case 'wwObject':
            return server + '/wwobjects/' + packageJson.name + '/request_upload'
            break;
        case 'section':
            return server + '/sectionbases/' + packageJson.name + '/request_upload'
            break;
        default:
            return null
            break;
    }
}

/*=============================================m_ÔÔ_m=============================================\
  GET UPLOAD REQUEST URL
\================================================================================================*/
const getCreateVersionUrl = function (packageJson) {
    switch (packageJson.type) {
        case 'wwObject':
            return server + '/wwobjects/' + packageJson.name + '/create_version'
            break;
        case 'section':
            return server + '/sectionbases/' + packageJson.name + '/create_version'
            break;
        default:
            return null
            break;
    }
}

/*=============================================m_ÔÔ_m=============================================\
  REQUEST S3 UPLOAD
\================================================================================================*/
const requestS3Upload = async function (url, filename, userPref) {
    let options = {
        method: 'POST',
        headers: { 'wwauthmanagertoken': 'auth ' + userPref.token },
        url: url,
        data: {
            filename: filename,
            objectVersionId: objectVersionId
        }
    }

    try {
        let response = await axios(options);
        objectVersionId = response.data.objectVersionId
        return response.data.uploadUrl
    }
    catch (error) {
        return null
    }
}

/*=============================================m_ÔÔ_m=============================================\
  UPLOAD TO S3
\================================================================================================*/
const uploadToS3 = async function (url, data) {
    try {
        await axios({
            method: 'PUT',
            url: url,
            headers: {
                "Accept": '*/*'
            },
            skipAuthorization: true,
            data: data,
        })
        return true
    } catch (error) {
        return false
    }
}



const run = async function () {



    let userPref
    let packageJson
    let sectionTypes

    /*=============================================m_ÔÔ_m=============================================\
      GET OBJECT NAME FROM PACKAGE.JSON
    \================================================================================================*/
    packageJson = getPackageJson();

    console.log('WEWEB UPLOAD V' + packageJson.version)

    console.log('-- Upload ' + packageJson.type + ' ' + packageJson.name + ' --')


    /*=============================================m_ÔÔ_m=============================================\
      IF SECTION PARSE DEFAULT DATA
    \================================================================================================*/
    if (packageJson.type.toLowerCase() == 'section') {
        const basePath = './src/default_data';

        //Get default data index
        try {
            sectionTypes = fs.readFileSync(basePath + '/index.js', 'utf8');
        } catch (error) {
            console.log('\x1b[41mError : ' + basePath + '/index.js not found\x1b[0m');
            return
        }

        //Eval default data index
        try {
            sectionTypes = eval(sectionTypes);
            if (!sectionTypes || !sectionTypes.length) {
                throw new Error();
            }
        } catch (error) {
            console.log('\x1b[41mError : ' + basePath + '/index.js incorrect format, or no data defined\x1b[0m');
            return
        }

        //Parse section types
        let hasSectionType = false;
        for (let sectionType of sectionTypes) {
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
            hasSectionType = true;

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

        if (!hasSectionType) {
            console.log('\x1b[41mError : ' + basePath + '/index.js is missing or has no correct config\x1b[0m');
            return
        }

    }


    /*=============================================m_ÔÔ_m=============================================\
      GET USER PREF AND CHECK TOKEN IF AVAILABLE
    \================================================================================================*/
    userPref = readUserPref()
    if (userPref.token && !await isTokenValid(userPref.token)) {
        delete userPref.token
    }


    /*=============================================m_ÔÔ_m=============================================\
      PROMPT LOGIN
    \================================================================================================*/
    if (!userPref.token) {
        const credentials = await askCredentials()
        userPref.token = await getToken(credentials)
        if (!userPref.token) {
            console.log('\x1b[41mError : Wrong email / password\x1b[0m')
            return
        }
    }


    /*=============================================m_ÔÔ_m=============================================\
      SAVE USER PREF
    \================================================================================================*/
    writeUserPref(userPref);




    /*=============================================m_ÔÔ_m=============================================\
      GET FILES
    \================================================================================================*/
    //Get front.js
    let frontJS = getFile('./dist/front.js');
    if (!frontJS) {
        console.log('\x1b[41mError : ./dist/front.js not found. Please make sure you ran \'yarn build\' before\x1b[0m')
        return
    }

    //Get manager.js
    let managerJS = getFile('./dist/manager.js');
    if (!managerJS) {
        console.log('\x1b[41mError : ./dist/manager.js not found. Please make sure you ran \'yarn build\' before\x1b[0m')
        return
    }
    //Get front-ie.js
    let frontIEJS = getFile('./dist/front-ie.js');
    if (!frontIEJS) {
        console.log('\x1b[41mError : ./dist/front-ie.js not found. Please make sure you ran \'yarn build\' before\x1b[0m')
        return
    }

    //Get manager-ie.js
    let managerIEJS = getFile('./dist/manager-ie.js');
    if (!managerIEJS) {
        console.log('\x1b[41mError : ./dist/manager-ie.js not found. Please make sure you ran \'yarn build\' before\x1b[0m')
        return
    }



    /*=============================================m_ÔÔ_m=============================================\
      CREATE VERSION  
    \================================================================================================*/
    let options = {
        method: 'POST',
        headers: { 'wwauthmanagertoken': 'auth ' + userPref.token },
        url: getCreateVersionUrl(packageJson),
        data: { data: sectionTypes, active: true, public: packageJson.wewebPublic, repository: packageJson.repository, version: packageJson.version } || {}
    }

    let resultData

    try {
        let response = await axios(options);
        resultData = response.data;
        objectVersionId = resultData.objectVersionId;
    }
    catch (error) {
        console.log('\x1b[41mError : \x1b[0m', error)
        return
    }


    /*=============================================m_ÔÔ_m=============================================\
      UPLOAD PREVIEW
    \================================================================================================*/
    for (const sectionType of resultData.data) {
        for (const preview of sectionType.previews) {

            let previewFile = fs.readFileSync(preview.src);
            if (!previewFile) {
                console.log('\x1b[41mError : Preview upload error\x1b[0m')
                return
            }

            if (!await uploadToS3(preview.signedUrl, previewFile)) {
                console.log('\x1b[41mError : Preview upload error\x1b[0m')
                return
            }
        }
    }

    /*=============================================m_ÔÔ_m=============================================\
      GET S3 REQUEST URL
    \================================================================================================*/
    let url = getUploadRequestUrl(packageJson)
    if (!url) {
        console.log('\x1b[41mError : unknown object type.\x1b[0m')
        return
    }


    /*=============================================m_ÔÔ_m=============================================\
      UPLOAD FRONT.JS
    \================================================================================================*/
    //Request S3 upload
    let uploadUrl = await requestS3Upload(url, 'front.js', userPref)
    if (!uploadUrl) {
        console.log('\x1b[41mError : An error occured\x1b[0m')
        return
    }

    //Upload to S3
    if (!await uploadToS3(uploadUrl, frontJS)) {
        console.log('\x1b[41mError : Upload error.\x1b[0m')
        return
    }

    console.log('-- font.js upload ok --')


    /*=============================================m_ÔÔ_m=============================================\
      UPLOAD MANAGER.JS
    \================================================================================================*/
    //Request S3 upload
    uploadUrl = await requestS3Upload(url, 'manager.js', userPref)
    if (!uploadUrl) {
        console.log('\x1b[41mError : An error occured\x1b[0m')
        return
    }

    //Upload to S3
    if (!await uploadToS3(uploadUrl, managerJS)) {
        console.log('\x1b[41mError : Upload error.\x1b[0m')
        return
    }

    console.log('-- manager.js upload ok --')


    /*=============================================m_ÔÔ_m=============================================\
      UPLOAD FRONT-IE.JS
    \================================================================================================*/
    //Request S3 upload
    uploadUrl = await requestS3Upload(url, 'front-ie.js', userPref)
    if (!uploadUrl) {
        console.log('\x1b[41mError : An error occured\x1b[0m')
        return
    }

    //Upload to S3
    if (!await uploadToS3(uploadUrl, frontIEJS)) {
        console.log('\x1b[41mError : Upload error.\x1b[0m')
        return
    }

    console.log('-- front-ie.js upload ok --')


    /*=============================================m_ÔÔ_m=============================================\
      UPLOAD MANAGER-IE.JS
    \================================================================================================*/
    //Request S3 upload
    uploadUrl = await requestS3Upload(url, 'manager-ie.js', userPref)
    if (!uploadUrl) {
        console.log('\x1b[41mError : An error occured\x1b[0m')
        return
    }

    //Upload to S3
    if (!await uploadToS3(uploadUrl, managerIEJS)) {
        console.log('\x1b[41mError : Upload error.\x1b[0m')
        return
    }

    console.log('-- manager-ie.js upload ok --')


    /*=============================================m_ÔÔ_m=============================================\
      🎉 DONE 🎉
    \================================================================================================*/
    console.log('\x1b[42m-- UPLOAD DONE --\x1b[0m')

}


run();
