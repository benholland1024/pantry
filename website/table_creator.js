////
////  TABLE MAKER / EDITOR 
////
//      Edit a table, including:
//       - Table name / snakecase
//       - Table columns



const column_data = [  //  All the properties used to define a table column
  ['Column name', 'name'],
  ['Column snakecase', 'snakecase'],
  ['Unique?', 'unique'],
  ['Required?', 'required'],
  ['Datatype', 'datatype']
]

//  Start the table_maker interface.
function boot_table_maker() {
  //  Reset the global "table" variable, with empty meta data
  _selected_table = {
    metadata: {
      name: '',
      max_id: 0,
      columns: [{
          "name": "Id",
          "snakecase": "id",
          "unique": true,
          "required": true,
          "datatype": "string"
        },
      ]
    }
  }
  _selected_row = {
    id: -1
  }
  unrender_all();

  render_table_maker(); //  Render the table. 
  render_side_bar();
}
//  Go to the add table page
function render_table_maker() {
  window.history.pushState({ },"", `/database/${_selected_db.name}/create-table`);
  // The top bar
    //  The following line grabs the current table name if it exists, to preserve it on rerender.
  let current_table_name = document.getElementById('table-name-input') ? document.getElementById('table-name-input').value : '';  
  let top_bar_html = `<div id="table-name-input-container">
    <div>
      New table name: <input type="text" id="table-name-input" value="${current_table_name}"/>
    </div>
    <div id="table-snakecase-container">
      ${_selected_db.name}/table/
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
    let selected_class = 'class="selected-row"';
    let selected = _selected_row.id == rows[i].id
    if (true) {  selected_class = '';  } // TODO: Allow selection / editing of columns
    table_maker_html += `<tr onclick="render_column_editor(${i})" ${selected_class}>`;
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
  document.getElementById('action-button-container').innerHTML = `<button onclick="save_new_table()">&#128190; Save table</button>`
}

//  Runs when you click the "Add a new column" button
function render_column_creator() {
  //  Rerender table, deselect any selected row
  _selected_row = { id: -1 };
  render_table_maker();

  let newRow = document.getElementById('table').insertRow();
  document.getElementById('new-row-btn').style.display = 'none';

  let cell = newRow.insertCell();
  cell.innerHTML = `<td><input type="text" id="i-name" placeholder="Name..." /></td>`;

  cell = newRow.insertCell();
  cell.innerHTML = `<td><input type="text" id="i-snakecase" readonly /></td>`;

  document.getElementById('i-name').addEventListener('input', e => { 
    document.getElementById('i-snakecase').value = to_snakecase(e.target.value);
  });

  cell = newRow.insertCell();
  cell.innerHTML = `<td><input type="checkbox" id="i-unique" /></td>`;

  cell = newRow.insertCell();
  cell.innerHTML = `<td><input type="checkbox" id="i-required" /></td>`;

  cell = newRow.insertCell();
  cell.innerHTML = `<td>
    <select id="i-datatype">
      <option value="string">String</option>
      <option value="number">Number</option>
      <option value="bool">Boolean</option>
      <option value="datetime">Datetime</option>
      <option value="date">Date</option>
      <option value="time">Time</option>
      <option value="file">File</option>
      <option value="bytes">Bytes</option>
      <option value="fk">Foreign Key</option>
    </select>
  </td>`;

  cell = newRow.insertCell();
  cell.innerHTML = `<div class="table-row-icon save-row-icon" onclick="add_column()">&#128190;</div>`; //  save icon
  cell = newRow.insertCell();   
  cell.innerHTML = `<div class="table-row-icon delete-row-icon" onclick="render_table_maker()">&#128465;</div>`; //  trash icon

}


function to_snakecase(str) {
  return str.toLowerCase().replaceAll(' ', '-')
}

////
////  DATA HANDLING - table def and columns
////
function add_column() {
  let new_column = {};
  for (let i = 0; i < column_data.length; i++) {
    let input = document.getElementById("i-" + column_data[i][1]);
    console.log(column_data[i][1])
    if (column_data[i][1] == 'snakecase') {
      new_column.snakecase = to_snakecase(new_column.name);
    } else if (input.type == 'text' || input.id == 'i-datatype') {
      new_column[column_data[i][1]] = input.value;
    } else if (input.type == 'checkbox') {
      new_column[column_data[i][1]] = input.checked;
    }
  }
  new_column.snakecase = to_snakecase(new_column.name);
  _selected_table.metadata.columns.push(new_column);
  render_table_maker();
}

//  Create new table .json file in Pantry
function save_new_table() {
  let new_table = _selected_table.metadata;

  new_table.name = document.getElementById('table-name-input').value;
  new_table.snakecase = to_snakecase(new_table.name);
  http.open("POST", `/api/create-table?username=${_current_user.username}&db_name=${_selected_db.name}`);
  http.send(JSON.stringify(new_table));
  http.onreadystatechange = (e) => {
    if (http.readyState == 4 && http.status == 200) {
      let response = JSON.parse(http.responseText);
      if (!response.error) {
        _table_list.push(new_table.snakecase);
        render_side_bar();
      } else {
        document.getElementById('error').innerHTML = response.msg;
      }
    }
  }
}