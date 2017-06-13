// The Browser API key obtained from the Google Developers Console.
var developerKey = 'AIzaSyCZxBa8O8nqTM0xDBCjX0Q1ff8zwV9ZMzw';

// The Client ID obtained from the Google Developers Console. Replace with your own Client ID.
var clientId = "576255310053-nl3vla4sgg0cmu9ieb3l79fca2iuhrcs.apps.googleusercontent.com"

// Scope to use to access user's items.
var scope = ['https://www.googleapis.com/auth/drive'];

var oauthToken;

const path = require('path');


// Use the API Loader script to load google.picker and gapi.auth.
function onApiLoad() {
    // load the APIs
    gapi.load('client:auth', {
        'callback': onAuthApiLoad
    });
}

function onAuthApiLoad() {
    window.gapi.auth.authorize({
            'client_id': clientId,
            'scope': scope,
            'immediate': false
        },
        // log the user in
        handleAuthResult);
}

function handleAuthResult(authResult) {
    if (authResult && !authResult.error) {
        oauthToken = authResult.access_token;
        gapi.client.load('drive', 'v2', null);
    }
}

function makeDirectory() {
    var pathName = prompt("Enter the path name : ", "path name here");
    if (pathName === null) {
        console.log("no valid path name");
    } else {
        mkdir(pathName);
    }
}

function mkdir(p) {
    const title = path.basename(p);
    const dir = path.dirname(p);
    const base = path.basename(dir);

    var request = gapi.client.drive.files.list({
        "q": "title = '" + base + "'"
    });
    request.execute(function(resp) {
        var id = resp.items[0].id;
        console.log('id in callback = ' + id)

        var access_token = oauthToken;
        var secondRequest = gapi.client.request({
            'path': '/drive/v2/files/',
            'method': 'POST',
            'headers': {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token,
            },
            'body': {
                "title": title,
                "parents": [{
                    "id": id
                }],
                "mimeType": "application/vnd.google-apps.folder",
            }
        });

        secondRequest.execute(function(resp) {
            console.log('nested folder done creating')
        })
    });
}

function trashFile() {
    var pathName = prompt("Enter the path name : ", "path name here");
    if (pathName === null) {
        console.log("no valid path name");
    } else {
        trashOldFile(pathName);
    }
}

/**
 * Move a file to the trash.
 *
 * @param {String} p Path of the file to trash.
 */
function trashOldFile(p) {
    const title = path.basename(p);
    const dir = path.dirname(p);
    const base = path.basename(dir);

    var request = gapi.client.drive.files.list({
        "q": "title = '" + title + "'"
    });
    request.execute(function(resp) {
        var id = resp.items[0].id;

        var secondRequest = gapi.client.drive.files.trash({
            'fileId': id
        });
        secondRequest.execute(function(resp) {});
    });
}

function writeFile() {
    var pathName = prompt("Enter the path name : ", "path name here");
    if (pathName === null) {
        console.log("no valid path name");
    } else {
        writeAFile(pathName);
    }
}

function writeAFile(p, callback) {
    const title = path.basename(p);
    const dir = path.dirname(p);
    const base = path.basename(dir);

    var request = gapi.client.drive.files.list({
        "q": "title = '" + title + "'"
    });
    request.execute(function(resp) {
        var id = resp.items[0].id;
        var text = prompt("Enter your text here: ", "text here");
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        var contentType = "text/html";
        var metadata = {
            'mimeType': contentType,
        };

        var multipartRequestBody =
            delimiter + 'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter + 'Content-Type: ' + contentType + '\r\n' + '\r\n' +
            text +
            close_delim;

        if (!callback) {
            callback = function(file) {
                console.log("Update Complete ", file)
            };
        }

        gapi.client.request({
            'path': '/upload/drive/v3/files/' + id + "&uploadType=multipart",
            'method': 'PATCH',
            'params': {
                'fileId': id,
                'uploadType': 'multipart'
            },
            'headers': {
                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody,
            callback: callback,
        });
    });

}

function readFile() {
    var pathName = prompt("Enter the path name : ", "path name here");
    if (pathName === null) {
        console.log("no valid path name");
    } else {
        readAFile(pathName);
    }
}

function readAFile(p) {
    const title = path.basename(p);
    const dir = path.dirname(p);
    const base = path.basename(dir);

    var request = gapi.client.drive.files.list({
        "q": "title = '" + title + "'"
    });
    request.execute(function(resp) {
        var id = resp.items[0].id;
        // make the request to the google drive server
        gapi.client.request({
            path: '/drive/v2/files/' + id,
            method: 'GET',
            callback: function(obj) {
                const xhr = new XMLHttpRequest();
                xhr.open("GET", obj.downloadUrl);
                xhr.setRequestHeader("Authorization", "Bearer " + gapi.auth.getToken().access_token);
                xhr.onload = function() {
                    console.log(xhr.response);
                    var data = xhr.response;
                    var output = document.getElementById("output");
                    docID = id;
                    document.write(data);
                }
                xhr.send();
            }
        });
    });
}



function createNewFile() {
    var pathName = prompt("Enter the path name : ", "path name here");
    if (pathName === null) {
        console.log("no valid path name");
    } else {
        createFile(pathName);
    }
}


function createFile(p) {
    const title = path.basename(p);
    const dir = path.dirname(p);
    const base = path.basename(dir);

    var request = gapi.client.drive.files.list({
        "q": "title = '" + base + "'"
    });
    request.execute(function(resp) {
        var id = resp.items[0].id;

        var access_token = oauthToken;
        var secondRequest = gapi.client.request({
            'path': '/drive/v2/files/',
            'method': 'POST',
            'headers': {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token,
            },
            'body': {
                "title": title,
                "parents": [{
                    "id": id
                }],
                "mimeType": "text/html",
            }
        });

        secondRequest.execute(function(resp) {
            console.log('nested file done creating')
        })
    });
}



module.exports = {
    onApiLoad,
    makeDirectory,
    createNewFile,
    trashFile,
    readFile,
    writeFile,
};
