var Particles = Particles || {};

Particles.ParticleManager = {
	systems: [],
	particlePool: [],

	Update : function(delta) {
		toRemove = [];

		for (var i=0; i<this.systems.length; i++) {
			var system = this.systems[i];
			system.update(delta);		
			// is this system done?
			if (system.done) {
				toRemove.push(i);
			}
		}

		// remove any finished systems
		for (var i=toRemove.length-1; i>=0; i--) {
			this.systems.splice(toRemove[i],1);
		}
	},

	AddSystem: function(system) {
		this.systems.push(system);
	},

	GetParticle: function(position, velocity, life) {
	var particle = null;

		if (this.particlePool.length > 0) {
			particle = this.particlePool.pop();
			particle.reset(position, velocity, life);
		}
		else {
			particle = new Particles.Particle(position, velocity, life);
		}

		return particle;
	},

	ReturnParticle: function(particle) {
		this.particlePool.push(particle);
	}
};

Particles.Particle = function(position, velocity, life) {
	var partGeom = new THREE.Geometry();
	partGeom.vertices.push(
		new THREE.Vector3(-2,-2,0),
		new THREE.Vector3(2,-2,0),
		new THREE.Vector3(2,2,0),
		new THREE.Vector3(-2,2,0));

	partGeom.faces.push(
		new THREE.Face3(0,1,2),
		new THREE.Face3(2,3,0));
	
	var partMat = new THREE.MeshBasicMaterial({
		color:new THREE.Color(THREE.Math.randFloat(0.6,1),THREE.Math.randFloat(0.2,0.45),THREE.Math.randFloat(0,0.2))
	});
	var partMesh = new THREE.Mesh(partGeom, partMat);

	this.mesh = partMesh;
	this.matrixAutoUpdate = true;
	GLOBALS.scene.add(this.mesh);

	this.mesh.position.set(position.x,position.y,-1);
	this.velocity = velocity;
	this.alive = true;
	this.life = life;

	this.reset = function(position, velocity, life) {
		GLOBALS.scene.add(this.mesh);
		this.mesh.position.set(position.x,position.y,-1);
		this.velocity = velocity;
		this.alive = true;
		this.life = life;
	}

	this.update = function(delta) {
		this.mesh.position.x += (this.velocity.x * delta);
		this.mesh.position.y += (this.velocity.y * delta);
		this.life -= delta;

		if (this.life <= 0) {
			this.alive = false;
			GLOBALS.scene.remove(this.mesh);
			Particles.ParticleManager.ReturnParticle(this);
		}
	}
};

Particles.Utils = {};

Particles.Utils.ParticleExplosion = function(position, numParticles) {
	this.particles = [];
	this.done = false;

	// internal function to create a new particle with semi-random life/velocity
	var createParticle = function(position) {
		vel = new THREE.Vector3(0,1,0);
		// random (in range) speed/direction
		vel.multiplyScalar(THREE.Math.randFloat(50,200));
		vel.applyAxisAngle(new THREE.Vector3(0,0,1), THREE.Math.degToRad(THREE.Math.randFloat(0,360)));

		return Particles.ParticleManager.GetParticle(position, vel, THREE.Math.randFloat(0,1)); //new Particles.Particle(position, vel, THREE.Math.randFloat(0,1));
	};

	for (i=0; i<numParticles; i++) {
		this.particles.push(createParticle(position));
	}

	// add to manager for update/tracking
	Particles.ParticleManager.AddSystem(this);	

	this.update = function(delta) {		
		var anyAlive = false;

		for (var i=0; i<this.particles.length; i++) {
			this.particles[i].update(delta);			
			if (this.particles[i].alive) {
				anyAlive = true;
			}
		}

		if (!anyAlive) {
			this.done = true;
		}
	}	
}