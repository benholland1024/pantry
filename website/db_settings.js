////
////  DATABASE SETTINGS
////


function load_db_settings(db_name, event) {
  if (event) {event.stopPropagation(); }           //  Prevent the schema from opening when the gear is clicked
  _selected_db.name = db_name;
  window.history.pushState({ },"", `/db-settings/${_selected_db.name}`);
  unrender_all();
  document.getElementById('db-settings-container').style.display = 'block';
  render_db_settings();
  render_side_bar();
  //  DB name -- lowercase alphanumeric and _ only
  const username_input = document.getElementById('db-name');
  const username_regex = /^[a-z0-9_]*$/;
  username_input.addEventListener("keydown", event => {
    if (!username_regex.test(event.key) && !_utility_keys.includes(event.keyCode)) {
      event.preventDefault();
      document.getElementById('db-name-error').innerHTML = "Username can only contain lowercase letters, numbers, and underscores.";
    } else {
      document.getElementById('db-name-error').innerHTML = "";
    }
  });

}

function render_db_settings() {
  document.getElementById('top-bar-title').innerHTML = `<h3 style="margin: 0px;">Database settings: ${_selected_db.name}</h3>`;
  document.getElementById('db-name').value = _selected_db.name;

}

//  Update the name of the currently selected database
function update_db_name() {
  let new_db_name = document.getElementById('db-name').value;
  http.open('POST', `/api/update-db-name`);
  http.send(JSON.stringify({
    username: _current_user.username,
    old_name: _selected_db.name,
    new_name: new_db_name
  }));
  http.onreadystatechange = (e) => {
    if (http.readyState == 4 && http.status == 200) {
      let response = JSON.parse(http.responseText);
      if (response.error) {
        document.getElementById('db-name-error').innerHTML = response.msg;
        return;
      }
      let selected_index = _db_list.indexOf(_selected_db.name);
      _db_list[selected_index] = new_db_name;
      _selected_db.name = new_db_name;
      render_db_settings();
      render_side_bar();
    } else if (http.readyState == 4 && http.status == 404) {
      document.getElementById('db-name-error').innerHTML = 'Error: API route not available! Contact site admin.';
    }
  }
}

//  Delete the database
function delete_db() {
  if (!confirm(`All tables and table data will be deleted. Are you sure you want to delete "${_selected_db.name}"?`)) {
    return;
  }
  http.open('POST', `/api/delete-db`);
  http.send(JSON.stringify({
    username: _current_user.username,
    db_name: _selected_db.name,
  }));
  http.onreadystatechange = (e) => {
    if (http.readyState == 4 && http.status == 200) {
      let response = JSON.parse(http.responseText);
      if (response.error) {
        document.getElementById('db-name-error').innerHTML = response.msg;
        return;
      }
      let selected_index = _db_list.indexOf(_selected_db.name);
      _db_list.splice(selected_index, 1);
      render_side_bar();
      load_dashboard();
    } else if (http.readyState == 4 && http.status == 404) {
      document.getElementById('db-name-error').innerHTML = 'Error: API route not available! Contact site admin.';
    }
  }
}