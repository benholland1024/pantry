////
////  RENDER TABLE ROW EDITOR
////
//  Render the table
function render_table() {
  document.getElementById('table-name-display').innerHTML = `Table name: <b>${table.metadata.name}</b>`;
  let table_string = `<table><tr>`
  //  Table header
  let columns = table.metadata.columns;
  for (let i = 0; i < columns.length; i++) {
    //if (columns[i].snakecase == 'id') { continue; }
    table_string += `<th>${columns[i].snakecase}</th>`;
  }
  // table_string += `<th><!-- edit icon --></th>`;
  table_string += `</tr>`;

  //  Table rows
  let rows = table.rows;
  for (let i = 0; i < rows.length; i++) {
    let selected_class = 'class="selected-row"';
    if (selected_row.id != rows[i].id) {  selected_class = '';  }
    table_string += `<tr onclick="render_row_editor(${i})" ${selected_class}>`;
    for (let j = 0; j < columns.length; j++) {
      //if (columns[j].snakecase == 'id') { continue; }
      table_string += `<td>${rows[i][columns[j].snakecase]}</td>`;
    }
    // table_string += `<td>&#9999; &nbsp; &#128465;</td>`;
    table_string += `</tr>`;
  }
  table_string += `</table><br/>`;
  if (rows.length < 1) {  table_string += `<p><i>No rows in this table yet! </i></p>`;  }
  document.getElementById('table-display').innerHTML = table_string;
}

function render_add_row_btn() {
  let columns = table.metadata.columns;
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
  let columns = table.metadata.columns;
  selected_row = table.rows[i];
  render_table();  //  Needed to highlight row
  let add_row_html = '<div id="row-editor">';
  add_row_html += `<h3>Row ${i}</h3>`;
  for (let i = 0; i < columns.length; i++) {
    if (columns[i].snakecase == 'id') { continue; }
    add_row_html += `<div class="row-input">${columns[i].name}: <input type="text" id="i-${columns[i].snakecase}" value="${selected_row[columns[i].snakecase]}"></div>`;
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
  http.open("GET", `/api/table?db_name=${selected_db}&table_name=${table_name}`);
  http.send();
  http.onreadystatechange = (e) => {
    let response;      
    if (http.readyState == 4 && http.status == 200) {
      table = JSON.parse(http.responseText);
      if (!table.error) {
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
  let columns = table.metadata.columns;
  let new_row = {};
  for (let i = 0; i < columns.length; i++) {
    let input = document.getElementById("i-" + columns[i].snakecase);
    if (input) {
      new_row[columns[i].snakecase] = input.value;
    }
  }
  http.open("POST", `/api/insert?db_name=${selected_db}&table_name=${table.metadata.snakecase}`);  //  "table" is a global variable
  http.send(JSON.stringify(new_row));
  http.onreadystatechange = (e) => {
    let response;      
    if (http.readyState == 4 && http.status == 200) {
      response = JSON.parse(http.responseText);
      if (!table.error) {
        new_row.id = response.id;
        table.rows.push(new_row);
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
  let columns = table.metadata.columns;
  let row_update = {};
  for (let i = 0; i < columns.length; i++) {
    let input = document.getElementById("i-" + columns[i].snakecase);
    if (input) {
      row_update[columns[i].snakecase] = input.value;
    }
  }
  http.open("POST", `/api/update?db_name=${selected_db}&table_name=${table.metadata.snakecase}&id=${table.rows[row_num].id}`);  //  "table" is a global variable
  http.send(JSON.stringify(row_update));
  http.onreadystatechange = (e) => {
    let response;      
    if (http.readyState == 4 && http.status == 200) {
      response = JSON.parse(http.responseText);
      if (!table.error) {
        //  Update the "buffer" data:
        for (let j = 0; j < Object.keys(row_update).length; j++) {
          let key = Object.keys(row_update)[j];
          table.rows[row_num][key] = row_update[key];
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
  http.open("POST", `/api/delete?db_name=${selected_db}&table_name=${table.metadata.snakecase}&id=${table.rows[i].id}`);  //  "table" is a global variable
  http.send();
  http.onreadystatechange = (e) => {
    let response;      
    if (http.readyState == 4 && http.status == 200) {
      response = JSON.parse(http.responseText);
      if (!table.error) {
        table.rows.splice(i, 1);
        // table.rows.push(new_row);
        render_table();
        render_add_row_btn();
      } else {
        document.getElementById('error').innerHTML = response.msg;
      }
    }
  }
}