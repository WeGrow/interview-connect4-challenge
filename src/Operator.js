"use strict"

const Promise = require('bluebird');
const request = require('request');

const SlackSocket = require('./SlackSocket');

Promise.promisifyAll(request);

class Operator {
    constructor(token) {
        this.token = token;

        this.socket = new SlackSocket.SlackSocket(token);
        this.socket.on(SlackSocket.Events.MESSAGE, this.onMessage.bind(this));
    }

    sendMessage(args) {
        var url = `https://api.slack.com/api/chat.postMessage`;
        var  params = Object.assign({
            token: this.token
        }, args);
        return request.postAsync({
            url: url,
            form: params
        })
        .then(function(response) {
            return JSON.parse(response.body);
        });
    }

    connect() {
        this.socket.connect();
    }

    routeEvent(event) {
        console.log('route event', {
            event: JSON.stringify(event)
        });
        if (event.type != 'message') {
            return;
        }
        this.sendMessage({
            text: event.text,
            channel: event.channel,
            as_user: false,
        });
    }

    // SlackSocket events.

    onMessage(message) {
        if (message.type != 'message') {
            return;
        }
        return this.routeEvent(message);
    }
}
module.exports = Operator;
