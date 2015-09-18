var MQTTUtils = MQTTUtils || {};

MQTTUtils.Client = {
	clientID : null,
	clientObj : null,
	connected : false,
	messageHandler : null,

	ConnectToServer : function(clientID, server, port, callback, willTopic, willData) {
		this.clientID = clientID;
		this.client = new Paho.MQTT.Client(server, port, clientID);
		this.client.onConnectionLost = this.onConnectionLost;
		this.client.onMessageArrived = this.onMessage;

		var connectOpts = {onSuccess: function() { MQTTUtils.Client.connected = true; callback();}};

		if (typeof willTopic !== "undefined" && 
			willTopic !== null &&
			typeof willData !== "undefined" &&
			willData !== null) {
			var willMessage = new Paho.MQTT.Message(willData);
			willMessage.destinationName = willTopic;

			connectOpts.willMessage = willMessage;
		}

		this.client.connect(connectOpts);
	},

	SetMessageHandler : function(handlerFunc) {
		this.messageHandler = handlerFunc;
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
		if (MQTTUtils.Client.messageHandler != null) {
			MQTTUtils.Client.messageHandler(message);
		}
	},

	onConnectionLost : function(responseObject) {
		if (responseObject.errorCode !== 0) {
   			console.log("onConnectionLost:"+responseObject.errorMessage);
  		}
	}
};