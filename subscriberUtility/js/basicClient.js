var clientID = null;
var clientObj = null;

// map of topic strings to objects containing page elements which
// are used to display messages
var subscriptions = {};
// count the number of subscriptions
var subCount = 0;

// reset everything when the page loads
function onPageLoad() {	
	document.getElementById("connect-button").hidden = false;
	document.getElementById("disconnect-button").hidden = true;
	document.getElementById("subscribe-form").hidden = true;
	document.getElementById("subscriptions").hidden = true;
}

// remove all subs objects from the subscriptions map (after a disconnect for example)
function clearSubs() {
	var subsDiv = document.getElementById("subscriptions");

	for (var topic in subscriptions) {
		if (subscriptions.hasOwnProperty(topic)) {
			// remove row...
			subsDiv.removeChild(subscriptions[topic].div);
			// remove from data structure
			delete subscriptions[topic];
			subCount--;
		}
	}
}

// establish an MQTT connection to a specified server
function connectToServer() {
	var serverIP = document.getElementById("server-ip").value;
	var serverPort = document.getElementById("server-port").value;
	console.log("Connect to server: " + serverIP + ":" + serverPort);

	clientID = "subAppClient" + new Date().getTime();
	clientObj = new Paho.MQTT.Client(serverIP, parseInt(serverPort), clientID);

	clientObj.onConnectionLost = onConnectionLost;
	clientObj.onMessageArrived = onMessage;

	clientObj.connect({onSuccess: onConnect});
}

// close our connection to the server
function disconnectFromServer() {
	console.log("disconnectFromServer");	
	clientObj.disconnect();
	onPageLoad();
	clearSubs();
}

// callback for when we have successfully connected to the server
function onConnect() {
	console.log("Connected.");
	document.getElementById("connect-button").hidden = true;
	document.getElementById("disconnect-button").hidden = false;
	document.getElementById("subscribe-form").hidden = false;
}

// callback for when we have a dropped connection
function onConnectionLost(responseObject) {
	if (responseObject.errorCode !== 0) {
		console.log("onConnectionLost:"+responseObject.errorMessage);
		onPageLoad();
		clearSubs();
  	}
}

// create a new MQTT subscription and associated page elements
function createNewSubscription() {
	// grab the topic from the page form
	var topic = document.getElementById("topic").value.trim();

	// perform some basic sanity checking.
	if (topic.length === 0) {
		return;
	}

	if (topic in subscriptions) {
		console.log("already have a sub with this topic");
		return;
	}

	// beyond the above, we rely of the sub call to fail if
	// the topic string is invalid.

	console.log("create new subscription: " + topic);

	// issue the subscribe request to the server.  Only update
	// the page and our data structure if the subscribe is
	// successful (do work in success callback).
	clientObj.subscribe(topic, {
		onFailure : function(responseObject) {
			console.log("Failed to subscribe: " + responseObject.errorCode);
			// don't update the page
		},

		onSuccess : function(responseObject) {
			// grab the div on the page that houses the subs display items
			var subsDiv = document.getElementById("subscriptions");
			// ensure that it's not hidden (will be when there are no subs)
			subsDiv.hidden = false;

			// create a new div to house the messages
			var div = document.createElement("DIV");
			div.id = "subsection_" + topic;

			// create the delete button
			var nameRef = "button/" + topic;
			var button = document.createElement("BUTTON");
			button.id = nameRef;
			button.innerHTML = "delete subscription";

			button.onclick = function() {				
				console.log("delete subscription: " + topic);

				// do unsub
				clientObj.unsubscribe(topic);
				// remove row...
				subsDiv.removeChild(subscriptions[topic].div);
				subsDiv.removeChild(subscriptions[topic].spacing);
				// remove from data structure
				delete subscriptions[topic];
				subCount--;

				if (subCount === 0) {
					subsDiv.hidden = true;
				}
			}	

			// create a new table for the div
			var table = document.createElement("TABLE");

			// create header
			var header = table.createTHead();
			var hRow = header.insertRow(0);
			var tCell = hRow.insertCell(0);
			var bCell = hRow.insertCell(1);

			tCell.innerHTML = "Topic: " + topic;
			bCell.appendChild(button);
			
			var textArea = document.createElement("TEXTAREA");
			textArea.readOnly = true;
			textArea.cols = 150;
			textArea.rows = 6;

			var spacing = document.createElement("BR");

			div.appendChild(table);
			div.appendChild(textArea);			

			// add the div to the page
			subsDiv.appendChild(div);
			subsDiv.appendChild(spacing);

			// the object we will store in our subs map
			var subObj = {
				div : div, // ref to the div (for easy deleting later)
				text : textArea, // ref to the text area (to add msgs to)
				spacing : spacing, // ref to the <br> tag (for easy deleting)
				msgCount : 0 // count of the messages currently displayed.
			};			

			// store the obj and update our sub count
			subscriptions[topic] = subObj;	
			subCount++;
		}
	});
}

// callback for when a message is received
function onMessage(message) {	
	var topic = message.destinationName;

	// find any matching subscriptions in our map
	var matchingSubs = findMatchingSubs(topic);

	// did we find any?
	if (matchingSubs.length === 0) {
		console.log("don't seem to have matching sub...");
		return;
	}		

	// for each matching sub we have, add the message to the
	// appropriate text area.
	for (var i=0; i<matchingSubs.length; i++) {
		// grab the entry from the map
		var entry = subscriptions[matchingSubs[i]];
		var textArea = entry.text;
		// grab the current text (i.e all the messages displayed so far)
		var current = textArea.value;		

		// if we are already displaying 500 messages, reset...
		if (entry.msgCount === 500) {
			current = "";
			entry.msgCount = 0;
		}

		// stick the most recent message at the top.
		// append a newline, so that each message is on
		// its own line.
		var newText = message.payloadString + "\n";
		// then append the existing messages
		newText += current;
		textArea.value = newText;
		// note how many messages we are now displaying
		entry.msgCount++;
	}	
}

// returns an array of the topic string keys from the subs map
// that match a given topic string.
// A match could be due to a wildcard in the topic, eg ('#' or '+')
function findMatchingSubs(topic) {
	// we will add matching topic strings to this array
	var ret = [];

	// split the topic along the '/'
	var topicParts = topic.split("/");
	var depth = topicParts.length;

	// for each topic in the subs map...
	for (var nextTopicString in subscriptions) {
		if (subscriptions.hasOwnProperty(nextTopicString) === false) {
			continue;
		}

		// split this topic string as well
		var theseParts = nextTopicString.split("/");

		// if this topic string has more levels than the one
		// we were given, then it can't be a match.
		if (theseParts.length > depth) {
			continue;
		}

		var matching = false;

		// check for the easy case of an exact match
		if (nextTopicString === topic) {
			matching = true;			
		} else {
			// other wise we'll have to check each part of the topic strings
			for (var i=0; i<depth; i++) {
				if (theseParts[i] === "#") {
					matching = true;					
					break;
				}

				if (theseParts[i] === "+") {				
					matching = (theseParts.length === depth);

					if (matching) {						
						break;
					}
				}

				if (theseParts[i] !== topicParts[i]) {
					break;
				}
			}
		}

		if (matching) {
			ret.push(nextTopicString);
		}
	}

	return ret;
}