function Triangle(colour) {
	this.triGeom = new THREE.Geometry();
	this.triGeom.vertices.push(
		new THREE.Vector3(-25,-30,0),
		new THREE.Vector3(25,-30,0),
		new THREE.Vector3(0,30,0));

	this.triGeom.faces.push(new THREE.Face3(0,1,2));

	var triaMat = new THREE.MeshBasicMaterial( { color: colour } );

	this.mesh = new THREE.Mesh(this.triGeom, triaMat);
	this.matrixAutoUpdate = true; 
	
	GLOBALS.scene.add(this.mesh);
	this.isHidden = false;

	/****************** Functions ******************/
	this.setHidden = function(hidden) {
		if (hidden && !this.isHidden) {
			GLOBALS.scene.remove(this.mesh);			
		}

		if (!hidden && this.isHidden) {
			GLOBALS.scene.add(this.mesh);			
		}

		this.isHidden = hidden;
	};

	this.willBeRemoved = function() {
		GLOBALS.scene.remove(this.mesh);
	};
	
	this.setPosition = function(newPos)	{
		this.mesh.position.set(newPos.x, newPos.y, 0);
	};

	this.getPosition = function() {
		var current = this.mesh.position;
		return new THREE.Vector2(current.x, current.y);
	};

	this.setRotation = function(newRot) {
		this.mesh.rotation.z = THREE.Math.degToRad(newRot);
	};

	this.getRotation = function() {
		return THREE.Math.radToDeg( this.mesh.rotation.z );
	};

	this.getTriangle = function() {
		var tri = new THREE.Triangle();
		var matrix = this.mesh.matrix;
		thisA = this.triGeom.vertices[0];
		pa = new THREE.Vector3();
		pa.set(thisA.x,thisA.y,thisA.z);
		pa.applyMatrix4(matrix);

		thisB = this.triGeom.vertices[1];
		pb = new THREE.Vector3();
		pb.set(thisB.x,thisB.y,thisB.z);
		pb.applyMatrix4(matrix);

		thisC = this.triGeom.vertices[2];
		pc = new THREE.Vector3();
		pc.set(thisC.x,thisC.y,thisC.z);
		pc.applyMatrix4(matrix);

		tri.setFromPointsAndIndices([pa,pb,pc], 0, 1, 2);

		return tri;
	};
	/***********************************************/	
}