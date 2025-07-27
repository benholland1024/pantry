//  Pantry.js
//    A wrapper for using Pantry on the web. 

const Pantry = {
  async get_all_tables(username, db_name, callback) {
    const http = new XMLHttpRequest();
    http.open("GET", `/api/all-table-names?username=${username}&database=${db_name}`);
    http.send();
    http.onreadystatechange = (e) => {
      if (http.readyState == 4 && http.status == 200) {
        let table_list = JSON.parse(http.responseText);
        callback(table_list);
      }
    }
  },

  async get_all_databases(username, callback) {
    const http = new XMLHttpRequest();
    http.open("GET", `/api/all-databases?username=${username}`);
    http.send();
    http.onreadystatechange = (e) => {
      if (http.readyState == 4 && http.status == 200) {
        let db_list = JSON.parse(http.responseText);
        callback(db_list);
      }
    }
  }
}