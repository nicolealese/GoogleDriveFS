// The Browser API key obtained from the Google Developers Console.
var developerKey = 'AIzaSyCZxBa8O8nqTM0xDBCjX0Q1ff8zwV9ZMzw';

// The Client ID obtained from the Google Developers Console. Replace with your own Client ID.
var clientId = "576255310053-nl3vla4sgg0cmu9ieb3l79fca2iuhrcs.apps.googleusercontent.com"

// Scope to use to access user's items.
var scope = ['https://www.googleapis.com/auth/drive'];

var oauthToken;

const path = require('path');

function loadScript(url, callback)
{
    // Adding the script tag to the head as suggested before
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;

    // Fire the loading
    head.appendChild(script);
}


loadScript("https://apis.google.com/js/api.js", onApiLoad);


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

function stat() {
    var pathName = prompt("Enter the path name : ", "path name here");
    if (pathName === null) {
        console.log("no valid path name");
    } else {
        printMetaData(pathName);
    }
}

function printMetaData(p) {
    const title = path.basename(p);
    const dir = path.dirname(p);
    const base = path.basename(dir);

    var request = gapi.client.drive.files.list({
        "q": "title = '" + title + "'"
    });
    request.execute(function(resp) {
        if(typeof resp.items[0] !== 'undefined' && typeof resp.items[0].id !== 'undefined'){
            var id = resp.items[0].id;
            var secondRequest = gapi.client.drive.files.get({
                'fileId': id
            });
            secondRequest.execute(function(resp) {
                console.log('Title: ' + resp.title);
                console.log('Description: ' + resp.description);
                console.log('MIME type: ' + resp.mimeType);
                var type = resp.mimeType;
                if (type === 'application/vnd.google-apps.folder') {
                    console.log("It is a folder");
                }
                else {
                    console.log("It is a file");
                }
            });
        }
        else {
            console.log("That path does not exist");
        }
    });
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
    if (base === '.') {
        console.log("defined");
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
                "mimeType": "application/vnd.google-apps.folder",
            }
        });
        secondRequest.execute(function(resp) {
            console.log('folder in root done creating')
        })
    } else {
        var request = gapi.client.drive.files.list({
            "q": "title = '" + base + "'"
        });
        request.execute(function(resp) {
            if(typeof resp.items[0] !== 'undefined' && typeof resp.items[0].id !== 'undefined'){
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
                        "mimeType": "application/vnd.google-apps.folder",
                    }
                });
                secondRequest.execute(function(resp) {
                    console.log('nested folder done creating')
                })
            }
            else {
                console.log('Parent does not exist:' + dir);
            }
        });
    }
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
    var text = prompt("Enter your text here: ", "text here");
    if (pathName === null) {
        console.log("no valid path name");
    } else {
        writeAFile(pathName, text);
    }
}

function writeAFile(p, data, callback) {
    const title = path.basename(p);
    const dir = path.dirname(p);
    const base = path.basename(dir);

    var request = gapi.client.drive.files.list({
        "q": "title = '" + title + "'"
    });
    request.execute(function(resp) {
        if (typeof resp.items[0] !== 'undefined' && typeof resp.items[0].id !== 'undefined') {
            var id = resp.items[0].id;
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
            data +
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
        }
        else {
            console.log("The file does not exist and cannot be updated");
        }
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

function ls() {
    var pathName = prompt("Enter the path name : ", "path name here");
    if (pathName === null) {
        console.log("no valid path name");
    } else {
        listFiles(pathName);
    }
}

function listFiles(p) {
    const title = path.basename(p);
    const dir = path.dirname(p);
    const base = path.basename(dir);

    var request = gapi.client.drive.files.list({
        "q": "title = '" + title + "'"
    });
    request.execute(function(resp) {
        var id = resp.items[0].id;
        var retrievePageOfChildren = function(request, result) {
            request.execute(function(resp) {
                var secondId;
                var i = 0; 
                while (i < resp.items.length) {
                    secondId = resp.items[i].id;  
                    i++;
                     var nameArray = []; 

                     var secondRequest = gapi.client.drive.files.get({
                        'fileId': secondId
                    });
                    secondRequest.execute(function(resp) {
                            nameArray.push(resp.title); 
                        console.log("the name array is: " + nameArray);
                    });
                }
                  
            });
        }
        var initialRequest = gapi.client.drive.children.list({
            'folderId' : id
        });
        retrievePageOfChildren(initialRequest, []);
    });
}

function rmdir() {
    var pathName = prompt("Enter the path name : ", "path name here");
    if (pathName === null) {
        console.log("no valid path name");
    } else {
        removeDirectory(pathName);
    }
}

function removeDirectory(p) {
    const title = path.basename(p);
    const dir = path.dirname(p);
    const base = path.basename(dir);

    var request = gapi.client.drive.files.list({
        "q": "title = '" + title + "'"
    });
    request.execute(function(resp) {
        if(typeof resp.items[0] !== 'undefined' && typeof resp.items[0].id !== 'undefined'){
            var id = resp.items[0].id;
            var secondRequest = gapi.client.drive.files.get({
                'fileId': id
            });
            secondRequest.execute(function(resp) {
                var type = resp.mimeType;
                if (type === 'application/vnd.google-apps.folder') {
                    trashOldFile(p);
                }
                else {
                    console.log("Error: it is a file !");
                }
            });
        }
        else {
            console.log("That path does not exist");
        }
    });

}

function rm() {
    var pathName = prompt("Enter the path name : ", "path name here");
    if (pathName === null) {
        console.log("no valid path name");
    } else {
        unlink(pathName);
    }
}

function unlink(p) {
    const title = path.basename(p);
    const dir = path.dirname(p);
    const base = path.basename(dir);

    var request = gapi.client.drive.files.list({
        "q": "title = '" + title + "'"
    });
    request.execute(function(resp) {
        if(typeof resp.items[0] !== 'undefined' && typeof resp.items[0].id !== 'undefined'){
            var id = resp.items[0].id;
            var secondRequest = gapi.client.drive.files.get({
                'fileId': id
            });
            secondRequest.execute(function(resp) {
                var type = resp.mimeType;
                if (type === 'application/vnd.google-apps.folder') {
                  console.log("Error: it is a folder !");  
                }
                else {
                    trashOldFile(p);
                }
            });
        }
        else {
            console.log("That path does not exist");
        }
    });
}

function rnm() {
    var oldPathName = prompt("Enter the old path name : ", "path name here");
    var newPathName = prompt("Enter the new path name : ", "path name here");
    if (oldPathName === null || newPathName === null) {
        console.log("no valid path name");
    } else {
        rename(oldPathName, newPathName); 
    }
}

function rename(oldPath, newPath) {
    const title = path.basename(oldPath);

    var request = gapi.client.drive.files.list({
        "q": "title = '" + title + "'"
    });
    request.execute(function(resp) {
        var id = resp.items[0].id;
        var secondRequest = gapi.client.drive.files.get({
            'fileId': id
        });

        secondRequest.execute(function(resp) {
            var type = resp.mimeType;
            if (type === 'application/vnd.google-apps.folder') {
                mkdir(newPath);
                trashOldFile(oldPath);
            }
            else {
                var data; 
                // make the request to the google drive server
                gapi.client.request({
                    path: '/drive/v2/files/' + id,
                    method: 'GET',
                    callback: function(obj) {
                        const xhr = new XMLHttpRequest();
                        xhr.open("GET", obj.downloadUrl);
                        xhr.setRequestHeader("Authorization", "Bearer " + gapi.auth.getToken().access_token);
                        xhr.onload = function() {
                            data = xhr.response;
                            var output = document.getElementById("output");
                            docID = id;
                            console.log("the data is: " + data);
                            createFile(newPath);
                            writeAFile(newPath, data);
                            trashOldFile(oldPath);
                        }
                        xhr.send();
                    }
                });   
            }
        });
    });
}

module.exports = {
    onApiLoad,
    makeDirectory,
    createNewFile,
    trashFile,
    readFile,
    writeFile,
    stat,
    ls,
    rmdir,
    rm,
    rnm,
};
