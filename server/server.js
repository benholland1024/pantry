console.log('Starting the Pantry server! 🥫');

////  SECTION 1: Imports.

//  Importing NodeJS libraries.
var http = require('http');  // listen to HTTP requests
var path = require('path');  // manage filepath names
var fs   = require('fs');    // access files on the server
var DataBase = require('./database.js');



////  SECTION 2: Request response.

//  This dictionary of media types (MIME types) will be used in the server func.
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

//  Mapping URLs to pages
const pageURLs = {
  '/': '/website/table_display.html',
}
const pageURLkeys = Object.keys(pageURLs);

//  This function will fire upon every request to our server.
function server_request(req, res) {
  var url = req.url;
  console.log(`\x1b[36m >\x1b[0m New ${req.method} request: \x1b[34m${url}\x1b[0m`);

  res.writeHead(200, {'Content-Type': 'text/html'});
  var extname = String(path.extname(url)).toLowerCase();
  
  if (extname.length == 0 && url.split('/')[1] == 'api') {     /*  API routes.      */
    api_routes(url, req, res);
  } else if (url == '/pantry.js') {
    let response = fs.readFileSync(__dirname + '/../website/pantry.js');
    res.write(response);
    res.end();
  } else if (url == '/') {
    let response = fs.readFileSync(__dirname + '/../website/index.html');
    res.write(response);
    res.end();
  } else if (url.includes('server')) {  /*  Don't send anything from the /server/ folder.  */
    respond_with_a_page(res, '/404');
  } else {    /*  Extension, like .png, .css, .js, etc? If found, respond with the asset.  */
    respond_with_asset(res, url, extname);
  }

}

//  For urls that result in an html page being sent
function respond_with_a_page(res, url) {
  let page_content = "";

  if (pageURLkeys.includes(url)) {  //  If it's a static page route....
    url = pageURLs[url];
    try {
      page_content = fs.readFileSync( __dirname + '/../website' + url);
    } catch(err) {
      page_content = fs.readFileSync(__dirname + '/../website/404.html');
    }
  } else {                          //  If it's a dynamic page route....
    page_content = fs.readFileSync(__dirname + '/../website/404.html');
  }
  res.writeHead(200, {'Content-Type': 'text/html'});
  // var main_page = fs.readFileSync(__dirname + '/../pages/index.html', {encoding:'utf8'});
  // var page_halves = main_page.split('<!--  Insert page content here!  -->');
  // var rendered = page_halves[0] + page_content + page_halves[1];
  // res.write(rendered);
  res.write(page_content);
  res.end();
}

function respond_with_asset(res, url, extname) {
  fs.readFile( __dirname + '/../website' + url, function(error, content) {
    if (error) {
      console.log(error);
      if(error.code == 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('404 -- asset not found', 'utf-8');
      }
      else {
        res.writeHead(500);
        res.end(`Sorry, check with the site admin for error: ${error.code} ..\n`);
      }
    } else {
      var contentType = mimeTypes[extname] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

////  SECTION 3: API.

let GET_routes = {};  //  Stores all GET route methods!
let POST_routes = {}; //  Stores all POST route methods!

//  Responds to HTTP requests. "code" might be 404, 200, etc. 
function api_response(res, code, text) {
  res.writeHead(code, {'Content-Type': 'text/html'});
  res.write(text);
  return res.end();
}

//  Parses the data sent with a request
function parse_req_data(req_data, res) {
  try {
    let parsed_req_data = JSON.parse(req_data);
    if (typeof parsed_req_data === 'object' && !Array.isArray(parsed_req_data) && parsed_req_data !== null) {
      return parsed_req_data;
    } else {
      return { body: req_data };
    }
  } catch (e) {
    return { body: req_data };
  }
}

//  Parse URL params for example /api/users?userid=22&username=ben
function parse_url_params(url, res) {
  let params = { _url: url };
  if (url.indexOf('?') != -1) {
    let param_string = url.split('?')[1];
    let param_pairs = param_string.split('&');
    for (let i = 0; i < param_pairs.length; i++) {
      let parts = param_pairs[i].split('=');
      if (parts.length != 2) {
        return api_response(res, 400, `Improper URL parameters.`);
      }
      params[parts[0]] = parts[1];
    }
    params._url = url.split('?')[0];
  }
  return params;
}

//  This is called in server_request for any req starting with /api/.  It uses the functions above and calls the functions below.
function api_routes(url, req, res) {

  let req_data = '';
  req.on('data', chunk => {
    req_data += chunk;
  })
  req.on('end', function() {

    //  Parse the data to JSON.
    req_data = parse_req_data(req_data, res);

    //  Get data, for example /api/users?userid=22&username=ben
    req_data._params = parse_url_params(url, res);
    url = req_data._params._url;

    if (req.method == "GET" && typeof GET_routes[url] == 'function') {
      GET_routes[url](req_data._params, res);
    } else if (req.method == "POST" && typeof POST_routes[url] == 'function') {
      POST_routes[url](req_data, res);
    } else {
      console.log("404 here??")
      api_response(res, 404, `The ${req.method} API route ${url} does not exist.`);
    }

  })
}

//  Get a list of the names of all databases. 
//    TODO:  Make this search databases by user. 
GET_routes['/api/all-databases'] = function(data, res) {
  let db_names = fs.readdirSync(`${__dirname}/databases`);
  for (let i = 0; i < db_names.length; i++) {
    db_names[i] = path.parse(db_names[i]).name;
  }
  api_response(res, 200, JSON.stringify(db_names));
}

//  Get all tables from a database. 
//    Param: /api/all-table-names?database=dogs
GET_routes['/api/all-table-names'] = function(data, res) {
  let database_name = data.database;
  let table_names = fs.readdirSync(`${__dirname}/databases/${database_name}/metadata`);
  for (let i = 0; i < table_names.length; i++) {
    table_names[i] = path.parse(table_names[i]).name;
  }
  api_response(res, 200, JSON.stringify(table_names));
}

//  Get one or more tables from a given database. 
//    Params: /api/table?db_name=my-db&table_name=my-table
GET_routes['/api/table'] = function(data, res) {
  let db_name = data.db_name;
  let table_name = data.table_name;
  let response = new DataBase(db_name).Table(table_name);
  if (typeof response != 'object') {
    api_response(res, 400, `Table doesn't exist`);
    return;
  }
  api_response(res, 200, JSON.stringify(response));
}

//  Insert a row into a table.  
//    Param: /api/insert?db_name=my-db&table_name=my-table
//    Data:  An object with row data. 
POST_routes['/api/insert'] = function(data, res) {
  let db_name = data._params.db_name;
  let table_name = data._params.table_name;
  delete data._params;
  console.log(data);
  let response = new DataBase(db_name).Table(table_name).insert(data);
  api_response(res, 200, JSON.stringify(response));
}

//  Update a row in a table.  
//    Param: /api/insert?db_name=my-db&table_name=my-table&id=26
//    Data:  An object with row data. 
POST_routes['/api/update'] = function(data, res) {
  let db_name = data._params.db_name;
  let table_name = data._params.table_name;
  let row_id = data._params.id;
  delete data._params;
  console.log("Updating:");
  console.log(data);
  let response = new DataBase(db_name).Table(table_name).update(row_id, data);
  api_response(res, 200, JSON.stringify(response));
}

//  Delete a row from a table.  
//    Param: /api/insert?db_name=my-db&table_name=my-table&id=26
//    Data:  None
POST_routes['/api/delete'] = function(data, res) {
  let db_name = data._params.db_name;
  let table_name = data._params.table_name;
  let row_id = data._params.id;
  let response = new DataBase(db_name).Table(table_name).delete(row_id);
  api_response(res, 200, JSON.stringify(response));
}

//  Add a new table.
//    Param: /api/create-table?db_name=my-db
//    Data:  An object like { name: '', snakecase: '', columns: [ {...}, {...} ] }
POST_routes['/api/create-table'] = function(data, res) {
  let db_name = data._params.db_name;
  let table_name = data.snakecase;
  delete data._params
  let response = {};
  try {
    fs.writeFileSync(`${__dirname}/databases/${db_name}/metadata/${table_name}.json`, JSON.stringify(data, null, 2));
    response.msg = `Created new table with the name "${table_name}"!`;
    console.log(response.msg);
  } catch (err) {
    console.error('Error creating a new table file synchronously:', err);
    response.error = true;
    response.msg = err;
  }
  try {
    fs.writeFileSync(`${__dirname}/databases/${db_name}/rows/${table_name}.json`, '[]');
  } catch (err) {
    response.error = true;
  }
  api_response(res, 200, JSON.stringify(response));
}


////  SECTION 4: Boot.

console.log("\x1b[32m >\x1b[0m Starting the pantry server, at \x1b[36mlocalhost:8080\x1b[0m !");

//  Creating the server!
var server = http.createServer(
  server_request
);
server.on('close', () => {
  console.log("\x1b[31m >\x1b[0m Shutting down server. Bye!")
})
process.on('SIGINT', function() {
  server.close();
  process.exit()
});
server.listen(8080);