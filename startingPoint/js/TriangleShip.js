// name : a name used to reference this ship
// colour : colour of the onscreen triangle that represents the ship
function TriangleShip(name, colour) {
	// constant force that can be applied
	this.UPFORCE = new THREE.Vector2(0,1000);

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

	this.update = function(deltaTime) {
		// do we have an object which will give us an updated position?
		if (this.active === false) {
			return;
		}

		// grab the current rotation of the tri
		var currentRotation = this.triangle.getRotation();

		// update rotation
		if (GLOBALS.keyboard.pressed("left")) {
			currentRotation += (90*deltaTime);
			// ensure rotation is between 0-360
			if (currentRotation > 360) {
				currentRotation -= 360;
			}
		}

		if (GLOBALS.keyboard.pressed("right")) {
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
		if (GLOBALS.keyboard.pressed("up")) {
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
		this.velocity.clamp(new THREE.Vector3(-4,-4,-4), new THREE.Vector3(4,4,4));

		// grab the current position from the tri
		var currentPosition = this.triangle.getPosition();

		// update the position from the velocity
		currentPosition.x += this.velocity.x;
		currentPosition.y += this.velocity.y;

		// apply the updated positon back to the tri
		this.triangle.setPosition(currentPosition);

		// update the time since last fired
		this.lastFired += deltaTime;

		// is the user pressing the fire key?
		if (GLOBALS.keyboard.pressed("space")) {
			// has there been enough time since we last fired?
			if (this.lastFired >= 0.2) {
				// fire a projectile
				// calculate a velocity for the projectile in the current heading
				var projVel = new THREE.Vector3(0,600,0);		
				projVel.applyQuaternion(quat);
				
				ProjectileManager.addProjectile(currentPosition, projVel, this.name);

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