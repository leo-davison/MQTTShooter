var MQTTUtils = MQTTUtils || {};

MQTTUtils.Client = {
	clientID : null,
	clientObj : null,
	connected : false,
	messageHandler : null,

	ConnectToServer : function(clientID, server, port, callback, willTopic, willData) {
		console.log("TODO: connect to server.");
	},

	SetMessageHandler : function(handlerFunc) {	
		console.log("TODO: connect to server.");	
	},

	SubscribeToTopic : function(topic) {
		console.log("TODO: subscribe to a topic.");
	},

	UnsubscribeFromTopic : function(topic) {
		console.log("TODO: unsubscribe from a topic.");
	},

	PublishMessage : function(topic, messageData) {
		console.log("TODO: publish a message to the server.");
	},

	onMessage : function(message) {
		console.log("TODO: handle message delivery.");
	},

	onConnectionLost : function(responseObject) {
		console.log("TODO: handle lost connection.");
	}
};