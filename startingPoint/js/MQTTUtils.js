var MQTTUtils = MQTTUtils || {};

MQTTUtils.MessageHandlers = {
	handlers : [],

	AddHandler : function(callback) {
		this.handlers.push(callback);
	},

	RemoveHandler : function(callback) {
		var index = -1;
		for (var i=0; i<this.handlers.length; i++) {
			if (this.handlers[i] == callback) {
				index = i;
				break;
			}
		}

		if (index != -1) {
			this.handlers.splice(index,1);
		}
	},

	handleMessage : function(message) {
		for (var i=0; i<this.handlers.length; i++) {
			this.handlers[i](message);
		}
	}
};

MQTTUtils.CreateWillMessage = function(topic, msgData) {

}

MQTTUtils.Client = {
	clientID : null,
	clientObj : null,
	connected : false,

	ConnectToServer : function(clientID, server, port, willMessage, callback) {
	},

	SubscribeToTopic : function(topic) {
		
	},

	UnsubscribeFromTopic : function(topic) {
		
	},

	PublishMessage : function(topic, messageData) {
	
	},

	onMessage : function(message) {
	
	},

	onConnectionLost : function(responseObject) {
	
	}
};