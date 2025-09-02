////
////  DB SCHEMA EDITOR
////

let _is_mouse_down = false;
let _cursor_mode    = 'cursor';      //  Options: 'cursor', 'add-table', 'eraser'
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

/**
 * Initializes the schema display.
 *  - Changes the URL, updates side & top bar
 *  - Gets all table metadata, then calls render_schema()
 *  - 
 */
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
      //  Get reasonable positions for all tables, ONLY if we don't already have pos data
      if (_schema_data.length >= 1 && typeof _schema_data[0].x_pos != 'number') {
        set_schema_pos();
      }
      // If any tables don't yet have positions, give them one. 
      for (let i = 0; i < _schema_data.length; i++) {
        if (typeof _schema_data[i].x_pos != 'number') {
          _schema_data[i].x_pos = 10 * i;
          _schema_data[i].y_pos = 10 * i;
        }
      }
      render_schema();
      render_action_bar();
    }
  }

  //  Mouse down event handler
  _event_listeners.mousedown = function(e) {

    let isRightMB = false;  //  Are we clicking with the right mouse button?
    if ("which" in e)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
      isRightMB = e.which == 3; 
    else if ("button" in e)  // IE, Opera 
      isRightMB = e.button == 2; 

    //  Are we clicking on a text input or dropdown?
    let isClickOnInput = ['i', 'col'].includes(e.target.id.split('-')[0]);

    if (!isRightMB && !isClickOnInput) {
      _is_mouse_down = true;
    }
    
    _last_x = e.clientX;
    _last_y = e.clientY;
    if (_selected_schema_table > -1 || _selected_fk_output.table_idx > -1) { //  If we've grabbed a line or table...
      document.getElementById('schema-display').classList.add('cursor-grabbing');
    }
  }
  document.addEventListener('mousedown', _event_listeners.mousedown);

  //  Mouse up handler
  _event_listeners.mouseup = function(e) {
    
    //  
    //  This first section handles FK line dragging logic
    //
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
    if (el && el.classList.contains('schema-table')) {             //  If a parent had class="schema-table"...
      let fk_input_table_idx = Number(el.id.split('-')[2]);        //   Then use the id to get the table index. Ex: id="s-table-3"
      let fk_input_table_id = _schema_data[fk_input_table_idx].table_id; //   Now get that input table's table_id. 

      let fk_output_table_idx = _selected_fk_output.table_idx;
      let fk_output_col_idx = _selected_fk_output.col_idx;
      let fk_output_table = _schema_data[fk_output_table_idx];
      
      fk_output_table.columns[fk_output_col_idx].fk_input_dest = fk_input_table_id;  //  Assign that index to the column's .fk_input_dest
      update_schema_table(fk_output_table_idx);

    } else if (_selected_schema_table >= 0) {                      //  Or, if we're grabbing a table, not an FK line, then just rerender.
      rerender = true;
      update_schema_table(_selected_schema_table);
    }
    _is_mouse_down = false;
    _selected_schema_table = -1;
    _selected_fk_output = [-1,-1];
    document.getElementById('schema-display').classList.remove('cursor-grabbing');

    // 
    //  Here, we'll handle adding a table
    //
    let display = document.getElementById('schema-display').getBoundingClientRect();
    let action_bar = document.getElementById('action-bar').getBoundingClientRect();
    if (_cursor_mode == 'add-table' && 
      e.clientX > display.left && 
      e.clientY > display.top &&
      e.clientX < action_bar.left) {
      add_table_to_schema(e.clientX - display.left, e.clientY - display.top);
    }

    if (rerender) {     
      requestAnimationFrame(render_schema);
    }
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

    } else if (_cursor_mode == 'add-table') {
      let container = document.getElementById('schema-display').getBoundingClientRect();
      if (e.clientX < container.left || e.clientY < container.top) {return;}
      _schema_data[_schema_data.length-1].x_pos = e.clientX - container.left;
      _schema_data[_schema_data.length-1].y_pos = e.clientY - container.top;
      render_schema();
    }
    else if (_is_mouse_down) {  //  Pan 
      _pan_x += e.clientX - _last_x;
      _last_x = e.clientX;

      _pan_y += e.clientY - _last_y;
      _last_y = e.clientY;
      requestAnimationFrame(render_schema);
    }
    
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
  window.addEventListener('resize', () => {
    render_schema();
  });
}

/**
 * Move a table in reaction to a mousemove event
 * @param {Object} e - Represents the mousemove event.
 */
function move_table(e) {
  let x_movement = e.clientX - _last_x;
  _schema_data[_selected_schema_table].x_pos += x_movement;
  _last_x = e.clientX;

  let y_movement = e.clientY - _last_y;
  _schema_data[_selected_schema_table].y_pos += y_movement;
  _last_y = e.clientY;

  requestAnimationFrame(render_schema);
}

//  Gets the x and y position for a specific table.  
//    Used for "new tables". TODO: This needs redesigned. 
function get_schema_table_pos(table_index) {
  const default_gap = 40;
  let window_width = document.getElementById('schema-display').offsetWidth;
  let wrap_count = 0;
  let tables_per_row = 0; //  The amount of tables that fit before we need to wrap.
  for (let i = 0; i <= table_index; i++) {
    let table = _schema_data[i];
    let x_pos = default_gap + i * (_table_width + default_gap);
    if (tables_per_row > 0) {
      x_pos -= tables_per_row * (_table_width + default_gap) * wrap_count;
    }
    if (x_pos + _table_width > window_width && i > 0) {
      wrap_count++;
      if (tables_per_row == 0) { tables_per_row = i; }
      x_pos = default_gap + (i % tables_per_row) * (_table_width + default_gap)
    }
    if (i == table_index) {
      let y_pos = default_gap + 200 * wrap_count;
      return {
        y_pos: y_pos,
        x_pos: x_pos
      }
    }
  }
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
      x_pos -= tables_per_row * (_table_width + default_gap) * wrap_count;
    }
    //  If the current table would be shown off the screen in the x direction...
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

  //  Render the SVG container, and the lines between boxes! 
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
        let dest_table_idx = _schema_data.findIndex((table) => {
          return table.table_id == column.fk_input_dest;
        })
        let dest_table = _schema_data[dest_table_idx];

        let table_el = document.getElementById(`s-table-${i}`);
        let table_width = table_el ? table_el.offsetWidth : _table_width
        schema_html += `<line 
          x1="${table.x_pos + table_width + 10}" 
          y1="${table.y_pos + (j*23) + 52 }" 
          x2="${dest_table.x_pos}" 
          y2="${dest_table.y_pos + 52}" 
          style="stroke:gray;stroke-width:2" 
        />`;
      } 
    }
  }
  schema_html +=  `</svg>`;

  //
  //  Rendering the tables themselves!
  //
  let table_list = [];  //  We need this for rendering foreign key options
  for (let i = 0; i < _schema_data.length; i++) {
    table_list.push(_schema_data[i].name);
  }
  for (let i = 0; i < _schema_data.length; i++) {
    let table = _schema_data[i];
    let ghostly = (_cursor_mode == 'add-table' && i == _schema_data.length-1) ? 'opacity:0.5;' : '';
    schema_html += `<div class="schema-table" id="s-table-${i}" style="left: ${table.x_pos}px; top: ${table.y_pos}px; ${ghostly}" >`;
    if (_cursor_mode == 'eraser') {
      schema_html += `<div class="schema-table-delete-warning" onclick="confirm_delete_schema_table(${i})"></div>`;
    }
    schema_html += `<h4 
      class="schema-table-name"
    >
      <input 
        type="text" id="col-name-${i}" value="${table.name}" 
        onchange="_schema_data[${i}].name = event.target.value"
        onblur="update_schema_table(${i})"
      />
      <div class="schema-table-icon table-mover" onmousedown="_selected_schema_table = ${i}">&#10018;</div>
    </h4>`;
    for (let j = 0; j < table.columns.length; j++ ) {
      let column = table.columns[j];

      //  The next line determines whether to add the "connected-input" class to a table.
      let is_selected_input = (to_slug(column.name) == 'id' && get_fk_output_from_input(i).table_idx != -1) ? 'connected-input' : '';

      //  The code for the table's columns. 
      schema_html += `<div class="schema-table-column">
        ${ to_slug(column.name) == 'id' ? `<div class="fk-input ${is_selected_input}" id="fk-input-${i}" onmousedown="table_input_click(${i})"></div>` : '' }
        <div class="schema-col-name">
          <input 
            type="text" 
            id="col-name-${i}-${j}" 
            style="field-sizing: content" 
            value="${column.name}"
            onchange="_schema_data[${i}].columns[${j}].name = event.target.value"
            onblur="update_schema_table(${i})"
            ${to_slug(column.name) == 'id' ? 'readonly' : ''}
          >
        </div>
        <div class="schema-col-type">
          ${get_datatype_dropdown(
            column.datatype == 'fk' ? `fk-${column.fk_input_dest}` : column.datatype, 
            {
              id: 'i-' + i + '-' + j, 
              onchange: 'update_schema_col_datatype(' + i + ',' + j + ')',
              disabled: to_slug(column.name) == 'id' ? 'disabled' : '',
              table_name: table.name,
              table_list: table_list
            }
          )}
        </div>
        ${ column.datatype == 'fk' ? `<div class="fk-output" onmousedown="_selected_fk_output = {table_idx: ${i}, col_idx: ${j}}"></div>` : ''}
      </div>`
    } //  End loop through columns. 
    schema_html += `<div 
        class="schema-add-a-column-btn" 
        onclick="add_a_column(${i})"
      >
        + Add a column
    </div>`;
    schema_html += `</div>`;
  }

  document.getElementById('schema-display').innerHTML = schema_html;

  //  Zoom is not currently used (TODO):
  document.getElementById('schema-display').style.transform = `scale(${1 + _zoom * 0.01}) translate(${_pan_x}px, ${_pan_y}px)`
  
  //  Render "add a table" and "save" buttons
  document.getElementById('action-button-container').innerHTML = `<button onclick="set_schema_pos(); render_schema()">
    &#10227; Reset table positions
  </button>&nbsp;&nbsp;&nbsp;&nbsp;`;
  // document.getElementById('action-button-container').innerHTML += `<button onclick="confirm_update_db()">&#128190; Save changes</button>`;
  
}

function render_action_bar() {

  let action_bar_html = `
    <div class="action-bar-icon ${ _cursor_mode == 'cursor' ? 'selected' : '' }" onclick="enter_cursor_mode();">
      <div class="action-bar-tooltip">Move & edit tables</div>
      <img src="/assets/cursor.svg" /><!--  mouse cursor icon  -->
    </div>
    <div class="action-bar-icon ${ _cursor_mode == 'add-table' ? 'selected' : '' }" onclick="enter_add_table_mode();">
      <div class="action-bar-tooltip">Add tables</div>
     <img src="/assets/table.svg" /><!--   table adder icon  -->
    </div>
    <div class="action-bar-icon ${ _cursor_mode == 'eraser' ? 'selected' : '' }" onclick="enter_eraser_mode();">
      <div class="action-bar-tooltip">Delete tables</div>
      <img src="/assets/eraser.svg" /><!--      eraser icon    -->
    </div>
  `;
  document.getElementById('action-bar').innerHTML = action_bar_html;
}

/**
 * Fires when you click the table icon in the action bar. 
 */
function enter_add_table_mode() {
  _cursor_mode = 'add-table';
  render_action_bar();
  _schema_data.push({ 
    name: 'New Table ' + (_schema_data.length + 1),
    max_id: 0,
    columns: [{ name: 'Id', slug: 'id', unique: true, required: true, datatype: 'number' }],
    x_pos: _last_x,
    y_pos: _last_y
  });
  _selected_schema_table = _schema_data.length - 1;
  document.getElementById('schema-display').classList.add('cursor-crosshair');
  render_schema();
}

/**
 * Called in enter_cursor_mode() and enter_eraser_mode().  
 * Removes the ghost table and pointer cursor.. 
 */
function exit_add_table_mode() {
  if (_cursor_mode != 'add-table') { return; }
  _schema_data.pop();
  document.getElementById('schema-display').classList.remove('cursor-crosshair');
}

/**
 * Called when you click the cursor icon in the action bar.
 */
function enter_cursor_mode() {
  exit_add_table_mode();
  _cursor_mode = 'cursor';
  render_action_bar();
  render_schema();
}

/**
 * Called when you click the eraser icon in the action bar. 
 */
function enter_eraser_mode() {
  exit_add_table_mode();
  _cursor_mode = 'eraser';
  render_action_bar();
  document.getElementById('schema-display').classList.add('eraser-mode');
  render_schema();
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

/**
 * Updates a table.  Used to update any column name or datatype.
 * @param {number} table_idx 
 */
function update_schema_table(table_idx) {
  let table = _schema_data[table_idx];
  saving_alert();
  let update_row_api_route = `/api/update-table?username=${_current_user.username}&db_name=${_selected_db.name}`;
  update_row_api_route += `&table_id=${table.table_id}`;
  http.open("POST", update_row_api_route);
  http.send(JSON.stringify(table));
  http.onreadystatechange = (e) => {
    let response;      
    if (http.readyState == 4 && http.status == 200) {
      response = JSON.parse(http.responseText);
      if (!response.error) {
        console.log("Updated table :)")
        close_popup();
        requestAnimationFrame(render_schema);
      } else {
        document.getElementById('error').innerHTML = response.msg;
      }
    }
  }
}

//  Update the datatype of a table column
function update_schema_col_datatype(table_idx, column_idx) {
  let new_val = document.getElementById(`i-${table_idx}-${column_idx}`).value;
  if (new_val.split('-')[0] == 'fk') {
    let fk_input_dest_idx = Number(new_val.split('-')[1]);
    let fk_input_dest_id = _schema_data[fk_input_dest_idx].table_id;
    _schema_data[table_idx].columns[column_idx].fk_input_dest = fk_input_dest_id;
    _schema_data[table_idx].columns[column_idx].datatype = 'fk';
  } else {
    _schema_data[table_idx].columns[column_idx].datatype = new_val;
  }
  update_schema_table(table_idx);  //  This re-renders the schema once finished
}

//  Fires when you click the "+ Add a table" button
function add_table_to_schema(x_pos, y_pos) {
  saving_alert();
  let new_table = {
    name: 'New Table ' + _schema_data.length,  //  No need to add 1 bc of ghost table
    max_id: 0,
    columns: [{ name: 'Id', slug: 'id', unique: true, required: true, datatype: 'number' }],
    x_pos: x_pos,
    y_pos: y_pos
  };

  http.open("POST", `/api/create-table?username=${_current_user.username}&db_name=${_selected_db.name}`);
  http.send(JSON.stringify(new_table));
  http.onreadystatechange = (e) => {
    let response;      
    if (http.readyState == 4 && http.status == 200) {
      response = JSON.parse(http.responseText);
      if (!response.error) {
        console.log("Added table :)")
        new_table.table_id = response.table_id;
        _table_list.push(to_slug(new_table.name));
        _schema_data.splice(-1, 0, new_table);  //  Add to 2nd to last index, skipping the ghost
        _schema_data[_schema_data.length-1].name = 'New Table ' + _schema_data.length;
        close_popup();
        render_side_bar();
        requestAnimationFrame(render_schema);
      } else {
        document.getElementById('error').innerHTML = response.msg;
      }
    }
  }
  requestAnimationFrame(render_schema);
}

/**
 * Add a column to a table
 * @param {number} table_idx 
 */
function add_a_column(table_idx) {
  let table = _schema_data[table_idx];
  table.columns.push({ name: 'Column ' + (table.columns.length + 1), unique: false, required: false, datatype: 'string' }); 
  update_schema_table(table_idx)
}

//  Open a popup to confirm that the user wants to delete the schema table
function confirm_delete_schema_table(index) {
  open_popup(`
    <p>Delete the table "${_schema_data[index].name}"?</p>
    <button onclick="delete_schema_table(${index})" id="focus">Yes, delete it!</button>&nbsp;
    <button onclick="close_popup()">No, don't delete</button>
  `);
}

//  Delete a table
function delete_schema_table(index) {
  saving_alert();
  let table_name = to_slug(_schema_data[index].name);
  http.open("POST", `/api/delete-table?username=${_current_user.username}&db_name=${_selected_db.name}&table_name=${table_name}`);
  http.send();
  http.onreadystatechange = (e) => {
    let response;      
    if (http.readyState == 4 && http.status == 200) {
      response = JSON.parse(http.responseText);
      if (!response.error) {
        console.log("Deleted a table!");
        _schema_data.splice(index, 1);
        requestAnimationFrame(render_schema);
        close_popup();

        let table_name_idx = _table_list.indexOf(table_name);
        _table_list.splice(table_name_idx, 1);
        render_side_bar();
      } else {
        document.getElementById('error').innerHTML = response.msg;
      }
    }
  }
}

//  Prompt the user to confirm whether they want to save the DB changes.
function confirm_update_db() {
  open_popup(`
    <p>
      Are you sure you want to update the database 
      <span class="blue">${_selected_db.name}</span>? </p>
    <p>Row data may be lost!!</p>
    <br/>
    <button onclick="update_db()" id="focus">Yes, save changes.</button>&nbsp;
    <button onclick="close_popup()">No, keep editing</button>`);
}

//  Update the entire DB, including all the table's metadata if needed 
function update_db() {
  
  saving_alert();
  //  Ensure all tables have a slug.
  for (let i = 0; i < _schema_data.length; i++) {
    _schema_data[i].slug = to_slug(_schema_data[i].name)
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
      close_popup();
    }
  }
}