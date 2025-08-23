//
//  Utility functions (used in multiple files)
//


//  Convert any type of name into a snakecase name. Used lots of places.
function to_snakecase(str) {
  return str.toLowerCase().replaceAll(' ', '-')
}

async function copyTextToClipboard(textToCopy) {
  try {
    // Check if the Clipboard API and writeText method are available
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(textToCopy);
      console.log('Text successfully copied to clipboard!');
    } else {
      console.warn('Clipboard API not supported or writeText method not available.');
      // Fallback for older browsers if necessary (e.g., using document.execCommand('copy'))
      // This fallback is generally discouraged due to security and compatibility issues.
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
}

//  Unrenders all div content.  Used before rendering a new "page".
function unrender_all() {
  document.removeEventListener('mousedown', _event_listeners.mousedown);
  document.removeEventListener('mouseup', _event_listeners.mouseup);
  document.removeEventListener('mousemove', _event_listeners.mousemove);
  document.removeEventListener('wheel', _event_listeners.wheel);
  document.getElementById('table-display').innerHTML = "";
  document.getElementById('schema-display').innerHTML = "";
  document.getElementById('schema-display-container').style.display = "none";
  document.getElementById('row-editor-container').innerHTML = "";
  document.getElementById('action-button-container').innerHTML = "";
  document.getElementById('landing').style.display = 'none';
  _do_logo_anim = false;
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('examples').style.display = 'none';
  document.getElementById('user-settings').style.display = 'none';
  document.getElementById('db-settings-container').style.display = 'none';
  window.scrollTo(0, 0);
  close_popup();

}

//  Returns HTML for a dropdown list of datatypes. 
//   Used in table_creator.js and db_editor.js
//   Options: {
//     id:         string       The HTML id
//     onchange:   function     The reaction to changes
//     disabled:   string       Is the dropdown disabled? 
//     table_name: string       The table name, which will be ommitted in forein keys
//     table_list: array        A list of table names, for foreign keys. 
//   }
function get_datatype_dropdown(value, opts) {
  let id = opts.id;
  let onchange = opts.onchange;
  let disabled = opts.disabled;
  let table_name = opts.table_name;
  let table_list = opts.table_list ? opts.table_list : _table_list;

  let foreign_key_opts = ``;

  // if (value.split('-')[0] == 'fk') {
  //   console.log(value);
  // }
  //  Get the foreign key value options
  for (let i = 0; i < table_list.length; i++) {
    if (table_list[i] == table_name) {
      continue;
    }
    foreign_key_opts += `<option value="fk-${i}" ${value == `fk-${i}` ? 'selected' : ''}>FK from: <b>${ table_list[i] }</b></option>`
  }
  return `
    <select id="${id}" value="${value}" onchange="${onchange}" ${disabled ? 'disabled' : ''}>
      <option value="string" ${value == 'string' ? 'selected' : ''}>String</option>
      <option value="number" ${value == 'number' ? 'selected' : ''}>Number</option>
      <option value="bool" ${value == 'bool' ? 'selected' : ''}>Boolean</option>
      <option value="datetime" ${value == 'datetime' ? 'selected' : ''}>Datetime</option>
      <option value="date" ${value == 'date' ? 'selected' : ''}>Date</option>
      <option value="time" ${value == 'time' ? 'selected' : ''}>Time</option>
      <option value="file" ${value == 'file' ? 'selected' : ''}>File</option>
      <option value="bytes" ${value == 'bytes' ? 'selected' : ''}>Bytes</option>
      <option disabled>Foreign Keys:</option>
      ${foreign_key_opts}
    </select>`;
}