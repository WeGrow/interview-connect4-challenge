"use strict"

var EventEmitter = require('events');
var Promise = require('bluebird');
var request = require('request');
var ws = require('ws');

Promise.promisifyAll(request);

var Events = {
    RTM_START: 'RTM_START',
    MESSAGE:   'MESSAGE',
    CLOSE:     'CLOSE',
    OPEN:      'OPEN'
};

function log(message, info) {
    console.log(message, info);
}

class SlackSocket extends EventEmitter {
    constructor(token) {
        super();
        this.token = token;
        this._messageID = 0;
    }

    connect() {
        var self = this;
        log('connect');
        // call rtm.start and connect to the websocket.
        return request.postAsync({
            url: 'https://api.slack.com/api/rtm.start',
            form: {
                token: this.token
            }
        })
        .then(function(response) {
            var json = JSON.parse(response.body);
            console.log("JSON:", json);
            if (!json.ok) {
                log('rtm.start error', {
                    response: response.body
                })
            } else  {
                self.botSelf = json.self;
                log('rtm.start successful');
                self.ws = new ws(json.url);
                self.emit(Events.RTM_START, json);
            }
        })
        .catch(function(error) {
            log('connect error', {
                error: error
            });
        });
    }

    get isConnected() {
        return this._ws && this._ws.readyState == this._ws.OPEN;
    }

    set ws(ws) {
        if (this._ws) {
            this._ws.removeAllListeners();
        }
        this._ws = ws;
        this._ws.on('open', this.onOpen.bind(this));
        this._ws.on('close', this.onClose.bind(this));
        this._ws.on('error', this.onError.bind(this));
        this._ws.on('message', this.onMessage.bind(this));
    }

    sendMessage(message) {
        message.type = message.type || 'message';
        message.id = this._messageID++;
        message.user = this.botSelf.id;
        var data = Object.assign({
            id: this._messageID++,
            type: 'message',
            user: this.botSelf.id
        }, message);
        this._ws.send(JSON.stringify(data));
    }

    // ws events

    onError(error) {
        log('ws error', {
            error: error
        });
        this.emit(Events.ERROR, error);
    }

    onClose(code, flags) {
        log('ws close');
        this.emit(Events.CLOSE);
        this.connect();
    }

    onMessage(data, flags) {
        log('ws message');
        // Filter out bot messages.
        let json = JSON.parse(data);
        if (json.bot_id) {
            return;
        }
        this.emit(Events.MESSAGE, JSON.parse(data));
    }

    onOpen(data, flags) {
        log('ws open');
        this.emit(Events.CLOSE);
    }
}
module.exports.SlackSocket = SlackSocket;

module.exports.Events = Events;
