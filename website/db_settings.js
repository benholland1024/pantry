////
////  DATABASE SETTINGS
////

//  Runs when you open the db-settings page
function load_db_settings(db_name, event) {
  if (event) {event.stopPropagation(); }           //  Prevent the schema from opening when the gear is clicked
  _selected_table = {}; 
  _selected_db.name = db_name;
  window.history.pushState({ },"", `/db-settings/${_selected_db.name}`);
  unrender_all();

  document.getElementById('db-settings-container').style.display = 'block';
  render_db_settings();
  render_side_bar();

  //  Render API key
  let key = _db_data[_selected_db.name].api_key;
  document.getElementById('api-code-container').innerHTML = `<h4>Your API key:</h4>
    <pre>${key}</pre>
    <button style="font-size: 0.8em"
      id="copy-db-api-code"
      onclick="copyTextToClipboard('${key}'); document.getElementById('copy-db-api-code').innerHTML = 'Copied!';"
    >Copy this code!</button>`;

  //  DB name -- lowercase alphanumeric and _ only
  const username_input = document.getElementById('db-name');
  console.log(_utility_keys);
  const username_regex = /^[a-z0-9_]*$/;
  username_input.addEventListener("keydown", event => {
    console.log
    if (!username_regex.test(event.key) && !_utility_keys.includes(event.key)) {
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
  if (new_db_name == _selected_db.name) {
    return;
  }
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
      _db_data[new_db_name] = _db_data[to_slug(_selected_db.name)];
      delete _db_data[to_slug(_selected_db.name)];
      _selected_db.name = new_db_name;
      render_db_settings();
      render_side_bar();
    } else if (http.readyState == 4 && http.status == 404) {
      document.getElementById('db-name-error').innerHTML = 'Error: API route not available! Contact site admin.';
    }
  }
}

//
function confirm_delete_db() {
  open_popup(`
    <p>
      All tables and table data will be deleted. 
      Are you sure you want to delete <span style="color:var(--blue)">${_selected_db.name}</span>?
    </p>
    <button onclick="delete_db()" id="focus">Yes, delete this database</button>&nbsp;
    <button onclick="close_popup()">No, don't delete</button>
  `);
}

//  Delete the database
function delete_db() {
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
      delete _db_data[to_slug(_selected_db.name)];
      render_side_bar();
      load_dashboard();
    } else if (http.readyState == 4 && http.status == 404) {
      document.getElementById('db-name-error').innerHTML = 'Error: API route not available! Contact site admin.';
    }
    close_popup();
  }
}