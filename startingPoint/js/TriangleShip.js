// name : a name used to reference this ship
// colour : colour of the onscreen triangle that represents the ship
function TriangleShip(name, colour) {
	// constant force that can be applied
	this.UPFORCE = new THREE.Vector2(0,25000);

	this.name = name;
	// triangle to provide the onscreen representation of the ship
	this.triangle = new Triangle(colour);
	// flag to indicate if the ship is currently active or in cool-down
	// after being reset
	this.active = true;
	// flag to indicate that the ship is inactive, and shouldn't be
	// activated ever again
	this.permaDead = false;

	// used for simple physics based position updates
	this.velocity = new THREE.Vector3(0,0,0);
	this.mass = 100;

	// track the last time we fired a projectile
	this.lastFired = 10;
	// counter used to create projectile ids.
	this.projectileCounter = 0;

	// state of controls
	this.keyState = {
		left  : false,
		right : false,
		up    : false,
		space : false
	};

	this.updateKeyState = function() {
		// update key state based on local input
		this.keyState.left = GLOBALS.keyboard.pressed("left");
		this.keyState.right = GLOBALS.keyboard.pressed("right");
		this.keyState.up = GLOBALS.keyboard.pressed("up");
		this.keyState.space = GLOBALS.keyboard.pressed("space");
	}

	this.update = function(deltaTime) {
		// do we have an object which will give us an updated position?
		if (this.active === false) {
			return;
		}

		// grab updated keyboard state
		this.updateKeyState();

		// grab the current rotation of the tri
		var currentRotation = this.triangle.getRotation();

		// update rotation
		if (this.keyState.left) {
			currentRotation += (90*deltaTime);
			// ensure rotation is between 0-360
			if (currentRotation > 360) {
				currentRotation -= 360;
			}
		}

		if (this.keyState.right) {
			currentRotation -= (90*deltaTime);
			// ensure rotation is between 0-360
			if (currentRotation < 0) {
				currentRotation += 360;
			}
		}

		// apply the updated rotation back to the tri
		this.triangle.setRotation(currentRotation);

		// calculate current force to apply this update
		var thisForce = new THREE.Vector2(0,0);

		// are we applying thrust?
		if (this.keyState.up) {
			thisForce.add(this.UPFORCE);
		}

		// rotate the force to align with our current heading
		var forwardForce = new THREE.Vector3(thisForce.x,thisForce.y,0);
		var quat = new THREE.Quaternion();
		quat.setFromEuler(new THREE.Euler(0,0,THREE.Math.degToRad(currentRotation), "XYZ"));
		forwardForce.applyQuaternion(quat); 

		// update the velocity with the calculated force
		var acceleration = forwardForce.divideScalar(this.mass);
		// calc new velocity
		this.velocity.add( (acceleration.multiplyScalar(deltaTime)) );
		// clamp velocity
		this.velocity.clamp(new THREE.Vector3(-400,-400,-400), new THREE.Vector3(400,400,400));

		// grab the current position from the tri
		var currentPosition = this.triangle.getPosition();

		// update the position from the velocity
		currentPosition.x += (this.velocity.x*deltaTime);
		currentPosition.y += (this.velocity.y*deltaTime);

		// apply the updated positon back to the tri
		this.triangle.setPosition(currentPosition);

		// update the time since last fired
		this.lastFired += deltaTime;

		// is the user pressing the fire key?
		if (this.keyState.space) {
			// has there been enough time since we last fired?
			if (this.lastFired >= 0.2) {
				// fire a projectile
				// calculate a velocity for the projectile in the current heading
				var projVel = new THREE.Vector3(0,600,0);		
				projVel.applyQuaternion(quat);

				// create a unique identifier for the projectile
				var projectileID = "proj_"+this.name+"_"+this.projectileCounter;
				this.projectileCounter++;
				
				ProjectileManager.addProjectile(currentPosition, projVel, this.name, projectileID);

				// reset timer so we can't fire again right away
				this.lastFired = 0;
			}
		}		
	}

	this.getTriangle = function() {
		return this.triangle.getTriangle();
	}

	this.reset = function() {
		console.log(this.name + ": reset");
		this.triangle.setHidden(true);
		this.triangle.setPosition(new THREE.Vector2(0,0));
		this.triangle.setRotation(0);
		this.velocity.set(0,0,0);
		this.active = false;

		var theShip = this;

		setTimeout(function() {
			if (theShip.permaDead) {
				return;
			}

			theShip.triangle.setHidden(false);
			theShip.active = true;
		}, 4000);
	}
}