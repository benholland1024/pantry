////
////  DASHBOARD
////


function load_dashboard() {
  if (!_current_user.username) {
    return;
  }
  _selected_db = { name: '' };
  window.history.pushState({ },"", `/dashboard`);
  unrender_all();
  document.getElementById('dashboard').style.display = 'block';
  render_dashboard();
  render_side_bar();
}

//  Render the dashboard, including the database display
function render_dashboard() {
  document.getElementById('top-bar-title').innerHTML = `<h3 style="margin: 0px;">${_current_user.username}'s Dashboard</h3>`;
  let dash_db_list = ``;
  let db_list = Object.keys(_db_data);
  for (let i = 0; i < db_list.length; i++) {
    let key = _db_data[db_list[i]].api_key;
    dash_db_list += `<div class="dash-db">
      <br/>
      ${db_list[i]}<br/>
      <button style="font-size: 0.8em; padding: 2px 10px;margin-top:5px;"
        id="copy-db-api-code-${i}"
        onclick="copyTextToClipboard('${key}'); document.getElementById('copy-db-api-code-${i}').innerHTML = 'Copied!';"
      >Copy API key</button>
    </div>`;
  }

  dash_db_list += `<div class="dash-db dash-db-empty" onclick="create_db()"><br/>+ Create a Database</div>`;
  document.getElementById('dash-db-list').innerHTML = dash_db_list;
}