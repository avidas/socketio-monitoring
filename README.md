Building Realtime user monitoring and targeting platform with Node, Express and Socket.io
===
Being able to target users and send targeted notifications can be key to turn visitors into conversions and tighten your funnel. Offerings such as mailchimp and mixpanel offer ways to reach out to users but in most of those cases you only get to do them in post processing. However, there are situations when it would be really powerful is to be able to track users as they are navigating your website and send targeted notifications to them.

###Use Cases
Imagine that a buyer is looking for cars to buy and is interested in vehicles of a particular model and brand. It is very likely that he/she will visit several sites to compare prices. If there are a few results the buyer has looked at already, there may be an item which would fit the profile of this user. If you are able to prompt and reach out as the user is browsing through several results, it could make the difference between a sale and user buying from a different site. This is particularly useful for high price, high options scenerios e.g. Real Estate/Car/Electronics purchases. For use cases where the price is low or the options are fewer, e.g. a SAAS offering with a 3 tiers, this level of fine grained tracking may not be necessary. However, if you have a fledgling SAAS startup, you may want to do this in the spirit of [doing things that don't scale](http://paulgraham.com/ds.html).

###Prerequisites
This article assumes that you have [node and npm](https://nodejs.org/) installed on your system. It would be also be useful to get familiar with [Express.js](http://expressjs.com/), the de facto web framework on top of Node.js. [Socket.io](http://socket.io/) is a Node.js module that abstracts WebSocket, JSON Polling and other protocols to enable simultaneous bi directional communication between connected parties. This article makes heavy use of Socket.io terminology, so it would be good to be familiar with sending and receiving events, broadcasts, namespaces and rooms.

###Install and run

Start by git cloning the repo, install dependencies and run the app.

```bash
git clone git@github.com:avidas/socketio-monitoring.git
cd socketio-monitoring
npm install
npm start
```

By default this will start the server at port 8080. navigate to localhost:8080/admin on a browser e.g Chrome. Now, on a different browser, e.g. Firefox, navigate to localhost:8080 and browse around. You will see that the admin page gets updated with the url endpoints as you navigate your way through the website in firefox. You can even send an alert to the user on Firefox by pressing the send offer button on Chrome!

###Walkthrough

Let's get into how this works. When an admin visits localhost:8080/admin, she joins a Socket.io namespace called adminchannel.

```javascript
var adminchannel = io.of('/adminchannel');
```

When a new user visits a page, we get the [express sessionID](https://github.com/expressjs/session#reqsession) of the user by calling req.sessionID and pass it to the templating engine for rendering. The session id ensures that we can identify a user across pages and browser tabs.

```javascript
res.render('index', {a:req.sessionID});
```

The template sets the value of sessionID as a hidden input field on the page, with the id "user_session_id".

```html
<body>
<input type="hidden" id="user_session_id" value="<%= a %>" />
  <div id="device" style="font-size: 45px;">2015 Tesla Cars</div>
    <a href="/about">About</a>
  <br />
  <a href="/">Home</a>
</body>
```
After the page has loaded, it will emit a pageChange socket.io event. Accompanying the event is the url endpoint for the current page and sessionID.

```javascript
  var userSID = document.getElementById('user_session_id').value;
  var socket = io();

  var userData = {
    page: currentURL,
    sid: userSID
  }
  socket.emit('pageChange', userData);
```
On server side, when pageChange is received, a Socket.io event called alertAdmin is sent to the adminchannel namespace. This ensures that only the admins are alerted that user with particular session id and particular socket id has navigated to a different page. Since anyone with access to /admin endpoint will join the adminchannel namespace, this can easily scale to multiple admins.

```javascript
  socket.on('pageChange', function(userData){
    userData.socketID = socket.id;
    userData.clientIDs = clientIDs;
    console.log('user with sid ' + userData.sid + ' and session id ' + userData.socketID + ' changed page ' + userData.page);
    adminchannel.emit('alertAdmin', userData);
  });
```

When altertAdmin is received on the client side, the UI dashboard is updated so that the admins have a realtime dashboard of users navigating the site. This is done via Jquery which appends each new page change to a html list as users navigate through the site.

```javascript
  adminsocket.on('alertAdmin', function(userData){
    var panel = document.getElementById('panel');
    var val = " User with session id " + userData.sid + " and with socket id " + userData.socketID + " has navigated to " + userData.page;
    userDataGlob = userData;
    var list = $('<ul/>').appendTo('#panel');
    //Dynamic display of users interacting on your website
    $("#panel ul").append('<li> ' + val + ' <button type="button" class="offerClass" id="' + userData.socketID + '">Send Offer</button></li>');
  });
```
Now, the admin may choose to send certain notifications to the particular user. When the admin clicks on the "Send Offer" button, a socket.io event called adminMessage is sent to the general namespace on the server with the user specific data.
```javascript
  //Allow admin to send adminMessage
  $('body').on('click', '.offerClass', function () {
    socket.emit('adminMessage', userDataGlob);
  });
```
When adminMessage is received on the server side, we broacast to the specific user the message. Since every user always joins into a room identified by their socketID, we can send a notification only to that user by using socket.broadcast.to(userData.socketID) and we send an event called adminBroadcast with the data. 

Here, you could have chosen to broadcast a message to all the users, or to a particular room, which subsets of users could have joined. Thus, you can fine tune how you want to reach out to users as well.

```javascript
  socket.on('adminMessage', function(userData) {
    socket.broadcast.to(userData.socketID).emit('adminBroadcast', userData);
  });
```

Finally on the client side of the user when adminBroadcast is received, the user can be alterted with a notification. However, you can easily use it for more complex use cases such as dynamically updating the page results, update ads section to show offers and so on by setting up event listeners. 

```javascript
  socket.on('adminBroadcast', function(userData){
    alert('Howdy there ' + userData.sid + ' ' + userData.socketID + ' ' + userData.page);
  })
```

There you have an end to end way in which a set of admins can track a set of users on a website and send notifications. This system can be particularly valuable when the user's primary reason for visit accompanies purchasing intent. E-commerce and SAAS platforms have recognized the importance to user segmentation and targeted outreach. This system enables you to minimize the latency of such outreach. On the plus side, you can get to rely on fully open source tools with broad user bases and support.

If you are doing some level of realtime tracking on your site, I would love to hear about it. Feel free to send over any feedback to avi@aviadas.com.