////
////  DATABASE MAKER 
////


//  Create a database called 'untitled_db'.
function create_db() {
  let new_db_name = 'untitled_db';
  let i = 1;
  //  Increment i iff the list includes "untitled_db" AND "untitled_db + i"
  while (_db_list.includes(new_db_name) && _db_list.includes(new_db_name + i) && i < 100) {
    i++;
  }
  if (_db_list.includes(new_db_name)) { new_db_name += i; }
  if (i >= 100) { document.getElementById('error').innerHTML = 'Too many DBs!'; return; }


  http.open("POST", `/api/create-db`);
  http.send(JSON.stringify({
    db_name: new_db_name,
    db_user: _current_user.username
  }));
  http.onreadystatechange = (e) => {
    if (http.readyState == 4 && http.status == 200) {
      let response = JSON.parse(http.responseText);
      if (!response.error) {
        _db_list.push(new_db_name);
        render_side_bar();
      } else {
        document.getElementById('error').innerHTML = response.msg;
      }
    }
  }
}

////
////  DATA HANDLING 
////

//  Create new database
function save_new_db() {
  let new_db = _selected_db;

  new_db.name = document.getElementById('table-name-input').value;
  new_db.snakecase = to_snakecase(new_db.name);
  http.open("POST", `/api/create-db`);
  http.send(JSON.stringify(new_db));
  http.onreadystatechange = (e) => {
    if (http.readyState == 4 && http.status == 200) {
      let response = JSON.parse(http.responseText);
      if (!response.error) {
        _db_list.push(new_db.snakecase);
        render_side_bar();
      } else {
        document.getElementById('error').innerHTML = response.msg;
      }
    }
  }
}