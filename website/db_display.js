////
////  DB SCHEMA EDITOR
////

let _is_mouse_down = false;
let _last_x = 0;
let _last_y = 0;
let _selected_schema_table = -1;

function load_schema() {
  window.history.pushState({ },"", `/database/${_selected_db.name}`);
  document.getElementById('top-bar-title').innerHTML = `<h3><span style="font-weight:normal">Database:</span> ${_selected_db.name}</h3>`;
  unrender_all();
  http.open("GET", `/api/all-table-metadata?username=${_current_user.username}&database=${_selected_db.name}`);
  http.send();
  http.onreadystatechange = (e) => {
    if (http.readyState == 4 && http.status == 200) {
      let table_metadata = JSON.parse(http.responseText);
      _schema_data = table_metadata;
      set_schema_pos();
      render_schema();
    }
  }

  document.addEventListener('mousedown', (e) => {
    _is_mouse_down = true;
    _last_x = e.clientX;
    _last_y = e.clientY;
  });
  document.addEventListener('mouseup', () => {
    _is_mouse_down = false;
    _selected_schema_table = -1;
  });
  document.addEventListener('mousemove', (e) => {
    if (_is_mouse_down && _selected_schema_table >= 0) {

      let x_movement = e.clientX - _last_x;
      _schema_data[_selected_schema_table].x_pos += x_movement;
      _last_x = e.clientX;

      let y_movement = e.clientY - _last_y;
      _schema_data[_selected_schema_table].y_pos += y_movement;
      _last_y = e.clientY;

      requestAnimationFrame(render_schema);
      // Perform actions while the mouse is held down and moving
    }
});

}

function set_schema_pos() {
  const default_gap = 40;
  let window_size = document.getElementById('schema-display').innerWidth;
  for (let i = 0; i < _schema_data.length; i++) {
    let table = _schema_data[i];
    table.y_pos = default_gap;
    table.x_pos = (200 + default_gap) * i + default_gap;
  }
}

//  Render the schema
function render_schema() {

  let schema_html = ``;
  for (let i = 0; i < _schema_data.length; i++) {
    let table = _schema_data[i]
    schema_html += `<div class="schema-table" 
      style="left: ${table.x_pos}px; top: ${table.y_pos}px;"
      onmousedown="_selected_schema_table = ${i}"
    >`;
    schema_html += `<h4 class="schema-table-name">${ table.name }</h4>`;
    for (let j = 0; j < table.columns.length; j++ ) {
      schema_html += `<div class="schema-table-column">${table.columns[j].name}</div>`
    }
    schema_html += `</div>`;
  }
  document.getElementById('schema-display').innerHTML = schema_html;
  
}
