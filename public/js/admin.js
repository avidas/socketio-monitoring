var userDataGlob = {};

$(function() {

  var socket = io();

  //Allow admin to send adminMessage
  $('body').on('click', '.offerClass', function () {
    socket.emit('adminMessage', userDataGlob);
  });
  
  //get adminchannel connection
  var adminsocket = io('/adminchannel');
  adminsocket.on('user left', function(userData){
    console.log(userData.sid + ' has left.');
  });

  adminsocket.on('initAdmin', function(clientIDs){
    console.log(clientIDs);
  });

  adminsocket.on('alertAdmin', function(userData){
    console.log(userData.clientIDs);
    var panel = document.getElementById('panel');

    var val = " User with session id " + userData.sid + " and with socket id " + userData.socketID + " has navigated to " + userData.page;

    userDataGlob = userData;

    var list = $('<ul/>').appendTo('#panel');

    //Dynamic display of users interacting on your website
    $("#panel ul").append('<li> ' + val + ' <button type="button" class="offerClass" id="' + userData.socketID + '">Send Offer</button></li>');
  });
});