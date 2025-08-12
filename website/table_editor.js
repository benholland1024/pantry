////
////  TABLE EDITOR 
////
//      Edit a table, including:
//       - Table name / snakecase
//       - Table columns



//  Start the table_editor interface.
function boot_table_editor() {
  _selected_row = {
    id: -1
  }
  unrender_all();

  render_table_editor(); //  Render the table. 
  render_side_bar();
}


//  Go to the add table page
function render_table_editor() {
  window.history.pushState({ },"", `/database/${_selected_db.name}/edit/${_selected_table.snakecase}`);
  // The top bar
    //  The following line grabs the current table name if it exists, to preserve it on rerender.
  let current_table_name = document.getElementById('table-name-input') ? document.getElementById('table-name-input').value : '';  
  let top_bar_html = `<div id="table-name-input-container">
    <div>
      Edit table name: <input type="text" id="table-name-input" value="${_selected_table.name}"/>
    </div>
    <div id="table-snakecase-container">
      ${_selected_db.name}/table/${to_snakecase(_selected_table.name)}
    </div>
  </div>`;

  document.getElementById('top-bar-title').innerHTML = top_bar_html;
  document.getElementById('table-name-input').addEventListener('input', e => {
    document.getElementById('table-snakecase-container').innerHTML = `${_selected_db.name}/table/${to_snakecase(e.target.value)}`;
  });

  //  Render the table:
  let table_maker_html = `<table id="table">`;
  table_maker_html += `<tr>
    <th>Column name</th>
    <th>Column snakecase</th>
    <th>Unique?</th>
    <th>Required?</th>
    <th>Datatype?</th>
    <th class="table-row-icon"></th>
    <th class="table-row-icon"></th>
  </tr>`;
  ///  Rendering column data... as rows... don't get confused here. 
  let rows = _selected_table.metadata.columns;
  for (let i = 0; i < rows.length; i++) {
    let selected_class = 'selected-row';
    let selected = _selected_row.id == rows[i].id
    if (true) {  selected_class = '';  } // TODO: Allow selection / editing of columns
    table_maker_html += `<tr onclick="render_column_editor(${i})" class="column-row ${selected_class}">`;
    for (let j = 0; j < column_data.length; j++) {
      table_maker_html += `<td>${rows[i][column_data[j][1]]}</td>`;
    }
    if (selected) {
      table_maker_html += `<td class="table-row-icon"><div class="save-row-icon" onclick="update_row(${i})">&#128190;</div></td>`  // save icon
    } else {
      table_maker_html += `<td class="table-row-icon"><div class="edit-row-icon" onclick="edit_row(${i})">&#x1F589;</div></td>`  // pencil icon
    }
    table_maker_html += `<td class="table-row-icon"><div class="delete-row-icon" onclick="delete_row(${i})">&#128465;</div></td>`; //trash icon  
    table_maker_html += `</tr>`;
  }
  table_maker_html += `</table><br/>`;
  table_maker_html += `<button onclick="render_column_creator()" style="margin-top: 20px" id="new-row-btn">+ Add a new column</button>`

  document.getElementById('table-display').innerHTML = table_maker_html;

  //  Render the button that says "Save Table"
  document.getElementById('action-button-container').innerHTML = `<button onclick="update_table()">&#128190; Save table</button>`
}

////
////  DATA HANDLING - table def and columns
////


//  Update the table .json file in Pantry
function update_table() {
  if (_selected_table.rows.length > 0 && !confirm("Oh dang, this table has rows!  Changing the columns may break things. Is that ok?")) {
    return;
  }
  // let new_table = _selected_table.metadata;

  // new_table.name = document.getElementById('table-name-input').value;
  // new_table.snakecase = to_snakecase(new_table.name);
  // http.open("POST", `/api/create-table?username=${_current_user.username}&db_name=${_selected_db.name}`);
  // http.send(JSON.stringify(new_table));
  // http.onreadystatechange = (e) => {
  //   if (http.readyState == 4 && http.status == 200) {
  //     let response = JSON.parse(http.responseText);
  //     if (!response.error) {
  //       _table_list.push(new_table.snakecase);
  //       render_side_bar();
  //     } else {
  //       document.getElementById('error').innerHTML = response.msg;
  //     }
  //   }
  // }
}