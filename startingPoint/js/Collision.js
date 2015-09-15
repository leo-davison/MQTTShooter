var Collision = Collision || {};

Collision.MeshType = {
	POINT : "POINT",
	TRIANGLE : "TRIANGLE"
};

// parent object must support the following functions:
// for Point colliders:
// getLastPosition() // previous position as THREE.Vector2
// getPosition() // current position as THREE.Vector2
//
// for Triangle colliders:
// getTriangle() // THREE.Triangle object defined by current pos/rot
//
// for both, to be notified about collisions:
// onCollision(other) // other is the other collider
Collision.CollisionMesh = function(type, parent) {
	this.type = type;
	this.parent = parent;	
};

Collision.CollisionManager = {
	pointColliders : [],
	triColliders : []
};

Collision.CollisionManager.AddCollider = function(collider) {
	switch (collider.type) {
		case Collision.MeshType.POINT:
			this.pointColliders.push(collider);
			break;

		case Collision.MeshType.TRIANGLE:
			this.triColliders.push(collider);
			break;
	}
};

Collision.CollisionManager.RemoveCollider = function(collider) {
	var removeObjFromList = function(list, obj) {
		var index = -1;
		for (var i=0; i<list.length; i++) {
			if (list[i] === obj) {
				index = i;				
				break;
			}
		}

		if (index !== -1) {
			list.splice(index,1);			
		}		
	}

	switch (collider.type) {
		case Collision.MeshType.POINT:
			removeObjFromList(this.pointColliders, collider);
			break;

		case Collision.MeshType.TRIANGLE:
			removeObjFromList(this.triColliders, collider);
			break;
	}
};

Collision.CollisionManager.Update = function(delta) {
	// only support point vs tri collision detection
	for (var i=0; i<this.pointColliders.length; i++) {
		// note current and previous positions
		var pos = this.pointColliders[i].parent.getPosition();
		var oldPos = this.pointColliders[i].parent.getLastPosition();

		// collide against all tri colliders
		for (var j=0; j<this.triColliders.length; j++) {
			var tri = this.triColliders[j].parent.getTriangle();

			// is there a collision?
			if (UTILS.intersecting(oldPos, pos, tri.a, tri.b, tri.c)) {
				// yes.  report this to the collider parent obj's, if they
				// care...
				var pCollider = this.pointColliders[i];				
				if ("onCollision" in this.pointColliders[i].parent) {
					this.pointColliders[i].parent.onCollision(this.triColliders[j]);
				}

				if ("onCollision" in this.triColliders[j].parent) {
					this.triColliders[j].parent.onCollision(pCollider);
				}				
			}
		}
	}
}