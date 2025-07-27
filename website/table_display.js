////
////  RENDER TABLE ROW EDITOR
////


//  Render the table
function render_table() {
  window.history.pushState({ },"", `/database/${_selected_db.name}/table/${_selected_table.metadata.snakecase}`);

  document.getElementById('top-bar-title').innerHTML = `Table name: <b>${_selected_table.metadata.name}</b>`;
  document.getElementById('landing').style.display = 'none';
  let table_string = `<table><tr>`
  //  Table header
  let columns = _selected_table.metadata.columns;
  for (let i = 0; i < columns.length; i++) {
    //if (columns[i].snakecase == 'id') { continue; }
    table_string += `<th>${columns[i].snakecase}</th>`;
  }
  // table_string += `<th><!-- edit icon --></th>`;
  table_string += `</tr>`;

  //  Table rows
  let rows = _selected_table.rows;
  for (let i = 0; i < rows.length; i++) {
    let selected_class = 'class="selected-row"';
    if (_selected_row.id != rows[i].id) {  selected_class = '';  }
    table_string += `<tr onclick="render_row_editor(${i})" ${selected_class}>`;
    for (let j = 0; j < columns.length; j++) {
      //if (columns[j].snakecase == 'id') { continue; }
      table_string += `<td>${rows[i][columns[j].snakecase]}</td>`;
    }
    // table_string += `<td>&#9999; &nbsp; &#128465;</td>`;
    table_string += `</tr>`;
  }
  table_string += `</table>`;
  if (rows.length < 1) {  table_string += `<div class="empty-table-space"><i>No rows in this table yet! </i></div>`;  }
  document.getElementById('table-display').innerHTML = table_string;
}

function render_add_row_btn() {
  let columns = _selected_table.metadata.columns;
  let add_row_html = '<div id="row-editor">';
  add_row_html += '<h3>New row</h3>';
  for (let i = 0; i < columns.length; i++) {
    if (columns[i].snakecase == 'id') { continue; }
    add_row_html += `<div class="row-input">${columns[i].name}: <input type="text" id="i-${columns[i].snakecase}"></div>`;
  }
  add_row_html += `<div class="row-input"><button onclick="add_row()">Add row</button></div>`;
  add_row_html += `</div>`;
  document.getElementById('row-editor-container').innerHTML = add_row_html;
  document.getElementById('action-button-container').innerHTML = '';
}

//  Fired when a row is selected!
function render_row_editor(i) {
  let columns = _selected_table.metadata.columns;
  _selected_row = _selected_table.rows[i];
  render_table();  //  Needed to highlight row
  let add_row_html = '<div id="row-editor">';
  add_row_html += `<h3>Row ${i}</h3>`;
  for (let i = 0; i < columns.length; i++) {
    if (columns[i].snakecase == 'id') { continue; }
    add_row_html += `<div class="row-input">${columns[i].name}: <input type="text" id="i-${columns[i].snakecase}" value="${_selected_row[columns[i].snakecase]}"></div>`;
  }
  add_row_html += `<br/>`;
  add_row_html += `<div class="row-input">`;
  add_row_html += `<button onclick="update_row(${i})">Update row</button>`;
  add_row_html += `<button onclick="delete_row(${i})" id="delete">&#128465; </button>`;
  add_row_html += `</div>`;
  
  add_row_html += `</div>`;
  document.getElementById('row-editor-container').innerHTML = add_row_html;
  document.getElementById('action-button-container').innerHTML = '<button id="new-row" onclick="render_add_row_btn()">+ New Row</button>';

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
        render_add_row_btn();
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
  http.open("POST", `/api/insert?db_name=${_selected_db.name}&table_name=${_selected_table.metadata.snakecase}`);  //  "table" is a global variable
  http.send(JSON.stringify(new_row));
  http.onreadystatechange = (e) => {
    if (http.readyState == 4 && http.status == 200) {
      let response = JSON.parse(http.responseText);
      if (!response.error) {
        new_row.id = response.id;
        _selected_table.rows.push(new_row);
        render_table();
        render_add_row_btn();
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
  http.open("POST", `/api/update?db_name=${_selected_db.name}&table_name=${_selected_table.metadata.snakecase}&id=${_selected_table.rows[row_num].id}`);  //  "table" is a global variable
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
        // table.rows.push(new_row);
        render_table();
        render_add_row_btn();
      } else {
        document.getElementById('error').innerHTML = response.msg;
      }
    }
  }
}

//  delete a row
function delete_row(i) {
  http.open("POST", `/api/delete?db_name=${_selected_db.name}&table_name=${_selected_table.metadata.snakecase}&id=${_selected_table.rows[i].id}`);  //  "table" is a global variable
  http.send();
  http.onreadystatechange = (e) => {
    if (http.readyState == 4 && http.status == 200) {
      let response = JSON.parse(http.responseText);
      if (!response.error) {
        _selected_table.rows.splice(i, 1);
        // table.rows.push(new_row);
        render_table();
        render_add_row_btn();
      } else {
        document.getElementById('error').innerHTML = response.msg;
      }
    }
  }
}