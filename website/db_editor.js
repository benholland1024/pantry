////
////  DB SCHEMA EDITOR
////

let _is_mouse_down = false;
let _last_x = 0;                    //  These are used for tracking the distance the mouse moves.
let _last_y = 0;                    //   ^
let _selected_schema_table = -1;    //  The selected table to move.
let _selected_fk_output = {         //  The selected table & column for moving FK wires.
  table_idx: -1,
  col_idx: -1
}
let _zoom = 0;                      //  The amount we're zoomed in or out. Controlled by scroll.
let _pan_x = 0;                     //  The amount we're panned, left or right. 
let _pan_y = 0;                     //    ^ 

const _table_width = 250;


function load_schema() {
  window.history.pushState({ },"", `/database/${_selected_db.name}`);
  unrender_all();
  render_side_bar();
  document.getElementById('schema-display-container').style.display = "block";
  document.getElementById('top-bar-title').innerHTML = `<h3 style="margin:0px"><span style="font-weight:normal">Database:</span> ${_selected_db.name}</h3>`;
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

  //  Mouse down event handler
  _event_listeners.mousedown = function(e) {
    _is_mouse_down = true;
    _last_x = e.clientX;
    _last_y = e.clientY;
    if (_selected_schema_table > -1 || _selected_fk_output.table_idx > -1) { //  If we've grabbed a line or table...
      document.getElementById('schema-display').classList.add('cursor-grabbing');
    }
  }
  document.addEventListener('mousedown', _event_listeners.mousedown);

  //  Mouse up handler
  _event_listeners.mouseup = function(e) {
    
    let rerender = false;
    //  If we're releasing a fk line, check if we're releasing on an input
    let el;
    if (_selected_fk_output.table_idx > -1) { //  If we've selected an FK line...
      rerender = true;
      el = e.target;                   //  Get the element we just released the mouse over.
      while (el && !el.classList.contains('schema-table')) {  //  Search for a parent with class="schema-table"
        el = el.parentElement;
      }
    }
    if (el && el.classList.contains('schema-table')) {        //  If a parent had class="schema-table"...
      let fk_input_table_idx = Number(el.id.split('-')[2]);   ///   Then use the id to get the table index. Ex: id="s-table-3"
      let fk_output_table_idx = _selected_fk_output.table_idx;
      let fk_output_col_idx = _selected_fk_output.col_idx;
      let fk_output_table = _schema_data[fk_output_table_idx];
      
      fk_output_table.columns[fk_output_col_idx].fk_input_dest = fk_input_table_idx;  //  Assign that index to the column's .fk_input_dest

    } else if (_selected_schema_table >= 0) {
      rerender = true;
    }
    _is_mouse_down = false;
    _selected_schema_table = -1;
    _selected_fk_output = [-1,-1];
    document.getElementById('schema-display').classList.remove('cursor-grabbing');
    if (rerender) {     requestAnimationFrame(render_schema);    }
  }
  document.addEventListener('mouseup', _event_listeners.mouseup);

  //  Mouse move handler
  _event_listeners.mousemove = function(e) {

    //  Move a table:
    if (_is_mouse_down && _selected_schema_table > -1) {
      window.getSelection().removeAllRanges();
      move_table(e);
    }

    //  Move the wire connecting FK's to other tables. 
    else if (_is_mouse_down && _selected_fk_output.table_idx > -1) {
      window.getSelection().removeAllRanges();
      let table_idx = _selected_fk_output.table_idx;
      let col_idx = _selected_fk_output.col_idx;
      const bounding_box = document.getElementById('schema-display').getBoundingClientRect();
      _schema_data[table_idx].columns[col_idx].fk_x_pos = e.clientX - bounding_box.left;
      _schema_data[table_idx].columns[col_idx].fk_y_pos = e.clientY - bounding_box.top;
      requestAnimationFrame(render_schema);

    } //else if (_is_mouse_down) {  //  Pan 
    //   _pan_x += e.clientX - _last_x;
    //   _last_x = e.clientX;

    //   _pan_y += e.clientY - _last_y;
    //   _last_y = e.clientY;
    //   requestAnimationFrame(render_schema);
    // }
    
  }
  document.addEventListener('mousemove', _event_listeners.mousemove);

  //  Detect and react to scroll
  _event_listeners.wheel = function(event) {
    // if (event.deltaY > 0 && _zoom > -100) {
    //     _zoom--;
    // } else if (event.deltaY < 0 && _zoom < 200) {
    //     _zoom++;
    // }
    // requestAnimationFrame(render_schema);
  }
  document.addEventListener("wheel", _event_listeners.wheel);
}

//  Move a table in reaction to a mousemove event
function move_table(e) {
  let x_movement = e.clientX - _last_x;
  _schema_data[_selected_schema_table].x_pos += x_movement;
  _last_x = e.clientX;

  let y_movement = e.clientY - _last_y;
  _schema_data[_selected_schema_table].y_pos += y_movement;
  _last_y = e.clientY;

  requestAnimationFrame(render_schema);
}

//  This function gets the initial position of schema tables, including wrapping.
function set_schema_pos() {
  const default_gap = 40;
  let window_width = document.getElementById('schema-display').offsetWidth;
  let wrap_count = 0;
  let tables_per_row = 0; //  The amount of tables that fit before we need to wrap.
  for (let i = 0; i < _schema_data.length; i++) {
    let table = _schema_data[i];
    let x_pos = default_gap + i * (_table_width + default_gap);
    if (tables_per_row > 0) {
      x_pos -= tables_per_row * (_table_width + default_gap)
    }
    if (x_pos + _table_width > window_width && i > 0) {
      wrap_count++;
      if (tables_per_row == 0) { tables_per_row = i; }
      x_pos = default_gap + (i % tables_per_row) * (_table_width + default_gap)
    }
    let y_pos = default_gap + 200 * wrap_count;
    table.y_pos = y_pos;
    table.x_pos = x_pos;
  }
}

//  Render the schema
function render_schema() {

  //  Return if we're not on the right page. "requestanimationframe" can cause issues otherwise.
  if (window.location.pathname.split('/')[1] != 'database' || window.location.pathname.split('/').length > 3 ) {
    return;
  }

  let svg_container = document.getElementById('schema-display');
  let schema_html = `<svg width="${svg_container.offsetWidth}" height="${svg_container.offsetHeight}" style="z-index: 2;">`;
  for (let i = 0; i < _schema_data.length; i++) {  // Iterate thru tables...
    let table = _schema_data[i];
    for (let j = 0; j < table.columns.length; j++) {  //  Iterate thru columns per table...
      let column = table.columns[j];
      //  Render fk line while dragging:
      if (column.datatype == 'fk' && _selected_fk_output.table_idx == i && _selected_fk_output.col_idx == j) {
        schema_html += `<line 
          x1="${table.x_pos + _table_width + 10}" 
          y1="${table.y_pos + (j*23) + 52 }" 
          x2="${column.fk_x_pos}" 
          y2="${column.fk_y_pos}" 
          style="stroke:gray;stroke-width:2" 
        />`; //  The line ends at x2, y2.  This is where the fk_x_pos is (via onmousemove) OR 
      
        // Render fk line if connected & not dragging:
      } else if (column.datatype == 'fk' && column.fk_input_dest > -1) {
        //  Get the x pos and y pos of the "input destination table"
        let dest_table = _schema_data[column.fk_input_dest];

        schema_html += `<line 
          x1="${table.x_pos + _table_width + 10}" 
          y1="${table.y_pos + (j*23) + 52 }" 
          x2="${dest_table.x_pos}" 
          y2="${dest_table.y_pos + 52}" 
          style="stroke:gray;stroke-width:2" 
        />`;
      } 
    }
  }
  schema_html +=  `</svg>`;
  for (let i = 0; i < _schema_data.length; i++) {
    let table = _schema_data[i];
    schema_html += `<div class="schema-table" id="s-table-${i}" style="left: ${table.x_pos}px; top: ${table.y_pos}px;" >`;
    schema_html += `<h4 
      class="schema-table-name"
    >
      <input type="text" id="col-name-${i}" value="${table.name}" onchange="_schema_data[${i}].name = event.target.value"/>
      <div class="schema-table-icon table-mover" onmousedown="_selected_schema_table = ${i}">&#10018;</div>
      <div class="schema-table-icon" onclick="delete_schema_table(${i})">&#128465;</div>
    </h4>`;
    for (let j = 0; j < table.columns.length; j++ ) {
      let column = table.columns[j];

      //  The next line determines whether to add the "connected-input" class to a table.
      let is_selected_input = (column.snakecase == 'id' && get_fk_output_from_input(i).table_idx != -1) ? 'connected-input' : '';

      //  The code for the table.
      schema_html += `<div class="schema-table-column">
        ${ column.snakecase == 'id' ? `<div class="fk-input ${is_selected_input}" id="fk-input-${i}" onmousedown="table_input_click(${i})"></div>` : '' }
        <div class="schema-col-name">
          <input 
            type="text" 
            id="col-name-${i}-${j}" 
            style="field-sizing: content" 
            value="${column.name}"
            onchange="_schema_data[${i}].columns[${j}].name = event.target.value"
            ${column.snakecase == 'id' ? 'readonly' : ''}
          >
        </div>
        <div class="schema-col-type">
          ${get_datatype_dropdown(
            column.datatype == 'fk' ? `fk-${column.fk_input_dest}` : column.datatype, 
            'i-' + i + '-' + j, 
            'update_type(' + i + ',' + j + ')',
            column.snakecase == 'id' ? 'disabled' : ''
          )}
        </div>
        ${ column.datatype == 'fk' ? `<div class="fk-output" onmousedown="_selected_fk_output = {table_idx: ${i}, col_idx: ${j}}"></div>` : ''}
      </div>`
    } //  End loop through columns. 
    schema_html += `<div 
        class="schema-add-a-column-btn" 
        onclick="_schema_data[${i}].columns.push({ name: 'Column ' + ${table.columns.length+1}, unique: false, required: false, datatype: 'string' }); 
          render_schema();"
      >
        + Add a column
    </div>`;
    schema_html += `</div>`;
  }
  document.getElementById('schema-display').innerHTML = schema_html;

  //  Not currently used (TODO):
  document.getElementById('schema-display').style.transform = `scale(${1 + _zoom * 0.01}) translate(${_pan_x}px, ${_pan_y}px)`
  
  //  Render "add a table" and "save" buttons
  document.getElementById('action-button-container').innerHTML = `<button onclick="add_table_to_schema()">+ Add a table</button>&nbsp;&nbsp;&nbsp;&nbsp;`;
  document.getElementById('action-button-container').innerHTML += `<button onclick="update_db()">&#128190; Save changes</button>`;

}

//  This function takes a table index, and, if a FK references that table,
//    returns the table & column.
//    It's used in table_input_click. 
function get_fk_output_from_input(table_idx) {
  for (let i = 0; i < _schema_data.length; i++) {  //  Search thru tables
    if (i != table_idx) {
      let table = _schema_data[i];
      for (let j = 0; j < table.columns.length; j++) {
        if (table.columns[j].datatype == 'fk' && table.columns[j].fk_input_dest == table_idx) {
          return { table_idx: i, col_idx: j };
        }
      }
    }
  }
  return { table_idx: -1, col_idx: -1 };
}

//  This fires when you click on an "input" of a table. 
//   It allows you to move an FK wire if it's attached to that input. 
function table_input_click(table_idx) {
  let output = get_fk_output_from_input(table_idx);
  if (output.table_idx == -1) {
    return;
  } else {
    _selected_fk_output = output;
  }
}

//  Update the datatype of a table column
function update_type(table_idx, column_idx) {
  let new_val = document.getElementById(`i-${table_idx}-${column_idx}`).value;
  _schema_data[table_idx].columns[column_idx].fk_input_dest = Number(new_val.split('-')[1])
  _schema_data[table_idx].columns[column_idx].datatype = 'fk';
  render_schema();
  requestAnimationFrame(render_schema);
}

//  Fires when you click the "+ Add a table" button
function add_table_to_schema() {
  console.log(_schema_data);
  _schema_data.push({
    name: 'New Table ' + (_schema_data.length + 1),
    snakecase: 'new-table-' + (_schema_data.length + 1),
    max_id: 0,
    columns: [{ name: 'Id', snakecase: 'id', unique: true, required: true, datatype: 'number' }],
    x_pos: 0,
    y_pos: 0
  });
  set_schema_pos();
  requestAnimationFrame(render_schema);
}

//  Delete a table
function delete_schema_table(index) {
  if (!confirm(`Delete the table "${_schema_data[index].name}"?`)) {
    return;
  }
  _schema_data.splice(index, 1);
  requestAnimationFrame(render_schema);
}

//  Update the entire DB, including all the table's metadata if needed 
function update_db() {

  if (!confirm(`Are you sure you want to update the database "${_selected_db.name}"?  ROW DATA MAY BE LOST!!`)) {
    return;
  }
  
  //  Ensure all tables have a snakecase.
  for (let i = 0; i < _schema_data.length; i++) {
    _schema_data[i].snakecase = to_snakecase(_schema_data[i].name)
  }

  http.open("POST", `/api/update-db?username=${_current_user.username}&db_name=${_selected_db.name}`);
  http.send(JSON.stringify(_schema_data));
  http.onreadystatechange = (e) => {
    if (http.readyState == 4 && http.status == 200) {
      let response = JSON.parse(http.responseText);
      if (!response.error) {
        console.log("Wowza!  Updated the whole database!")
        load_database(_selected_db.name);
        render_side_bar();
      } else {
        document.getElementById('error').innerHTML = response.msg;
      }
    }
  }
}