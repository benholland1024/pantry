console.log('Starting the Pantry server! 🥫');

////  SECTION 1: Imports.

//  Importing NodeJS libraries.
var http = require('http');  // listen to HTTP requests
var path = require('path');  // manage filepath names
var fs   = require('fs');    // access files on the server
var DataBase = require('./database/database.js');



////  SECTION 2: Request response.

//  This function will fire upon every request to our server.
function server_request(req, res) {
  var url = req.url;
  console.log(`\x1b[36m >\x1b[0m New ${req.method} request: \x1b[34m${url}\x1b[0m`);

  res.writeHead(200, {'Content-Type': 'text/html'});
  var extname = String(path.extname(url)).toLowerCase();
  
  if (extname.length == 0 && url.split('/')[1] == 'api') {     /*  API routes.      */
    api_routes(url, req, res);
  } else if (url == '/') {
    let response = fs.readFileSync(__dirname + '/../website/index.html');
    res.write(response);
    res.end();
  }

}


////  SECTION 3: API.
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

GET_routes['/api/all-tables'] = function(data, res) {
  let table_names = fs.readdirSync(`${__dirname}/database/columns`);
  for (let i = 0; i < table_names.length; i++) {
    table_names[i] = path.parse(table_names[i]).name;
  }
  api_response(res, 200, JSON.stringify(table_names));
}

GET_routes['/api/table'] = function(data, res) {
  let table_name = data.name;
  let response = DataBase.table(table_name);
  if (typeof response != 'object') {
    api_response(res, 400, `Table doesn't exist`);
    return;
  }
  api_response(res, 200, JSON.stringify(response));
}

//  Insert a row into a table.  
//    Param: /api/insert?table=dogs
//    Data:  An object with row data. 
POST_routes['/api/insert'] = function(data, res) {
  let table_name = data._params.table;
  delete data._params;
  console.log(data);
  let response = DataBase.table(table_name).insert(data);
  api_response(res, 200, JSON.stringify(response));
}

//  Update a row in a table.  
//    Param: /api/insert?table=dogs&id=26
//    Data:  An object with row data. 
POST_routes['/api/update'] = function(data, res) {
  let table_name = data._params.table;
  let row_id = data._params.id;
  delete data._params;
  let response = DataBase.table(table_name).update(row_id, data);
  api_response(res, 200, JSON.stringify(response));
}

//  Delete a row from a table.  
//    Param: /api/insert?table=dogs&id=26
//    Data:  None
POST_routes['/api/delete'] = function(data, res) {
  let table_name = data._params.table;
  let row_id = data._params.id;
  let response = DataBase.table(table_name).delete(row_id);
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