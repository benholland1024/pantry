////
////  DASHBOARD
////


function load_dashboard() {
  if (!_current_user.username) {
    return;
  }
  window.history.pushState({ },"", `/dashboard`);
  unrender_all();
  document.getElementById('dashboard').style.display = 'block';
  render_database();
}

function render_database() {
  document.getElementById('top-bar-title').innerHTML = `<h3 style="margin: 0px;">${_current_user.username}'s Dashboard</h3>`;

}