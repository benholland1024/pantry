//  Database.js -- providing the Table class, for adding, editing and reading table data. 

var path = require('path');
var fs   = require('fs');

//  Database class!  
//    Get a table with this syntax:
//      let user_table = Database('pantry-housekeeping').Table('users');
class Database {
  constructor(username, name) {
    this.username = username;
    this.name = name;
    try  {
      this.table_names = fs.readdirSync(`${__dirname}/databases/${this.username}/${this.name}`);
    } catch (err) {
      throw new Error(`There is no database folder with the name ${__dirname}/databases/${this.username}/${this.name}`)
    }
  }

  Table(table_name) {
    return new Table(this.username, this.name, table_name);
  }
}

class Table {

  constructor(username, db_name, name) {
    this.username = username;
    this.db_name = db_name;
    this.name = name;
    try {
      this.metadata = JSON.parse(fs.readFileSync(`${__dirname}/databases/${username}/${db_name}/metadata/${name}.json`, 'utf8'));
    } catch (err) {
      throw new Error(`The file "\x1b[32m/databases/${username}/${db_name}/metadata/${name}.json\x1b[0m" does not exist or is not proper JSON.`)
    }
    try {
      this.rows = JSON.parse(fs.readFileSync(`${__dirname}/databases/${username}/${db_name}/rows/${name}.json`, 'utf8'));
    } catch (err) {
      throw new Error(`The file "\x1b[32m/databases/${username}/${db_name}/rows/${name}.json\x1b[0m" does not exist or is not proper JSON.`)
    }
  }

  //  Ensure a row has all required fields, and has all unique unique fields. 
  _check_for_unique_and_required(row_data, index_to_skip) {
    let response = {
      error: false,
      msg: ''
    }
    for (let i = 0; i < this.metadata.columns.length; i++) {
      let column_data = this.metadata.columns[i];
      if (column_data.unique === true && !(column_data.required === false && !row_data[column_data.snakecase])) {
        for (let j = 0; j < this.rows.length; j++) {
          if (j == index_to_skip) {
            continue;
          }
          if (this.rows[j][column_data.snakecase] == row_data[column_data.snakecase]) {
            response.error = true;
            response.msg = `${column_data.name} must be unique.`;
            return response;
          }
        }
      }
      if (column_data.require === true && !row_data[column_data.snakecase]) {
        response.error = true;
        response.msg = `${column_data.name} is required.`;
        return response;
      }
    }
    return response;
  }

  //  "query" is an object
  find(query) {
    let query_keys = Object.keys(query);
    let results = [];
    for (let i = 0; i < this.rows.length; i++) {
      let is_result = true;
      for (let j = 0; j < query_keys.length; j++) {
        let key = query_keys[j];
        if (this.rows[i][key] != query[key]) {
          is_result = false;
        }
      }
      if (is_result) {
        results.push(this.rows[i]);
      }
    }
    return results;
  }

  insert(row_data) {
    let response = {
      error: false,
      msg: '',
      id: null
    }
    response = this._check_for_unique_and_required(row_data, -1);
    if (response.error) {
      return response;
    }
    row_data.id = this.metadata.max_id;
    response.id = row_data.id;
    this.metadata.max_id++;
    this.rows.push(row_data);
    fs.writeFileSync(`${__dirname}/databases/${this.username}/${this.db_name}/rows/${this.name}.json`, JSON.stringify(this.rows, null, 2));
    fs.writeFileSync(`${__dirname}/databases/${this.username}/${this.db_name}/metadata/${this.name}.json`, JSON.stringify(this.metadata, null, 2));
    return response;
  }

  update(id, update) {
    //  Look for row to update...
    let index_to_update = -1;
    for (let i = 0; i < this.rows.length; i++) {
      if (this.rows[i].id == id) {
        index_to_update = i;
        break;
      }
    }
    if (index_to_update == -1) {
      return { error: true, msg: `Couldn't find the data to update.` };
    }
    //  Update it!
    let updated_row_copy = JSON.parse(JSON.stringify(this.rows[index_to_update]));
    let update_keys = Object.keys(update);
    for (let j = 0; j < update_keys.length; j++) {
      if (update_keys[j] != 'id') {
        updated_row_copy[update_keys[j]] = update[update_keys[j]];
      }
    }
    //  Validate it! 
    let response = this._check_for_unique_and_required(updated_row_copy, index_to_update);
    if (response.error) {
      return response;
    } else {  //  Save it!
      this.rows[index_to_update] = updated_row_copy;
      fs.writeFileSync(`${__dirname}/databases/${this.username}/${this.db_name}/rows/${this.name}.json`, JSON.stringify(this.rows, null, 2));
      response.id = this.rows[index_to_update].id;
    }
    
    return response;
  }

  delete(id_to_delete) {
    for (let i = 0; i < this.rows.length; i++) {
      if (this.rows[i].id == id_to_delete) {
        this.rows.splice(i, 1);
        fs.writeFileSync(`${__dirname}/databases/${this.username}/${this.db_name}/rows/${this.name}.json`, JSON.stringify(this.rows, null, 2));
        return `Deleted the row with id ${id_to_delete}`;
      }
    }
    return `No row found with id ${id_to_delete}`;
  }
  
}

module.exports = Database; // See above for usage! Basically: let my_table = Database('my-db').Table('my-table');