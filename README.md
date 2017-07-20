# GoogleDriveFS

Google Drive File System is an in-browser file system for Google Drive that uses the Google REST API. 


Build Procedure: 

`browserify html/client.js -o out.js -s client`

`mv out.js html/`

`node server.js`