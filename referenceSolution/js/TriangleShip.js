// colour : colour of the onscreen triangle that represents the ship
// positionDelegate : an object which provides us with a position/rotation for the ship
function TriangleShip(colour, transformDelegate) {
	this.transformDelegate = transformDelegate;	
	this.triangle = new Triangle(colour);
	this.collider = new Collision.CollisionMesh(Collision.MeshType.TRIANGLE, this);
	Collision.CollisionManager.AddCollider(this.collider);

	this.active = true;
	this.permaDead = false;

	this.update = function(deltaTime) {
		// do we have an object which will give us an updated position?
		if (this.transformDelegate === null || this.active === false) {
			return;
		}

		// ask the delegate to update itself
		this.transformDelegate.update(deltaTime);
		// update our onscreen triangle pos/rot from the delegate
		this.triangle.setPosition(this.transformDelegate.getPosition());
		this.triangle.setRotation(this.transformDelegate.getRotation());
		// do we need to fire a projectile?
		var fireObj = this.transformDelegate.shouldFireWeapon();

		if (fireObj.fire) {
			ProjectileManager.addProjectile(fireObj.pos, fireObj.vel, this);
			// send event to network
			var dataObj = {
				pos: fireObj.pos,
				vel : fireObj.vel
			};
			Networking.SendProjectileCreateEvent(dataObj);
		}
	}

	this.getTriangle = function() {
		return this.triangle.getTriangle();
	}

	this.reset = function() {
		this.triangle.setHidden(true);
		this.active = false;
		if (this.transformDelegate !== null) {
			this.transformDelegate.reset();
		}

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