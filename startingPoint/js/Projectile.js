/**************************** Collection of all Projectiles ******************************/
var ProjectileManager = {
	allProjectiles : [],


	addProjectile : function(startPos, velocity, originator, id) {
		this.allProjectiles.push(new Projectile(startPos, velocity, originator, id));
	},

	getProjectileWithID : function(projectileID) {
		for (var i=0; i<this.allProjectiles.length; i++) {
			if (this.allProjectiles[i].id === projectileID) {
				return this.allProjectiles[i];
			}
		}

		return null;
	},

	update : function(delta) {
		// to track indices of inactive projectiles
		var deadProjectiles = [];

		for (var i=0; i<this.allProjectiles.length; i++) {
			// update the projectile
			this.allProjectiles[i].update(delta);
			// is it still active?
			if (this.allProjectiles[i].alive === false) {
				// no, it's done... add the current index to our list of
				// dead projectiles
				deadProjectiles.push(i);
			}
		}

		// remove inactive projectiles.  Need to iterate in reverse because splicing will
		// change subsequent indices
		for (var i=deadProjectiles.length-1; i>=0; i--) {
			this.allProjectiles.splice(deadProjectiles[i],1);
		}		
	}
}
/*****************************************************************************************/

/**************************** Definition of Projectile Object ****************************/
function Projectile(startPos, velocity, originator, id) {
	var projGeom = new THREE.Geometry();
	projGeom.vertices.push(
		new THREE.Vector3(-2,-2,0),
		new THREE.Vector3(2,-2,0),
		new THREE.Vector3(2,2,0),
		new THREE.Vector3(-2,2,0));

	projGeom.faces.push(
		new THREE.Face3(0,1,2),
		new THREE.Face3(2,3,0));

	var projMat = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
	var projMesh = new THREE.Mesh(projGeom, projMat);

	this.mesh = projMesh;
	this.matrixAutoUpdate = true;

	// string id for the projectile
	this.id = id;

	this.mesh.position.set(startPos.x,startPos.y,-1);
	this.velocity = velocity;
	// flag to indicat that this projectile is still active
	this.alive = true;
	// time in seconds that the projectile will remain active for
	this.life = 1;
	// store last position for collision detection
	this.lastPosition = new THREE.Vector2(this.mesh.position.x, this.mesh.position.y);
	// note who fired this projectile (to avoid friendly fire...)
	this.originator = originator;
	
	// add the visual representation to the scene
	GLOBALS.scene.add(this.mesh);	

	this.update = function(delta) {
		this.lastPosition.set(this.mesh.position.x, this.mesh.position.y);

		this.mesh.position.x += (this.velocity.x*delta);
		this.mesh.position.y+= (this.velocity.y*delta);

		var newPos = new THREE.Vector2(this.mesh.position.x, this.mesh.position.y);

		this.life -= delta;

		var done = false;

		if (this.life <= 0) {
			// destroy
			done = true;
		}

		if (done) {
			this.alive = false;
			GLOBALS.scene.remove(this.mesh);
		}
	};

	this.getPosition = function() {
		return this.mesh.position;
	};

	this.getLastPosition = function() {
		return this.lastPosition;
	};

	this.onCollision = function() {
		// remove the projectile
		this.alive = false;
		GLOBALS.scene.remove(this.mesh);
	}
};
/*****************************************************************************************/