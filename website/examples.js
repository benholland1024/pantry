////
////  EXAMPLES
////

let _current_example = '';

function load_examples() {
  window.history.pushState({ },"", `/examples`);
  _selected_db = { name: '' };
  unrender_all();
  document.getElementById('examples').style.display = 'block';
  render_examples();
  render_side_bar();
}

//  Render the examples page
function render_examples() {
  document.getElementById('top-bar-title').innerHTML = `<h3 style="margin: 0px;">DataPantry Examples</h3>`;
  document.getElementById('examples-table-of-contents').innerHTML = `<div class="rounded-container" style="width:100%">
      <h3 style="margin-bottom:0px;text-align: center;"><span style="color:var(--pink)">Webpages</span> talking to DataPantry</h3>
      <ul>
        <li onclick="render_vanilla_html_ex()" class="${_current_example == 'vanillajs' ? 'selected-ex' : ''}">Using vanilla web JS</li>
        <li class="non-active-example">Using Pantry library (coming soon!)</li>
        <li class="non-active-example">Using VueJS + the Pantry library (coming soon!)</li>
        <li class="non-active-example">Using React + the Pantry library (coming soon!)</li>
      </ul>
    </div>
    <div class="rounded-container" style="width:100%">
      <h3 style="margin-bottom:0px;text-align: center;"><span style="color:var(--pink)">Servers</span> talking to DataPantry</h3>
      <ul>
        <li class="non-active-example">Using vanilla NodeJS (coming soon!)</li>
        <li class="non-active-example">Using ExpressJS + the Pantry library (coming soon!)</li>
        <li class="non-active-example">Using Django + the Pantry library (coming soon!)</li>
      </ul>
    </div>`;
}

//  Inserts a string 'insert_str' into a string 'original', at position index.
function insert_into_string(original, insert_str, index) {
  return original.slice(0, index) + insert_str + original.slice(index);
}

//  Replace < with &lt;@B  --  this renders '<' correctly, and starts the highlighting of the tag name.
//    Other Html elements are escaped as well.  Note: Only use double quotes for attribute values.
function get_escaped_html(unescaped_html) {

  //  Highlight comments
  unescaped_html = unescaped_html.replaceAll('<!--', '@G&lt;!--').replaceAll('-->', '--&gt;@/');

  //  Highlight html attribute names and values
  let context = 'text';
  for (let i = 0; i < unescaped_html.length; i++) {
    let char = unescaped_html[i];
    if (char == '<') { 
      context = 'tag-name';
      unescaped_html = insert_into_string(unescaped_html, '@B', i+1);
      i += 2;
    } else if ((['tag-name'].includes(context) && char == ' ') || (['attr-value'].includes(context) && char == '"')) { 
      context = 'attr-name'; 
      unescaped_html = insert_into_string(unescaped_html, '@/@P', i+1);
      i += 4;
    } else if (['attr-name', 'attr-value', 'tag-name'].includes(context) && char == '>') {
      context = 'text'; 
      unescaped_html = insert_into_string(unescaped_html, '@/', i);
      i += 2;
    } else if (context == 'attr-name' && char == '=') {
      context = 'attr-eq'; 
      unescaped_html = insert_into_string(unescaped_html, '@/', i);
      i++; 
    } else if (context == 'attr-eq' && char == '"') {
      context = 'attr-value';
      unescaped_html = insert_into_string(unescaped_html, '@Y', i);
      i += 2;
    }
  }
  return unescaped_html;
}

//  Replace @P with <span class="pink">, @/ with </span>, etc. 
//    @P = pink
//    @Y = yellow
//    @B = blue
//    @G = green
//    @O = orange
//    @H = highlight
function syntax_highlight(str) {
  return str.replaceAll('@P', '<span class="pink">').replaceAll('@Y', '<span class="yellow">')
    .replaceAll('@B', '<span class="blue">').replaceAll('@G', '<span class="green">').replaceAll('@O', '<span class="orange">')
    .replaceAll('@H', '<span class="highlight">').replaceAll('@/', '</span>');
}

//  A lazy partial syntax highlighter for JS.  
function highlight_js(str) {
  let result = '';
  let currentText = ''
  let blue_words = ['const', 'let', 'var', 'function'];
  let orange_words = ['for', 'if', 'while'];
  function addCurrentText() {
    if (currentText.length > 0) {
      if (blue_words.includes(currentText)) { result += `@B${currentText}@/`; }
      else if (orange_words.includes(currentText)) { result += `@O${currentText}@/`; }
      else { result += `@P${currentText}@/`; }
      currentText = '';
    }
  }
  function addCurrentQuote() {
    if (currentText.length > 0) {
      result += `@Y${currentText}@/`;
      currentText = '';
    }
  }
  function addCurrentComment() {
    if (currentText.length > 0) {
      result += `@G${currentText}@/`;
      currentText = '';
    }
  }

  let quotes = ['"', "'", '`'];
  let symbols = [' ', '.',',',')','(', '{','}','[',']','&','<','>','-','*','%','=',';','>','\n','\r']

  let context = 'symbols';
  for (let i = 0; i < str.length; i++){
    let char = str[i];
    if (symbols.includes(char) && context == 'symbols') {        //  Just add any symbol.  No highlighting. 
      result += char;
    } else if (symbols.includes(char) && context == 'word') {    //  If we were reading a word and now see a symbol, add the word.
      addCurrentText();
      result += char;
    } else if (char == '/' && ['symbols', 'word'].includes(context)) {
      currentText += char;
      context = 'comment';
    } else if (['\n', '\r'].includes(char) && context == 'comment') {
      currentText += '\n';
      addCurrentComment();
      context = 'symbols';
    } else if (context == 'comment') {
      currentText += char;
    } else if (quotes.includes(char) && context == 'symbols') {  //  If we were reading symbols and see a quote, ignore everything 'til an end quote.
      currentText += char;
      context = char;
    } else if (quotes.includes(char) && context == 'word') {     //  If we're reading a word and see a quote, add the word, then ignore everything til end quote.
      addCurrentText();
      currentText += char;
      context = char;
    } else if (context != char && quotes.includes(context)) {    //  If we're reading a quote, keep going until we see an end quote.
      currentText += char;
    } else if (context == char) {                                //  If we're reading a quote and see an end quote
      currentText += char;
      addCurrentQuote();
      context = 'symbols';
    } else {
      currentText += char;
      context = 'word';
    }
  }

  return result;

  // let blue_words = ['const', 'let', 'var', 'function'];
  // let orange_words = ['for', 'if', 'while'];
  // for (let i = 0; i < blue_words.length; i++) {
  //   str = str.replaceAll(blue_words[i], `@B${blue_words[i]}@/`);
  // }
  // for (let i = 0; i < orange_words.length; i++) {
  //   str = str.replaceAll(orange_words[i], `@O${orange_words[i]}@/`);
  // }
  // return str;
}

/////////////////////////////////
//  index.html for vanilla JS  //
/////////////////////////////////
function render_vanilla_html_ex() {
  document.getElementById('example-container').innerHTML = `
    <div class="rounded-container">
      <h4>Use DataPantry with vanilla JS</h4>
      <p>Vanilla JS is less succinct than using the Pantry library, but it illustrates how the API can be used.</p>
      <p>
        Here's how you can write a comments section using DataPantry in a single .html file.  
        To make this example, you'd need to create a database titled "blog", with a table titled "comments".
        You'd also need to use your API key.
      </p>
      <p>
        The <span class="highlight">highlighted</span> words are the the parts you'll need to replace, depending
        on the details of your account and database.
      </p>
      <code>index.html</code>
      <pre id="code-example-1"></pre>
    </div>
  `;
  let vanillajs_html_string = `<!DOCTYPE html>
<html>
  <body>

    <!--  In this section, we'll display existing comments.  -->
    <h2>Comments</h2>
    <div id="comment-container"><!-- Insert comments here  --></div>
    <p>Write a new comment:</p>
    <br/>

    <!--  In this section, we'll let the user add a new comment.  -->
    <h2>Add a new comment:</h2>
    Username: <input id="comment-username" placeholder="mickey_mouse"/><br/>
    <textarea id="new-comment" placeholder="New comment here"></textarea><br/>
    <button onclick="submit_comment()">Submit comment</button>

  </body>

  <!--  We'll also insert some vanilla Javascript to run, to talk to DataPantry.  -->
  <script>insert-script-here
  </script>
</html>`;
  vanillajs_html_string = syntax_highlight(get_escaped_html(vanillajs_html_string));
  let js = highlight_js(
    `
  const http = new XMLHttpRequest(); //  Needed for making API calls
  const API_key = "@Hmy-api-key@/";      //  Replace this with your real API key!
  const username = "@Hmy_username@/";    //  Replace this with your real username!
  const db_name = "@Hblog@/";            //  Replace this with your real database name!
  const table_name = "@Hcomments@/";     //  Replace this with your real table name!

  //  Run this when the page loads to get all the posted comments.
  function get_comments() {
    //  Open an HTTP request for a table.
    http.open(
      "GET", 
      \`https://datapantry.org/api/table?\` + 
      \`username=\${username}&db_name=\${db_name}&table_name=\${table_name}&api=\${API_key}\`
    );
    //  Send the http request:
    http.send();
    //  Now, we wait for a reply from the server!
    http.onreadystatechange = (e) => {
      //  If we recieved a reply successfully...
      if (http.readyState == 4 && http.status == 200) {
        //  ...the reply will have our table data, including rows, columns, etc!
        let table = JSON.parse(http.responseText);
        let comments = table.rows;
        //  Each row represents a comment. Iterate through them!
        for (let i = 0; i < comments.length; i++) {
          //  Insert each comment's username and text on the page.
          document.getElementById('comment-container').innerHTML += \`
            &lt;div class="comment"&gt;
              &lt;div class="comment-username"&gt;&lt;b&gt;Username: &lt;/b&gt;\${comments[i].username}&lt;/div&gt;
              &lt;div class="comment-text"&gt;&lt;b&gt;Comment: &lt;/b&gt;\${comments[i].text}&lt;/div&gt;
              &lt;br/b&gt;
            &lt;/div&gt;\`;
        }
      }
    }
  }
  get_comments();  //  Make sure we get the comments when the page first loads. 

  //  One more function.  This one runs everytime the "Submit comment" button is clicked.
  function submit_comment() {
    //  We'll make a new http call - this time, a POST call.
    http.open(
      "POST", 
      \`https://datapantry.org/api/insert-row?\` + 
      \`username=\${username}&db_name=\${db_name}&table_name=\${table_name}&api=\${API_key}\`
    );
    //  We'll send the comment data here.
    let comment_username = document.getElementById('comment-username').value;
    let comment_text = document.getElementById('new-comment').value;
    http.send(JSON.stringify({ username: comment_username, text: comment_text }));
    //  Now, we wait for confirmation from the server!
    http.onreadystatechange = (e) => {
      //  If we recieved a reply successfully...
      if (http.readyState == 4 && http.status == 200) {
        ///  ...Make sure there's no error. 
        let response = JSON.parse(http.responseText);
        if (response.error) {
          console.warn(response.error);
          return;
        }
        //  If we're error free, insert our new post.
        document.getElementById('comment-container').innerHTML += \`
          &lt;div class="comment"&gt;
            &lt;div class="comment-username"&gt;&lt;b&gt;Username: &lt;/b&gt;\${comment_username}&lt;/div&gt;
            &lt;div class="comment-text"&gt;&lt;b&gt;Comment: &lt;/b&gt;\${comment_text}&lt;/div&gt;
            &lt;br/&gt;
          &lt;/div&gt;\`;
        
      }
    }
  }
  `
  );
  console.log(js)
  js = syntax_highlight(js);
  vanillajs_html_string = vanillajs_html_string.replace('insert-script-here', js);
  document.getElementById('code-example-1').innerHTML = vanillajs_html_string
  _current_example = 'vanillajs';
  render_examples();
}

//  server.js
function render_vanilla_server() {
  let vanillajs_server = `
const http = require('http');  // listen to HTTP requests
const server = http.createServer((req, res) => {
  res.statusCode = 200; // Set the HTTP status code (e.g., 200 for OK)
  res.setHeader('Content-Type', 'text/plain'); // Set the Content-Type header
  res.end('Hello, World!\n'); // Send the response body and end the response
});
server.listen(8080, 'localhost', () => {
  console.log(\`Server is running on http://localhost:8080\`);
});`
  document.getElementById('example-vanillajs-server').innerHTML = syntax_highlight(vanillajs_server);

}