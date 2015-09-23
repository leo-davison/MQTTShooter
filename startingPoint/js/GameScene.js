var GAMESCENE = {
	// map of ships in the scene by name
	triShips : {},

	// reference to the local player ship
	localPlayer : null,

	// Bounding area for the game
	bounds : null,

	// setup the scene
	Setup : function() {
		// setup a background
		var size = window.innerWidth * 8;
		var step = 80;
		var gridHelper = new THREE.GridHelper( size, step );
		gridHelper.position.z -= 10;
		gridHelper.rotation.x = (THREE.Math.degToRad(-90));
		gridHelper.material.transparent = true;
		gridHelper.material.opacity = 0.2;				
		GLOBALS.scene.add( gridHelper );

		// setup a local player
		this.localPlayer = new TriangleShip(GLOBALS.playerName, 0x1fb4da);
		this.AddTriangleShip(this.localPlayer);

		// setup the camera
		GLOBALS.camera = new ChaseCam(30);
		GLOBALS.camera.setTarget(this.localPlayer.triangle);

		// setup the game bounds object
		this.bounds = new Bounds(5000, 5000);
	},

	// update the scene
	Update : function(deltaTime) {	
		// clamp all the ships to the game bounding area
		this.bounds.update(this.triShips);

		// update all the ships
		for (var ship in this.triShips) {
			if (this.triShips.hasOwnProperty(ship)) {
				this.triShips[ship].update(deltaTime);
			}
		}

		// update the camera
		GLOBALS.camera.update(deltaTime);

		// update UI Arrows
		EnemyArrows.ArrowManager.Update(deltaTime);

		// update all the projectiles in the scene
		ProjectileManager.update(deltaTime);

		// perform collision detection between projectiles and ships
		var collisions = this.PerformCollisionDetection();

		// perform collision response, if we got any collisions
		if (collisions != null && collisions.length > 0) {
			this.PerformCollisionResponse(collisions);
		}

		// update particle effects
		Particles.ParticleManager.Update(deltaTime);
	},

	// add a given ship to the scene
	AddTriangleShip : function(ship) {
		this.triShips[ship.name] = ship;
		// if this is a ship other than the local player,
		// add an enemy arrow pointer
		if (ship !== this.localPlayer) {
			var arrow = new EnemyArrows.EnemyArrow(ship);
			EnemyArrows.ArrowManager.AddArrow(arrow);
		}
	},

	// remove a given ship from the scene
	RemoveTriangleShip : function(ship) {
		if (this.triShips.hasOwnProperty(ship.name)) {
			console.log("removing tri ship from scene");
			// make the ship properly dead
			ship.permaDead = true;
			ship.reset();
			
			delete this.triShips[ship.name];
			// remove the on-screen arrow
			EnemyArrows.ArrowManager.RemoveArrow(ship.name);
		}
	},

	PerformCollisionDetection : function() {

		// we only have responsibility for checking if the local ship has been 
		// hit by a projectile.  So iterate over all projectiles and check for
		// collision with the local player.

		// list of all projectiles involved in collisions.
		var collidedProjectiles = [];

		// ignore collisions if the local ship isn't active
		if (this.localPlayer.active === false) {
			return;
		}

		for (var i=0; i<ProjectileManager.allProjectiles.length; i++) {
			// grab the next projectile
			var nextProjectile = ProjectileManager.allProjectiles[i];

			// ignore collisions with projectiles fired by the local player
			if (nextProjectile.originator === this.localPlayer.name) {
				continue;
			}

			// grab the transformed triangle geometry for the ship
			var tri = this.localPlayer.getTriangle();

			// perform line segment / triangle intersection test.
			// this checks if the line formed by the projectiles last position, and it's current position
			// intersect with the triangle of the ship.  This is done to prevent 'tunnelling' of the projectile,
			// whereby it could move from one side of the tri to the other between updates.
			if (UTILS.intersecting(nextProjectile.getLastPosition(), nextProjectile.getPosition(), tri.a, tri.b, tri.c)) {				
				// note the projectile/ship in collision lists
				collidedProjectiles.push(nextProjectile);
			}			
			// we will keep checking in case there are multiple projectiles colliding with the local ship.
		}

		// return any collisions
		return collidedProjectiles;
	},

	// function to perform collision response for collisions between projectiles and the local ship
	PerformCollisionResponse : function(collidedProjectiles) {
		// need to reset the ship and create an explosion at each particle position,
		// and inform the particles of a collision

		this.localPlayer.reset();

		for (var i=0; i<collidedProjectiles.length; i++) {
			// create an explosion
			var explosion = new Particles.Utils.ParticleExplosion(collidedProjectiles[i].getPosition(), 150);
			// inform particle of collision
			collidedProjectiles[i].onCollision();
		}
	}
};