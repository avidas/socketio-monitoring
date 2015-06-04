Building Realtime user monitoring and targeting platform with Node, Express and Socket.io
===
Being able to target users and send targeted notifications can be key to turn visitors into conversions and tighten your funnel. Offerings such as mailchimp and mixpanel offer ways to reach out to users but in most of those cases you only get to do them in post processing. However, there are situations when it would be really powerful is to be able to track users as they are navigating your website and send targeted notifications to them.

###Use Cases
Imagine that a buyer is looking for cars to buy and is interested in vehicles of a particular model and brand. It is very likely that he/she will visit several sites to compare prices. If there are a few results the buyer has looked at already, there may be an item which would fit the profile of this targeted user. If you are able to prompt and reach out to the user as the user is browsing through several results, it could make the difference between a sale and user buying from a different site. This is particularly useful for high price, high options scenerios e.g. Real Estate/Car/Electronics purchases. For use cases where the price is low or the options are fewer, e.g. a SAAS offering with a 3 tiers, this level of fine grained tracking may not be necessary. However, if you have a fledgeling SAAS startup, you may want to do this in the spirit of [doing things that don't scale](http://paulgraham.com/ds.html).

###Prerequisites
This article assumes that you have [node and npm](https://nodejs.org/) installed on your system. It would be also be useful to get familiar with [Express.js](http://expressjs.com/), the de facto web framework on top of Node.js. [Socket.io](http://socket.io/) is a Node.js module that abstracts WebSocket, JSON Polling and other protocols to enable simultaneous bi directional communication between connected parties. This article makes heavy use of Socket.io terminology, so it would be good to be familiar with sending and receiving events, broadcast, namespaces and rooms.

###Install and run

Start by git cloning the repo, install dependencies and run the app.

```bash
git clone git@github.com:avidas/socketio-monitoring.git
cd socketio-monitoring
npm install
npm start
```
We use Socket.io's realtime message passing and user sessions as key sources to 

Now navigate to localhost:8080/admin on a browser e.g Chrome. Now, on a different browser, e.g. Firefox, navigate to localhost:8080 and browse around. You will see that the admin page gets updated with the url endpoints as you navigate your way through the website in firefox. You can even send an alert to the user by pressing the send offer button.

###Walkthrough

Let's get into how this works. When an admin visits localhost:8080/admin, she joins a Socket.io namespace called adminchannel.

```javascript
var adminchannel = io.of('/adminchannel');
```
When a new user visits a page, we pass the express sessionID of the user to the templating engine. 
```javascript
res.render('index', {a:req.sessionID});
```

The template sets the value of sessionID as a hidden input field.

```html
<body>
<input type="hidden" id="user_session_id" value="<%= a %>" />
  <div id="device" style="font-size: 45px;">2015 Tesla Cars</div>
    <a href="/about">About</a>
  <br />
  <a href="/">Home</a>
</body>
```
After the page has loaded, it will emit a pageChange event and send back userData with current page and sessionID. 

```javascript
  socket.emit('pageChange', userData);
```
On server side, when pageChange is received, a Socket.io event called alertAdmin is sent to the adminchannel namespace. This ensures that only the admins are alerted that user with particular session id and particular socket id has navigated to a different page. Since admins join separate namespace, this can easily scale to multiple admins as well.

```javascript
  socket.on('pageChange', function(userData){
    userData.socketID = socket.id;
    userData.clientIDs = clientIDs;
    console.log('user with sid ' + userData.sid + ' and session id ' + userData.socketID + ' changed page ' + userData.page);
    adminchannel.emit('alertAdmin', userData);
  });
```

When altertAdmin is received on the client side, the UI dashboard is updated so that the admin has a realtime dashboard of users navigating the site. 

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
Now, the admin may choose to send certain notifications to the particular user. When the admin clicks on the button, a socket.io event called adminMessage is sent to the general namespace.
```javascript
  //Allow admin to send adminMessage
  $('body').on('click', '.offerClass', function () {
    socket.emit('adminMessage', userDataGlob);
  });
```
When adminMessage is received on the server side, we broacast to the specific user the message. Since every user always joins into a room identified by their socketID, we can send a notification by using socket.broadcast.to(userData.socketID) and we send an event called adminBroadcast with the data.
```javascript
  socket.on('adminMessage', function(userData) {
    socket.broadcast.to(userData.socketID).emit('adminBroadcast', userData);
  });
```
Finally on the client side of the user when adminBroadcast is received, the user can be alterted with a notification. However, you can easily use it for more complex use cases such as dynamically updating the page results, update ads section to show offers and so on. 
```javascript
  socket.on('adminBroadcast', function(userData){
    alert('Howdy there ' + userData.sid + ' ' + userData.socketID + ' ' + userData.page);
  })
```

There you have an end to end way in which a set of admins can track a set of users on a website and send notifications. The codebase is on github under link.

In conclusion, this system is valuale when the user's primary reason for visit has a purchasing intent. E-commerce and SAAS platforms have recognized the importance to user segmentation and targeted outreach. This system enables you to minimize the latency of such outreach. Reliance on fully open source tools allows you to focus on the sales.
