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

Networking.localProjectiles = [];

// perform initial setup
Networking.Initialise = function() {
	// register message handler
	MQTTUtils.Client.SetMessageHandler(Networking.MessageReceived);	

	// connect to the broker
	MQTTUtils.Client.ConnectToServer(GLOBALS.playerName, Networking.server, Networking.port, function() {
		console.log("on connect");
		// on connect, subscribe to all game state topics
		MQTTUtils.Client.SubscribeToTopic("/"+Networking.gameName+"/state/#");
	}, "/"+Networking.gameName+"/state/removed/"+GLOBALS.playerName, GLOBALS.playerName);

	// grab a ref to the current addProjectile function
	var addProjectileFunc = ProjectileManager.addProjectile;
	// add it back to the manager under a different name
	ProjectileManager.originalAddProjectile = addProjectileFunc;
	// override the addProjectile function with our own interceptor
	ProjectileManager.addProjectile = function(startPos, velocity, originator, id) {
		if (originator === GLOBALS.playerName) {	
			var dataObj = {
				id : id,
				pos: startPos,
				vel : velocity
			};
			// send to the network
			MQTTUtils.Client.PublishMessage("/"+Networking.gameName+"/state/projectiles/"+GLOBALS.playerName, JSON.stringify(dataObj));

			// call through to the original function
			ProjectileManager.originalAddProjectile(startPos, velocity, originator, id);

			// keep track of local projectile ids			
			Networking.localProjectiles.push(id);
		}
	};


	// override the game scene function to handle collision response so that we can
	// intercept collision info and pass it to the network
	var collisionResponseFunc = GAMESCENE.PerformCollisionResponse;
	GAMESCENE.PerformCollisionResponse = function(collisions) {

		console.log("send collision data!");
		// collisions is an array of projectiles which has collided with the local
		// player.
		var trimmedData = [];

		for (var i=0; i<collisions.length; i++) {
			var nextProj = collisions[i];

			var nextData = {
				i : nextProj.id,
				p : nextProj.getPosition(), 
			};

			trimmedData.push(nextData);
		}

		var dataStr = JSON.stringify(trimmedData);

		MQTTUtils.Client.PublishMessage("/"+Networking.gameName+"/state/collisions/"+GLOBALS.playerName, dataStr);

		GAMESCENE.originalPerformCollisionResponse(collisions);
	};
	GAMESCENE.originalPerformCollisionResponse = collisionResponseFunc;
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
	
			// override the ships key state update function, to remove the 
			// local input gathering for this ship.  Key state updates will
			// be received in messages over the network.
			remoteShip.updateKeyState = function() {
				// no op
			}

			// add in handler for remote updates
			remoteShip.handleRemoteUpdate = function(data) {

				// both message types have key data
				this.keyState.left = data.key.left;
				this.keyState.right = data.key.right;
				this.keyState.up = data.key.up;

				// the full sync message type will have ship
				// position info, to ensure the local simulation
				// of the remote ship doesn't get too far out of
				// sync with the originators simulation.
				if (data.type === Networking.SyncTypeFull) {
					// overwrite pos/rot/vel data
					this.triangle.setPosition(data.pos);
					this.triangle.setRotation(data.rot);
					this.velocity.set(data.vel.x, data.vel.y, data.vel.z);
				}
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

	// is this collision info?
	if (topic.indexOf("/"+Networking.gameName+"/state/collisions") >= 0) {
		// data will be an array of collisions against the ship called 'remoteName'		

		var dataArray = JSON.parse(message.payloadString);

		for (var i=0; i<dataArray.length; i++) {
			// next collision obj
			var nextCollision = dataArray[i];
			var projectileID = nextCollision.i;
			var projectilePos = nextCollision.p;

			// find and destroy projectile
			var proj = ProjectileManager.getProjectileWithID(projectileID);
			if (proj != null) {
				proj.onCollision();
			}

			// create explosion
			var explosion = new Particles.Utils.ParticleExplosion(projectilePos, 150);
		}

		// find remote ship and reset
		var remoteShip = Networking.RemotePlayers.getShipRef(remoteName);

		if (remoteShip != null) {
			remoteShip.reset();
		}
	}

	// is this a projectile position sync?
	if (topic.indexOf("/"+Networking.gameName+"/state/projectileUpdates/") >= 0) {
		// parse the data
		var dataObj = JSON.parse(message.payloadString);

		// do we have an associated projectile?
		var theProj = ProjectileManager.getProjectileWithID(dataObj.i);

		if (theProj !== null) {
			theProj.handleRemoteUpdate(dataObj);
		}
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
		ProjectileManager.originalAddProjectile(dataObj.pos, dataObj.vel, remoteName, dataObj.id);

		// grab the newly added projectile and add in a remote update handler
		var newProj = ProjectileManager.getProjectileWithID(dataObj.id);

		if (newProj !== null) {
			newProj.handleRemoteUpdate = function(dataObj) {				
				this.mesh.position = dataObj.p;
				this.lastPosition.set(dataObj.l.x, dataObj.l.y, dataObj.l.z);				
			}
		}
		return;
	}
};

// after how many seconds should we sync the full local ship state
Networking.FullSyncInterval = 0.5;
Networking.SyncTypeKey = 0;
Networking.SyncTypeFull = 1;

Networking.SyncProjectiles = false;
Networking.ProjectileSyncInterval = 0.125;
Networking.LastProjectileSync = -1;

// handle pushing local data to network
Networking.Update = function(deltaTime) {
	// grab local player ship data and send
	var localShip = GAMESCENE.localPlayer;

	// if we don't have a local ship for some reason, or it's not active then no work to do
	if (localShip === null || localShip.active === false) {
		return;
	}

	// have we added a last key state?
	if (localShip.hasOwnProperty("lastKeyState") === false) {
		console.log("initial setup");
		// perform some initialsetup.
		localShip.lastKeyState = {
			left : localShip.keyState.left,
			right : localShip.keyState.right,
			up : localShip.keyState.up
		};			
		localShip.lastFullNetworkSync = -1;
	}

	// do we need to perform a full sync?
	if (localShip.lastFullNetworkSync === -1 || localShip.lastFullNetworkSync >= Networking.FullSyncInterval) {
		// do full sync
		var fullSyncData = {
			type : Networking.SyncTypeFull,
			pos  : localShip.triangle.getPosition(),
			rot  : localShip.triangle.getRotation(),
			vel  : localShip.velocity,
			key  : localShip.keyState
		};

		// pass data to network
		MQTTUtils.Client.PublishMessage("/"+Networking.gameName+"/state/players/"+localShip.name, JSON.stringify(fullSyncData));

		// note that we've updated
		localShip.lastFullNetworkSync = 0;
		localShip.lastKeyState.left = localShip.keyState.left;
		localShip.lastKeyState.right = localShip.keyState.right;
		localShip.lastKeyState.up = localShip.keyState.up;
	} else {
		// update the time since full sync
		localShip.lastFullNetworkSync += deltaTime;

		// has the keyboard state changed?
		if ((localShip.lastKeyState.left !== localShip.keyState.left) ||
			(localShip.lastKeyState.right !== localShip.keyState.right) ||
			(localShip.lastKeyState.up !== localShip.keyState.up)) {			
			// key state has changed, so update network
			var keyStateSyncData = {
				type : Networking.SyncTypeKey,
				key  : localShip.keyState
			};

			// update last known key state
			localShip.lastKeyState.left = localShip.keyState.left;
			localShip.lastKeyState.right = localShip.keyState.right;
			localShip.lastKeyState.up = localShip.keyState.up;
			
			// send to network
			MQTTUtils.Client.PublishMessage("/"+Networking.gameName+"/state/players/"+localShip.name, JSON.stringify(keyStateSyncData));
		}
	}

	// do we need to send local projetile position data?
	if (Networking.SyncProjectiles === true && (Networking.LastProjectileSync === -1 || Networking.LastProjectileSync >= Networking.ProjectileSyncInterval)) {
		var deadProjectiles = [];
		for (var i=0; i<Networking.localProjectiles.length; i++) {
			var nextProjectile = ProjectileManager.getProjectileWithID(Networking.localProjectiles[i]);

			// if we get null back, then this projectile must be gone.
			// make a note of the index, so we can splice it out of the list.			
			if (nextProjectile === null) {
				deadProjectiles.push(i);
				continue;
			}
			
			// it must still be around... send an update of the position
			var data = {
				i : nextProjectile.id,
				l : nextProjectile.getLastPosition(),
				p : nextProjectile.getPosition()
			};

			MQTTUtils.Client.PublishMessage("/"+Networking.gameName+"/state/projectileUpdates/"+localShip.name, JSON.stringify(data));
		}

		// remove ids of dead projectiles
		for (var i=deadProjectiles.length-1; i>=0; i--) {
			Networking.localProjectiles.splice(deadProjectiles[i], 1);
		}
	} else {
		Networking.LastProjectileSync += deltaTime;
	}
}