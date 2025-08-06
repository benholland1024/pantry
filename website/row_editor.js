////
////  RENDER TABLE ROW EDITOR
////


//  Render the table
function render_table() {
  window.history.pushState({ },"", `/database/${_selected_db.name}/table/${_selected_table.metadata.snakecase}`);
  unrender_all();
  document.getElementById('top-bar-title').innerHTML = `Table name: <b>${_selected_table.metadata.name}</b>`;
  document.getElementById('landing').style.display = 'none';
  let table_string = `<table id="table"><tr>`
  //  Table header
  let columns = _selected_table.metadata.columns;
  for (let i = 0; i < columns.length; i++) {
    //if (columns[i].snakecase == 'id') { continue; }
    table_string += `<th>${columns[i].snakecase}</th>`;
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
        table_string += `<td>${rows[i][columns[j].snakecase]}</td>`;
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
  table_string += `<button onclick="render_row_creator()" style="margin-top: 20px" id="new-row-btn">+ Add a new row</button>`
  document.getElementById('table-display').innerHTML = table_string;

  //  Render the button that says "Edit table metadata"
  document.getElementById('action-button-container').innerHTML = `<button onclick="boot_table_editor()">&#x1F589; Edit table metadata</button>`
}

//
function get_editable_cell(column, row) {
  let id_attr = '';
  if (column.snakecase == 'id') { 
    id_attr = `readonly value=${_selected_table.metadata.max_id}`; 
  }
  return `<input type="text" id="i-${column.snakecase}" ${id_attr} placeholder="${column.name}..." value="${row[column.snakecase]}"/>`
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
    //if (columns[j].snakecase == 'id') { continue; }
    let id_attr = '';
    if (columns[i].snakecase == 'id') { 
      id_attr = `readonly value=${_selected_table.metadata.max_id}`; 
    }
    cell = newRow.insertCell();
    cell.innerHTML = `<td><input type="text" id="i-${columns[i].snakecase}" ${id_attr} placeholder="${columns[i].name}..." /></td>`;
  }
  cell = newRow.insertCell();
  cell.innerHTML = `<div class="table-row-icon save-row-icon" onclick="add_row()">&#128190;</div>`; //  save icon
  cell = newRow.insertCell();   
  cell.innerHTML = `<div class="table-row-icon delete-row-icon" onclick="render_table()">&#128465;</div>`; //  trash icon

  // document.getElementById('table').innerHTML += row_creator_html;
}

//  Edit row: Runs when you click the pencil by a row.
function edit_row(row_num) {
  _selected_row = _selected_table.rows[row_num];
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

//  Add a row to the current table
function add_row() {
  let columns = _selected_table.metadata.columns;
  let new_row = {};
  for (let i = 0; i < columns.length; i++) {
    let input = document.getElementById("i-" + columns[i].snakecase);
    if (input) {
      new_row[columns[i].snakecase] = input.value;
    }
  }
  http.open("POST", `/api/insert?username=${_current_user.username}&db_name=${_selected_db.name}&table_name=${_selected_table.metadata.snakecase}`);
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
    let input = document.getElementById("i-" + columns[i].snakecase);
    if (input) {
      row_update[columns[i].snakecase] = input.value;
    }
  }
  let update_row_api_route = `/api/update?username=${_current_user.username}&db_name=${_selected_db.name}`;
  update_row_api_route += `&table_name=${_selected_table.metadata.snakecase}&id=${_selected_table.rows[row_num].id}`;
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
  let delete_row_api_route = `/api/delete?username=${_current_user.username}&db_name=${_selected_db.name}`;
  delete_row_api_route += `&table_name=${_selected_table.metadata.snakecase}&id=${_selected_table.rows[i].id}`;
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