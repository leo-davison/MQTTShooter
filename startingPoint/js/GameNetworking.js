var Networking = Networking || {};

// data structure tracking remote players
Networking.RemotePlayers = {

	addPlayer : function(name, handler, shipRef) {
		this[name] = {
			handler : handler,
			ship : shipRef
		};
	},

	removePlayer : function(name) {
		if (this.haveHandler(name)) {
			delete this[name];
		}
	},

	haveHandler : function(name) {
		if (name in this) {
			return true;
		}

		return false;		
	},

	handleUpdateMessage : function(name, data) {
		if (this.haveHandler(name)) {
			this[name].handler.handleRemoteUpdate(data);
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
	MQTTUtils.MessageHandlers.AddHandler(Networking.MessageReceived);

	// configure a will message
	var willMsg = MQTTUtils.CreateWillMessage("/game/state/removed/"+GLOBALS.playerName, GLOBALS.playerName);

	// connect to the broker
	MQTTUtils.Client.ConnectToServer(GLOBALS.playerName, "bandicoot0.hursley.ibm.com", 20004, willMsg, function() {
		console.log("on connect");
		// on connect, subscribe to all game state topics
		MQTTUtils.Client.SubscribeToTopic("/game/state/#");
	});
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
	if (topic.indexOf("/game/state/player") >= 0) {								

		// do we have a handler for this player?
		if (Networking.RemotePlayers.hasOwnProperty(remoteName) === false) {
			console.log("New Remote Player: " + remoteName);
			// create a remote delegate to handle network updates for the remote player.			
			var newHandler = new RemoteShipDelegate(remoteName);
			// add a ship to the scene
			var ship = GAMESCENE.AddTriangleShip(0xff0000, newHandler);

			// add the handler object to the remote players
			Networking.RemotePlayers.addPlayer(remoteName, newHandler, ship);

			// add a UI arrow to point from local player towards this enemy
			var arrow = new EnemyArrows.EnemyArrow(ship);
		}

		// parse the JSON and pass to the handler
		var dataObj = JSON.parse(message.payloadString);	
		Networking.RemotePlayers.handleUpdateMessage(remoteName,dataObj);

		return;
	}

	// is this a player exit message?
	if (topic.indexOf("/game/state/removed") >= 0) {
		// grab a reference to the ship object
		var ship = Networking.RemotePlayers.getShipRef(remoteName);
		// remove the remote player ref
		Networking.RemotePlayers.removePlayer(remoteName);
		// remove the ship from the game scene
		if (ship !== null) {
			GAMESCENE.RemoveTriangleShip(ship);
		}

		EnemyArrows.ArrowManager.RemoveArrow(remoteName);

		return;
	}

	// is this a projectile event?
	if (topic.indexOf("/game/state/projectiles") >= 0) {
		var dataObj = JSON.parse(message.payloadString);
		// lookup the ship that matches this remote player,
		// so we can set the projectile originator
		var firingShipRef = Networking.RemotePlayers.getShipRef(remoteName);
		//ProjectileManager.AddProjectile()
		if (firingShipRef !== null) {
			ProjectileManager.addProjectile(dataObj.pos, dataObj.vel, firingShipRef);
		}
		return;
	}
};

// send local player info to network
Networking.SendPlayerUpdate = function(dataObj) {
	var dataStr = JSON.stringify(dataObj);
	MQTTUtils.Client.PublishMessage("/game/state/players/"+GLOBALS.playerName, dataStr);
};

// send projectile creation event to network
Networking.SendProjectileCreateEvent = function(dataObj) {
	var dataStr = JSON.stringify(dataObj);
	MQTTUtils.Client.PublishMessage("/game/state/projectiles/"+GLOBALS.playerName, dataStr);	
};