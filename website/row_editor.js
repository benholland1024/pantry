////
////  RENDER TABLE ROW EDITOR
////

let _original_table_name = '';   //  Used to update the table name when saved.
let _show_column_details = false; //  Shows or hides column details (datatype, unique, etc)

//  Render the table
function render_table() {
  window.history.pushState({ },"", `/database/${_selected_db.name}/table/${to_slug(_selected_table.metadata.name)}`);
  unrender_all();
  
  //  TOP BAR 
  let top_bar_html = `<div id="table-name-input-container">
    <div>
      Table name: 
      <input type="text" id="table-name-input" value="${_selected_table.metadata.name}"
        onblur="save_table()"
      />
    </div>
    <div id="table-slug-container">
      ${_selected_db.name}/table/${to_slug(_selected_table.metadata.name)}
    </div>
  </div>`;

  document.getElementById('top-bar-title').innerHTML = top_bar_html;
  document.getElementById('table-name-input').addEventListener('input', e => {
    _selected_table.metadata.name = e.target.value
    document.getElementById('table-slug-container').innerHTML = `${_selected_db.name}/table/${to_slug(_selected_table.metadata.name)}`;
  });

  //  TOP ACTION BUTTONS
  let table_string = `<div style="text-align: right; margin: 20px 20px -10px 20px;">
    <button onclick="_show_column_details = !_show_column_details; render_table();" style="background: var(--content-bg-alt)">
        ${_show_column_details ? 'Hide' : 'Show'} column details
    </button>
    &nbsp;&nbsp;&nbsp;
    <button onclick="add_column()" style="background: var(--content-bg-alt)">+ Add a column</button>
  </div>`
  
  //  THE TABLE
  table_string += `<table id="table"><tr>`
  //  Table header
  let columns = _selected_table.metadata.columns;
  for (let i = 0; i < columns.length; i++) {
    let column = columns[i];
    let disabled_text = to_slug(column.name) == 'id' ? 'disabled' : '';
    table_string += `<th>
      <div style="margin-bottom: 10px;">
        <input type="text" value="${column.name}" style="font-weight:bold;"
          oninput="_selected_table.metadata.columns[${i}].name = event.target.value;" name="col-name-${i}"
          onblur="save_table()"
        />
      </div>`;
    //  Column details:
    if (_show_column_details) {
      table_string += `${get_datatype_dropdown(
        column.datatype == 'fk' ? `fk-${column.fk_input_dest}` : column.datatype, 
        {
          id: 'datatype-' + i, 
          onchange: 'update_table_col_datatype(' + i + ');',
          disabled: disabled_text,
          table_name: _selected_table.name,
          table_list: _table_list
        }
      )}
      <div style="font-weight: normal; font-size: 0.7em; margin:10px 0px;">
        Unique? 
        <input 
          type="checkbox" style="width: 40px" id="i-unique-${i}" ${column.unique ? 'checked' : '' } ${disabled_text}
          oninput="_selected_table.metadata.columns[${i}].unique = event.target.value; save_table();"
        />
      </div>
      <div style="font-weight: normal; font-size: 0.7em; margin:10px 0px;">
        Required? 
        <input 
          type="checkbox" style="width: 40px" id="i-required-${i}" ${column.required ? 'checked' : '' } ${disabled_text}
          oninput="_selected_table.metadata.columns[${i}].required = event.target.value; save_table();"
        />
      </div>`
      if (to_slug(column.name) != 'id') {
        table_string += `<div 
          style="font-weight: normal; font-size: 0.7em; color: var(--error-red); cursor:pointer; margin:10px 0px 0px;" 
          onclick="delete_column(${i})"
        >
          Delete column
        </div>`;
      } else { table_string += '<div style="font-size: 0.7em;margin:10px 0px 0px;">&nbsp;</div>'; } // for spacing
      
    }
    table_string += `</th>`;
  }
  table_string += `<th class="table-row-icon"></th>`
  table_string += `<th class="table-row-icon"></th>`

  // table_string += `<th><!-- edit icon --></th>`;
  table_string += `</tr>`;

  //  Table rows
  let rows = _selected_table.rows;
  for (let i = 0; i < rows.length; i++) {
    let selected = _selected_row.id == rows[i].id
    let selected_class = selected ? 'class="selected-row"' : '';
    table_string += `<tr ${selected_class}>`;
    for (let j = 0; j < columns.length; j++) {      
      if (selected) {
        table_string += `<td>${get_editable_cell(columns[j], rows[i])}</td>`;
      } else {
        table_string += `<td>${rows[i][to_slug(columns[j].name)]}</td>`;
      }
    }
    if (selected) {
      table_string += `<td class="table-row-icon"><div class="save-row-icon" onclick="update_row(${i})">&#128190;</div></td>`  // save icon
    } else {
      table_string += `<td class="table-row-icon"><div class="edit-row-icon" onclick="edit_row(${i})">&#x1F589;</div></td>`  // pencil icon
    }
    table_string += `<td class="table-row-icon"><div class="delete-row-icon" onclick="delete_row(${i})">&#128465;</div></td>`; //trash icon

    // table_string += `<td>&#9999; &nbsp; &#128465;</td>`;
    table_string += `</tr>`;
  }
  table_string += `</table>`;
  if (rows.length < 1) {  
    table_string += `<div id="empty-table-space"><i>No rows in this table yet! </i></div>`;  
  }
  table_string += `<button onclick="render_row_creator()" style="margin-top: 20px; background: var(--content-bg-alt)" 
    id="new-row-btn">+ Add a new row</button>`
  document.getElementById('table-display').innerHTML = table_string;

  //  Render the button that says "Save table"
  // document.getElementById('action-button-container').innerHTML = `<button onclick="save_table()">&#128190; Save table</button>`
}

//  Returns HTML for an input for an editable cell.
function get_editable_cell(column, row) {
  let id_attr = '';
  if (to_slug(column.name) == 'id') { 
    id_attr = `readonly value=${_selected_table.metadata.max_id}`; 
  }
  let html = '';
  console.log(column.datatype);
  if (column.datatype == 'number') {
    html = `<input type="number" id="i-${to_slug(column.name)}" ${id_attr} placeholder="${column.name}..." value="${row[to_slug(column.name)]}"/>`;
  } else if (column.datatype == 'bool') {
    html = `<input type="checkbox" id="i-${to_slug(column.name)}" ${id_attr} placeholder="${column.name}..." value="${row[to_slug(column.name)]}"/>`
  } else {
    html = `<input type="text" id="i-${to_slug(column.name)}" ${id_attr} placeholder="${column.name}..." value="${row[to_slug(column.name)]}"/>`;
  }
  return html;
}

//  Runs when you click the "Add a new row" button
function render_row_creator() {
  //  Rerender table, deselect any selected row
  _selected_row = {};
  render_table();
  // Remove the stand-in text, if visible
  document.getElementById('empty-table-space') ? document.getElementById('empty-table-space').style.display = 'none' : '';


  let columns = _selected_table.metadata.columns;
  let newRow = document.getElementById('table').insertRow();
  document.getElementById('new-row-btn').style.display = 'none';

  let cell;
  // let row_creator_html = '<tr id="row-creator">';
  for (let i = 0; i < columns.length; i++) {
    //if (columns[j].slug == 'id') { continue; }
    let id_attr = '';
    if (to_slug(columns[i].name) == 'id') { 
      id_attr = `readonly value=${_selected_table.metadata.max_id}`; 
    }
    cell = newRow.insertCell();
    cell.innerHTML = `<td><input type="text" id="i-${to_slug(columns[i].name)}" ${id_attr} placeholder="${columns[i].name}..." /></td>`;
  }
  cell = newRow.insertCell();
  cell.innerHTML = `<div class="table-row-icon save-row-icon" onclick="add_row()">&#128190;</div>`; //  save icon
  cell = newRow.insertCell();   
  cell.innerHTML = `<div class="table-row-icon delete-row-icon" onclick="render_table()">&#128465;</div>`; //  trash icon

  // document.getElementById('table').innerHTML += row_creator_html;
}

//  Fires when the datatype of a column is changed
function update_table_col_datatype(column_idx) {
  console.log("Updating");
  let o_val = _selected_table.metadata.columns[column_idx].datatype;      // o_val stands for original value
  let new_type = document.getElementById(`datatype-${column_idx}`).value;
  //  Handle the different foreign key options.
  if (new_type.split('-')[0] == 'fk') {
    _selected_table.metadata.columns[column_idx].fk_input_dest = Number(new_type.split('-')[1])
    _selected_table.metadata.columns[column_idx].datatype = 'fk';
  } else {
    _selected_table.metadata.columns[column_idx].datatype = new_type;
  }
  //  Try to update existing data values.
  let existing_data = false;
  let do_convert = false;
  if (o_val == 'bool' || o_val == 'fk') {  //  It doesnt make sense to check for existing data here. Just convert.
    //  Nothing
  } else {
    for (let i = 0; i < _selected_table.rows.length; i++) {
      let row = _selected_table.rows[i];
      let col_slug = to_slug(_selected_table.metadata.columns[column_idx].name);
      let col_value = row[col_slug];
      if (col_value && !existing_data) {
        existing_data = true;
        do_convert = confirm(`There are rows that already have data in this column. 
          To continue, we'll have to try to convert ${o_val} to ${new_type}. Data may be lost! Continue?`);
      }
      console.log(row);
      if (col_value && do_convert && new_type == 'string') {
        row[col_slug] = col_value.toString();
      } else if (col_value && do_convert && new_type == 'number') {
        row[col_slug] = Number(col_value);
        if (isNaN(col_value)) { row[col_slug] = 0; }
      } else if (col_value) {
        let default_val = {
          'bool': false,
        }
        row[col_slug] = default_val[new_type];
      }
    }
  }
  save_table();
  render_table();
}

//  Edit row: Runs when you click the pencil by a row.
function edit_row(row_num) {
  _selected_row = _selected_table.rows[row_num];
  render_table();
}

//  Creates a new column, which can then be edited
function add_column() {
  _selected_table.metadata.columns.push({
    name: `New column ${_selected_table.metadata.columns.length}`,
    datatype: 'string', 
    required: false,
    unique: false
  });
  let column = _selected_table.metadata.columns[_selected_table.metadata.columns.length-1];
  for (let i = 0; i < _selected_table.rows.length; i++) {
    row = _selected_table.rows[i];
    row[to_slug(column.name)] = '';
  }
  save_table();
  render_table();
}

//  Delete a column
function delete_column(col_idx) {
  for (let i = 0; i < _selected_table.rows.length; i++) {
    let row = _selected_table.rows[i];
    let col_slug = to_slug(_selected_table.metadata.columns[col_idx].name);
    delete row[col_slug];
  }
  _selected_table.metadata.columns.splice(col_idx, 1);
  save_table();
  render_table();
}

////
////  DATA HANDLING - table rows
////
//  Load a table and all its rows onto the display
function load_table(table_name) {
  http.open("GET", `/api/table?username=${_current_user.username}&db_name=${_selected_db.name}&table_name=${table_name}`);
  http.send();
  http.onreadystatechange = (e) => {
    let response;      
    if (http.readyState == 4 && http.status == 200) {
      _original_table_name = table_name;
      _selected_table = JSON.parse(http.responseText);
      if (!_selected_table.error) {
        render_table();
        render_side_bar();
      } else {
        document.getElementById('error').innerHTML = response.msg;
      }
    }
  }
}

////
function create_table() {
  _original_table_name = '';
  let name_i = 1;
  while (_table_list.includes(`new-table-${name_i}`)) {
    name_i++;
  }
  _selected_table = {
    metadata: {
      name: `New Table ${name_i}`,
      max_id: 0,
      columns: [{
        datatype: "string",
        name: "Id",
        required: true,
        unique: true
      }],
      x_pos: 20,
      y_pos: 20
    },
    rows: [],
  }
  let table_data = _selected_table.metadata;
  loading_popup();
  http.open("POST", `/api/create-table?username=${_current_user.username}&db_name=${_selected_db.name}`);
  http.send(JSON.stringify(table_data));
  http.onreadystatechange = (e) => {
    let response;      
    if (http.readyState == 4 && http.status == 200) {
      response = JSON.parse(http.responseText);
      if (!response.error) {
        console.log("Added table :)")
        _table_list.push(`new-table-${name_i}`);
        close_popup();
        _original_table_name = `new-table-${name_i}`;
        render_side_bar();
        render_table();
      } else {
        document.getElementById('error').innerHTML = response.msg;
      }
    }
  }
}

//  Add a row to the current table
function add_row() {
  let columns = _selected_table.metadata.columns;
  let new_row = {};
  for (let i = 0; i < columns.length; i++) {
    let input = document.getElementById("i-" + to_slug(columns[i].name));
    if (input) {
      new_row[to_slug(columns[i].name)] = input.value;
    }
  }
  http.open("POST", `/api/insert-row?username=${_current_user.username}&db_name=${_selected_db.name}&table_name=${to_slug(_selected_table.metadata.name)}`);
  http.send(JSON.stringify(new_row));
  http.onreadystatechange = (e) => {
    if (http.readyState == 4 && http.status == 200) {
      let response = JSON.parse(http.responseText);
      if (!response.error) {
        new_row.id = response.id;
        _selected_table.rows.push(new_row);
        _selected_table.metadata.max_id++;
        render_table();
      } else {
        document.getElementById('error').innerHTML = response.msg;
      }
    }
  }
}

//  Update a row
function update_row(row_num) {
  let columns = _selected_table.metadata.columns;
  let row_update = {};
  for (let i = 0; i < columns.length; i++) {
    let input = document.getElementById("i-" + to_slug(columns[i].name));
    if (input) {
      row_update[to_slug(columns[i].name)] = input.value;
    }
  }
  let update_row_api_route = `/api/update-row?username=${_current_user.username}&db_name=${_selected_db.name}`;
  update_row_api_route += `&table_name=${to_slug(_selected_table.metadata.name)}&id=${_selected_table.rows[row_num].id}`;
  http.open("POST", update_row_api_route);
  http.send(JSON.stringify(row_update));
  http.onreadystatechange = (e) => {
    let response;      
    if (http.readyState == 4 && http.status == 200) {
      response = JSON.parse(http.responseText);
      if (!_selected_table.error) {
        //  Update the "buffer" data:
        for (let j = 0; j < Object.keys(row_update).length; j++) {
          let key = Object.keys(row_update)[j];
          _selected_table.rows[row_num][key] = row_update[key];
        }
        _selected_row = {};
        // table.rows.push(new_row);
        render_table();
      } else {
        document.getElementById('error').innerHTML = response.msg;
      }
    }
  }
}

//  delete a row
function delete_row(i) {
  if (!confirm('Are you sure you want to delete this row? :o')) {
    return;
  }
  let delete_row_api_route = `/api/delete-row?username=${_current_user.username}&db_name=${_selected_db.name}`;
  delete_row_api_route += `&table_name=${to_slug(_selected_table.metadata.name)}&id=${_selected_table.rows[i].id}`;
  http.open("POST", delete_row_api_route);  //  "table" is a global variable
  http.send();
  http.onreadystatechange = (e) => {
    if (http.readyState == 4 && http.status == 200) {
      let response = JSON.parse(http.responseText);
      if (!response.error) {
        _selected_table.rows.splice(i, 1);
        // table.rows.push(new_row);
        render_table();
      } else {
        document.getElementById('error').innerHTML = response.msg;
      }
    }
  }
}

//  Updates the table columns in the database. 
function save_table() {
  let update_row_api_route = `/api/update-table?username=${_current_user.username}&db_name=${_selected_db.name}`;
  update_row_api_route += `&table_id=${_selected_table.metadata.table_id}`;
  loading_popup();
  http.open("POST", update_row_api_route);
  http.send(JSON.stringify(_selected_table.metadata));
  http.onreadystatechange = (e) => {
    let response;      
    if (http.readyState == 4 && http.status == 200) {
      response = JSON.parse(http.responseText);
      if (!response.error) {
        console.log("Updated table :)")
        // for (let j = 0; j < Object.keys(row_update).length; j++) {
        //   let key = Object.keys(row_update)[j];
        //   _selected_table.rows[row_num][key] = row_update[key];
        // }
        // _selected_row = {};
        // table.rows.push(new_row);
        close_popup();
        let table_idx = _table_list.indexOf(_original_table_name);
        if (table_idx > -1) { _table_list[table_idx] = to_slug(_selected_table.metadata.name) }
        _original_table_name = to_slug(_selected_table.metadata.name);
        render_side_bar();
        // render_table();

      } else {
        document.getElementById('error').innerHTML = response.msg;
      }
    }
  }
}