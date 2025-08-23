////
////  Popup functions 
////

function open_popup(html) {
  document.getElementById('popup').style.display = 'block';
  document.getElementById('popup-screen').style.display = 'block';
  document.getElementById('popup').innerHTML = html;
}

function loading_popup() {
  document.getElementById('popup').style.display = 'block';
  document.getElementById('popup-screen').style.display = 'block';
  document.getElementById('popup').innerHTML = `
    <div style="width: 100%; text-align: center;">
      Loading... <br/>
      <div id="loading-anim">&#129387;</div>
    </div>
  `;
}

//  Create a database called 'untitled_db'.
function close_popup() {
  document.getElementById('popup').style.display = 'none';
  document.getElementById('popup-screen').style.display = 'none';
}
