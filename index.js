var app = require('express')();
var session = require('express-session');
var server = require('http').Server(app);
var io = require('socket.io')(server);
//initialize and retrieve the adminchannel interface
var adminchannel = io.of('/adminchannel');
var path = require('path');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(require('express').static(path.join(__dirname, '/public')));

server.listen(8080);

app.use(session({secret: 'secret'}));

app.get('/', function (req, res) {
  console.log(req.sessionID);
  res.render('index', {a:req.sessionID});
});

app.get('/about', function(req,res){
  console.log(req.sessionID);
  res.render('about', {a:req.sessionID});
});

app.get('/admin', function(req, res){
  console.log(req.url);
  res.render('admin', {a:req.sessionID});
});

//http://stackoverflow.com/questions/6563885/socket-io-how-do-i-get-a-list-of-connected-sockets-clients
function findClientsSocket(roomId, namespace) {
    //initializes and retrieves the given namespace by its pathname identify nsp
    var res = [], ns = io.of(namespace ||"/");    // the default namespace is "/"

    if (ns) {
        //namespace.connected returns hash of Socket objects
        //that are connected to this samespace indexed by id
        for (var id in ns.connected) {
            if(roomId) {
                //List of strings identifying the rooms this socket is in.
                var index = ns.connected[id].rooms.indexOf(roomId);
                if(index !== -1) {
                    res.push(ns.connected[id]);
                }
            } else {
                res.push(ns.connected[id]);
            }
        }
    }
    return res;
}

//on adminchannel namespace
adminchannel.on('connection', function(socket){
    var clients = findClientsSocket();
    var clientIDs = [];
    for (var index in clients) {
      clientIDs.push(clients[index].id);
    }
    //Emit the event initAdmin with connected clientIDs when admin connects
    adminchannel.emit('initAdmin', clientIDs);
});

io.on('connection', function (socket) {
  //get socket id and hence room id for all clients
  var clients = findClientsSocket();
  var clientIDs = [];
  for (var index in clients) {
    console.log(clients[index].id);
    clientIDs.push(clients[index].id);
  }

  //when pageChange happens on any client
  socket.on('pageChange', function(userData){
    userData.socketID = socket.id;
    userData.clientIDs = clientIDs;
    console.log('user with sid ' + userData.sid + ' and session id ' + userData.socketID + ' changed page ' + userData.page);

    //Alert admin that user with particular session id and particular socket id has navigated to a different page
    adminchannel.emit('alertAdmin', userData);
  });

  //broadcast to particular socket (same as room id) the event adminBroadcast with userData
  socket.on('adminMessage', function(userData) {
    socket.broadcast.to(userData.socketID).emit('adminBroadcast', userData);
  });

  socket.on('disconnect', function(userData) {
    userData.socketID = socket.id;
    adminchannel.emit('user left', userData);
  });

});