//  Pantry.js
//    A wrapper for using Pantry on the web. 

const Pantry = {
  async get_all_tables(db_name, callback) {
    const http = new XMLHttpRequest();
    http.open("GET", "/api/all-table-names?database=" + db_name);
    http.send();
    http.onreadystatechange = (e) => {
      if (http.readyState == 4 && http.status == 200) {
        let table_list = JSON.parse(http.responseText);
        callback(table_list);
      }
    }
  },

  async get_all_databases(callback) {
    const http = new XMLHttpRequest();
    http.open("GET", "/api/all-databases");
    http.send();
    http.onreadystatechange = (e) => {
      if (http.readyState == 4 && http.status == 200) {
        let _db_list = JSON.parse(http.responseText);
        callback(_db_list);
      }
    }
  }
}