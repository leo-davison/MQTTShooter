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
	var msg = new Paho.MQTT.Message(msgData);
	msg.destinationName = topic;
	return msg;
}

MQTTUtils.Client = {
	clientID : null,
	clientObj : null,
	connected : false,

	ConnectToServer : function(clientID, server, port, willMessage, callback) {
		this.clientID = clientID;
		this.client = new Paho.MQTT.Client(server, port, clientID);
		this.client.onConnectionLost = this.onConnectionLost;
		this.client.onMessageArrived = this.onMessage;

		var connectOpts = {onSuccess: function() { MQTTUtils.Client.connected = true; callback();}};

		if (willMessage !== null) {
			connectOpts.willMessage = willMessage;
		}

		this.client.connect(connectOpts);
	},

	SubscribeToTopic : function(topic) {
		this.client.subscribe(topic, {qos:0});
	},

	UnsubscribeFromTopic : function(topic) {
		this.client.unsubscribe(topic);		
	},

	PublishMessage : function(topic, messageData, retained) {
		if (this.connected === false) {
			return;
		}		
		var msg = new Paho.MQTT.Message(messageData);
		msg.qos = 0;
		msg.destinationName = topic;

		if (retained !== undefined) {
			msg.retained = retained;
		}

		this.client.send(msg);
	},

	onMessage : function(message) {
		MQTTUtils.MessageHandlers.handleMessage(message);
	},

	onConnectionLost : function(responseObject) {
		if (responseObject.errorCode !== 0) {
   			console.log("onConnectionLost:"+responseObject.errorMessage);
  		}
	}
};