window.onload = function(){
  var currentURL = window.location.href;
  //we set a hidden field where we set the users session id
  //this is used to indentify user as they move across pages
  var userSID = document.getElementById('user_session_id').value;
  var socket = io();

  var userData = {
    page: currentURL,
    sid: userSID
  }

  //Once admin broadcast is received, pop an alert
  socket.on('adminBroadcast', function(userData){
    alert('Howdy there ' + userData.sid + ' ' + userData.socketID + ' ' + userData.page);
  });

  //emit pageChange emit
  socket.emit('pageChange', userData);
}