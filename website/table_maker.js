////
////  RENDER TABLE MAKER / EDITOR 
////
//      This includes:
//       - Table name / snakecase
//       - Table columns



const column_data = [  //  All the properties used to define a table column
  ['Column name', 'name'],
  ['Column snakecase', 'snakecase'],
  ['Unique?', 'unique'],
  ['Required?', 'required'],
  ['Reference?', 'reference']
]

//  Start the table_maker interface.
function boot_table_maker() {
  //  Reset the global "table" variable, with empty meta data
  table = {
    metadata: {
      name: '',
      max_id: 0,
      columns: [{
          "name": "Id",
          "snakecase": "id",
          "unique": true,
          "required": true,
          "reference": false
        },
      ]
    }
  }
  render_table_maker(); //  Render the table. 
  render_add_column();  //  Render the "new column" layout
  render_side_bar();
}
//  Go to the add table page
function render_table_maker() {
  // The top bar
    //  The following line grabs the current table name if it exists, to preserve it on rerender.
  let current_table_name = document.getElementById('table-name-input') ? document.getElementById('table-name-input').value : '';  
  let top_bar_html = `<div id="table-name-input-container">
    <div>
      New table name: <input type="text" id="table-name-input" value="${current_table_name}" onkeydown="render_table_name_snakecase(event)"/>
    </div>
    <div id="table-snakecase-container">
      Table snakecase:
    </div>
  </div>`;

  document.getElementById('table-name-display').innerHTML = top_bar_html;

  //  Render the table name input:
  

  //  Render the table:
  let table_maker_html = `<table>`;
  table_maker_html += `<tr><th>Column name</th><th>Column snakecase</th><th>Unique?</th><th>Required?</th><th>Foreign key?</th></tr>`;
  ///  Rendering column data... as rows... don't get confused here. 
  let rows = table.metadata.columns;
  for (let i = 0; i < rows.length; i++) {
    let selected_class = 'class="selected-row"';
    if (true) {  selected_class = '';  } // TODO: Allow selection / editing of columns
    table_maker_html += `<tr onclick="render_column_editor(${i})" ${selected_class}>`;
    for (let j = 0; j < column_data.length; j++) {
      table_maker_html += `<td>${rows[i][column_data[j][1]]}</td>`;
    }
    // table_string += `<td>&#9999; &nbsp; &#128465;</td>`;
    table_maker_html += `</tr>`;
  }
  table_maker_html += `</table><br/>`;
  document.getElementById('table-display').innerHTML = table_maker_html;
}

//  Render table name snake case whenever table name is updated
function render_table_name_snakecase(e) {
  let table_name = document.getElementById('table-name-input').value;
  console.log(e.key);
  if (e.key.length == 1) { table_name += e.key; }
  else if (e.key == 'Backspace') {  table_name = table_name.slice(0, -1);  };
  document.getElementById('table-snakecase-container').innerHTML = `Table snakecase: ${table_name.toLowerCase().replace(' ', '-')}`;
}

//  Render the add column inputs
function render_add_column() {
  let columns = table.metadata.columns;
  let add_row_html = '<div id="row-editor">';
  add_row_html += '<h3>New row</h3>';
  for (let i = 0; i < column_data.length; i++) {
    const input_types = ['text', 'text', 'checkbox', 'checkbox', 'checkbox'];
    add_row_html += `<div class="row-input">${column_data[i][0]}: <input type="${input_types[i]}" id="i-${column_data[i][1]}"></div>`;
  }

  add_row_html += `<div class="row-input"><button onclick="add_column()">Add column</button></div>`;
  add_row_html += `</div>`;
  document.getElementById('row-editor-container').innerHTML = add_row_html;
  document.getElementById('action-button-container').innerHTML = '<button id="save-new-table" onclick="save_new_table()">+ Save New Table</button>';
}

////
////  DATA HANDLING - table def and columns
////
function add_column() {
  let new_column = {};
  for (let i = 0; i < column_data.length; i++) {
    let input = document.getElementById("i-" + column_data[i][1]);
    if (input.type == 'text') {
      new_column[column_data[i][1]] = input.value;
    } else if (input.type == 'checkbox') {
      new_column[column_data[i][1]] = input.checked;
    }
  }
  table.metadata.columns.push(new_column);
  render_table_maker();
}

//  Create new table .json file in Pantry
function save_new_table() {
  let new_table = table.metadata;

  new_table.name = document.getElementById('table-name-input').value;
  new_table.snakecase = new_table.name.toLowerCase().replace(' ', '-');
  http.open("POST", `/api/create-table?db_name=${selected_db}`);
  http.send(JSON.stringify(new_table));
  http.onreadystatechange = (e) => {
    let response;      
    if (http.readyState == 4 && http.status == 200) {
      response = JSON.parse(http.responseText);
      if (!table.error) {
        table_list.push(new_table.snakecase);
        render_side_bar();
      } else {
        document.getElementById('error').innerHTML = response.msg;
      }
    }
  }
}