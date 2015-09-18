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

		var shipArray = [this.localPlayer.triangle];

		// update the bounding area
		this.bounds.update(shipArray);

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
		this.PerformCollisionDetection();
		

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
			delete this.triShips[ship.name];
		}
	},

	PerformCollisionDetection : function() {
		// list of projectiles that have collided with ships
		var collidedProjectiles = {};
		// list of ships in collision
		var collidedShips = {};

		for (var i=0; i<ProjectileManager.allProjectiles.length; i++) {
			var nextProjectile = ProjectileManager.allProjectiles[i];

			// check against all ships
			var j = 0;
			for (var shipName in this.triShips) {
				if (this.triShips.hasOwnProperty(shipName)) {
 
					// ignore collisions with the originator of this projectile.					
					if (shipName === nextProjectile.originator) {
						//console.log("ignoring potential collision with originator");
						continue;
					}

					var nextShip = this.triShips[shipName];

					// also ignore collisions against inactive ships
					if (nextShip.active === false) {
						//console.log("ignoring potential collision with inactive ship.");
						continue;
					}

					// grab the transformed triangle geometry
					var tri = nextShip.getTriangle();

					// perform line segment / triangle intersection test.
					// this checks if the line formed by the projectiles last position, and it's current position
					// intersect with the triangle of the ship.  This is done to prevent 'tunnelling' of the projectile,
					// whereby it could move from one side of the tri to the other between updates.
					if (UTILS.intersecting(nextProjectile.getLastPosition(), nextProjectile.getPosition(), tri.a, tri.b, tri.c)) {
						// we have a collision...

						// create a particle effect
						var explosion = new Particles.Utils.ParticleExplosion(nextProjectile.getPosition(), 150);

						// note the projectile/ship in collision lists
						collidedProjectiles[i] = nextProjectile;
						collidedShips[j] = nextShip;

						// we will keep checking in case there are multiple colocated ships.
					}

					j++;
				}
			}			
		}

		// for each projectile involved in a collision, it needs to be marked as dead
		for (var projIndex in collidedProjectiles) {
			if (collidedProjectiles.hasOwnProperty(projIndex)) {
				collidedProjectiles[projIndex].onCollision();
			}
		}

		// each ship involved in a collision needs to be reset
		for (var shipIndex in collidedShips) {
			if (collidedShips.hasOwnProperty(shipIndex)) {
				collidedShips[shipIndex].reset();
			}
		}
	}
};