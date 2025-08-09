////
////  DASHBOARD
////


//  Load the settings page. 
function load_settings() {
  window.history.pushState({ },"", `/user-settings`);
  unrender_all();
  render_user_profile_button();  
  open_auth_box = 'none';
  render_settings();
}

//  Renders and resets the settings HTML.
function render_settings() {
  document.getElementById('user-settings').style.display = 'block';                    //  Make sure the page displays.
  document.getElementById('username-settings').value = _current_user.username;         //  Reset the username & display name. 
  document.getElementById('display-name-settings').value = _current_user.display_name;
  document.getElementById('current-password-settings').value = '';                     //  Make the password values blank
  document.getElementById('new-password-settings').value = '';
  document.getElementById('confirm-new-password-settings').value = '';
  document.getElementById('settings-error').innerHTML = '';                            //  Reset the error message
  document.getElementById('delete-acct-error').innerHTML = '';
  document.getElementById('settings-success').innerHTML = '';                          //  Reset the success message
  document.getElementById('top-bar-title').innerHTML = `<h3 style="margin: 0px;">${_current_user.username}'s Settings</h3>`;

}

function update_password() {
  let old_pass = document.getElementById('current-password-settings').value;
  let new_pass = document.getElementById('new-password-settings').value;
  let confirm_pass = document.getElementById('confirm-new-password-settings').value;

  let err_msg = '';
  if (!old_pass) {
    err_msg = 'Please enter your current password.';
  } else if (new_pass.length < 4) {
    err_msg = 'New passwords must be at least 4 characters.';
  } else if (new_pass != confirm_pass) {
    err_msg = `New passwords don't match!`;
  }
  if (err_msg.length) {
    document.getElementById('settings-error').style.display = 'block';
    document.getElementById('settings-error').innerHTML = err_msg;
    document.getElementById('settings-success').innerHTML = '';
    return;
  }
  console.log('Updating password!');
  http.open("POST", "/api/update-password");
  http.send(JSON.stringify({
    user_id: _current_user.id,
    old_pass: old_pass,
    new_pass: new_pass
  }));
  http.onreadystatechange = (e) => {
    let response;      
    if (http.readyState == 4 && http.status == 200) {
      response = JSON.parse(http.responseText);
      if (!response.error) {
        console.log("Response recieved! Password updated.");
        render_settings();
        document.getElementById('settings-error').style.display = 'none'; //  Needed to remove margin spacing
        document.getElementById('settings-success').innerHTML = `Your password has been updated! :)`;

        
      } else {
        document.getElementById('settings-error').innerHTML = response.msg;
      }
    }
  }
    
}

//
function delete_account() {
  let confirm_username = document.getElementById('confirm-username-to-delete-acct').value;
  if (confirm_username != _current_user.username) {
    alert(`Account not deleted. You entered ${confirm_username}, not ${_current_user.username}.`);
    return;
  }
  if (!confirm("All data will be deleted, from all databases you've created.  Are you sure you want to delete your account?")) {
    return;
  }
  let confirm_pass = document.getElementById('confirm-pass-to-delete-acct').value;
  http.open("POST", "/api/delete-account");
  http.send(JSON.stringify({
    user_id: _current_user.id,
    pass: confirm_pass
  }));
  http.onreadystatechange = (e) => {
    let response;      
    if (http.readyState == 4 && http.status == 200) {
      response = JSON.parse(http.responseText);
      if (!response.error) {
        console.log("Response recieved! Account deleted.");
        localStorage.removeItem('session_id'); //  sets to null
        _current_user = {};
        _session_id = null;
        render_user_profile_button();  //  Close the register popup.
        open_auth_box = 'none';  //  Mark the register popup as closed.
        render_landing();
        alert(`The account with username ${confirm_username} has been deleted, along with all databases and data.`)
      } else {
        alert(`Your account has NOT been deleted! ${response.msg}`);
      }
    }
  }
}