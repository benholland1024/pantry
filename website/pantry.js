//  Pantry.js
//    A wrapper for using Pantry on the web. 

const Pantry = {
  async get_all_tables(callback) {
    const http = new XMLHttpRequest();
    http.open("GET", "/api/all-tables");
    http.send();
    http.onreadystatechange = (e) => {
      if (http.readyState == 4 && http.status == 200) {
        table_list = JSON.parse(http.responseText);
        callback(table_list);
      }
    }
  }
}