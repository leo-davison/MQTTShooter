var Networking = Networking || {};

Networking.gameName = "game_mygamename";
Networking.server = "bandicoot0.hursley.ibm.com";
Networking.port = 20004;

// data structure tracking remote players
Networking.RemotePlayers = {

	addPlayer : function(name, shipRef) {
		this[name] = {
			ship : shipRef
		};
	},

	removePlayer : function(name) {
		if (this.haveHandler(name)) {
			delete this[name];
		}
	},

	haveHandler : function(name) {
		if (this.hasOwnProperty(name)) {
			return true;
		}

		return false;		
	},

	handleUpdateMessage : function(name, data) {
		if (this.haveHandler(name)) {
			this[name].ship.handleRemoteUpdate(data);
		}
	},

	getShipRef: function(name) {
		if (this.haveHandler(name)) {
			return this[name].ship;
		}

		return null;
	}
}

// perform initial setup
Networking.Initialise = function() {
	// register message handler
	MQTTUtils.Client.SetMessageHandler(Networking.MessageReceived);	

	// connect to the broker
	MQTTUtils.Client.ConnectToServer(GLOBALS.playerName, Networking.server, Networking.port, function() {
		console.log("Connected to server.");
		// on connect, subscribe to all game state topics
		MQTTUtils.Client.SubscribeToTopic("/"+Networking.gameName+"/state/#");
	}, "/"+Networking.gameName+"/state/removed/"+GLOBALS.playerName, GLOBALS.playerName);

	// grab a ref to the current addProjectile function
	var addProjectileFunc = ProjectileManager.addProjectile;
	// add it back to the manager under a different name
	ProjectileManager.originalAddProjectile = addProjectileFunc;
	// override the addProjectile function with our own interceptor
	ProjectileManager.addProjectile = function(startPos, velocity, originator) {
		if (originator === GLOBALS.playerName) {	
			var dataObj = {
				pos: startPos,
				vel : velocity
			};
			// send to the network
			MQTTUtils.Client.PublishMessage("/"+Networking.gameName+"/state/projectiles/"+GLOBALS.playerName, JSON.stringify(dataObj));

			// call through to the original function
			ProjectileManager.originalAddProjectile(startPos, velocity, originator);
		}
	};
}

// handle message from network
Networking.MessageReceived = function(message) {
	
	var topic = message.destinationName;
	var topicParts = topic.split("/");
	var remoteName = topicParts[topicParts.length-1];

	// ignore updates from the local player
	if (remoteName === GLOBALS.playerName) {
		return;
	}

	// is this a player update message?
	if (topic.indexOf("/"+Networking.gameName+"/state/players") >= 0) {								

		// do we have a handler for this player?
		if (Networking.RemotePlayers.hasOwnProperty(remoteName) === false) {
			console.log("New Remote Player: " + remoteName);

			// create a new ship object
			var remoteShip = new TriangleShip(remoteName, 0xff0000);
			// override the update function to remove the velocity based pos updates
			remoteShip.update = function(deltaTime){};
			// add in handler for remote updates
			remoteShip.handleRemoteUpdate = function(data) {
				this.triangle.setPosition(data.pos);
				this.triangle.setRotation(data.rot);
			}

			// add the ship object to the remote players
			Networking.RemotePlayers.addPlayer(remoteName, remoteShip);

			// add the ship to the scene
			GAMESCENE.AddTriangleShip(remoteShip);
		}

		// parse the JSON and pass to the handler
		var dataObj = JSON.parse(message.payloadString);	
		Networking.RemotePlayers.handleUpdateMessage(remoteName,dataObj);

		return;
	}

	// is this a player exit message?
	if (topic.indexOf("/"+Networking.gameName+"/state/removed") >= 0) {
		console.log("remove player " + remoteName);
		// grab a reference to the ship object
		var ship = Networking.RemotePlayers.getShipRef(remoteName);
		// remove the remote player ref
		Networking.RemotePlayers.removePlayer(remoteName);
		// remove the ship from the game scene
		if (ship !== null) {
			console.log("Removing tri ship for" + remoteName);
			GAMESCENE.RemoveTriangleShip(ship);
		}	

		return;
	}

	// is this a projectile event?
	if (topic.indexOf("/"+Networking.gameName+"/state/projectiles") >= 0) {
		var dataObj = JSON.parse(message.payloadString);
		// call through to original method, bypassing our redirect...
		ProjectileManager.originalAddProjectile(dataObj.pos, dataObj.vel, remoteName);
		return;
	}
};

// handle pushing local data to network
Networking.Update = function(deltaTime) {
	// grab local player ship data and send
	var localShip = GAMESCENE.localPlayer;

	// if we don't have a local ship for some reason, or it's not active then no work to do
	if (localShip === null || localShip.active === false) {
		return;
	}

	// create an object to send on the network with the position and rotation of the
	// local player ship
	var dataObj = {
		name : localShip.name,
		pos: localShip.triangle.getPosition(),
		rot: localShip.triangle.getRotation()
	};

	// pass data to MQTT client to publish
	MQTTUtils.Client.PublishMessage("/"+Networking.gameName+"/state/players/"+localShip.name, JSON.stringify(dataObj));
}