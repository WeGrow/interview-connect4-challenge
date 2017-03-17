'use strict'

const Operator = require('./src/Operator');

let operator = new Operator(process.env.BOT_TOKEN);
operator.connect();
