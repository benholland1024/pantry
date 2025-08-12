////
////  DATABASE MAKER 
////


//  Create a database called 'untitled_db'.
function create_db() {
  let new_db_name = 'untitled_db';
  let i = 1;
  let db_list = Object.keys(_db_data);
  //  Increment i iff the list includes "untitled_db" AND "untitled_db + i"
  while (db_list.includes(new_db_name) && db_list.includes(new_db_name + i) && i < 100) {
    i++;
  }
  if (db_list.includes(new_db_name)) { new_db_name += i; }
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
        _db_data[new_db_name]= response.data;
        render_side_bar();
        load_db_settings(new_db_name);
      } else {
        document.getElementById('error').innerHTML = response.msg;
      }
    }
  }
}
