const { Router } = require('express');
const uuidv4 = require('uuid').v4;
const ecc = require('eosjs-ecc');
const sha256 = x => ecc.sha256(x);

const routes = Router();
const wallets = require('./wallets');

// const proofKey = config('PROOF_KEY');
const returnResult = (data, req, res) => {
	// let {proof} = req.headers;
	// if(proof && proof.length === 64){
	// 	proof = ecc.sign(proof, proofKey);
	// 	res.append('proof', proof);
	// }
	res.json(data);
};


routes.get('/app/connect/:device', async (req, res) => {
	const {device} = req.params;
	console.log('connected', sha256(req.ipData+device), req.ipData, device);
	const uuid = wallets[sha256(req.ipData+device)];
	if(!uuid) return returnResult(false, req, res);
	returnResult(uuid, req, res);
});

const createSocket = require('./sockets');
const socket = createSocket();



routes.all('*', (req, res) => res.sendStatus(403));
module.exports = routes;
