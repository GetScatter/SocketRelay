const { Router } = require('express');
const uuidv4 = require('uuid').v4;
const ecc = require('eosjs-ecc');

const routes = Router();
const wallets = require('./wallets');
wallets['::1'] = "38ca7d6b-e112-47a8-b130-478f401ffbaa"

// const proofKey = config('PROOF_KEY');
const returnResult = (data, req, res) => {
	// let {proof} = req.headers;
	// if(proof && proof.length === 64){
	// 	proof = ecc.sign(proof, proofKey);
	// 	res.append('proof', proof);
	// }
	res.json(data);
};




/************************************************/
/*                                              */
/*                    WALLETS                   */
/*                                              */
/************************************************/

routes.get('/wallet/connect', async (req, res) => {
	wallets[req.ip] = uuidv4();
	returnResult(wallets[req.ip], req, res);
});

routes.get('/wallet/disconnect', async (req, res) => {
	delete wallets[req.ip];
	returnResult(true, req, res);
});





/************************************************/
/*                                              */
/*                     APPS                     */
/*                                              */
/************************************************/

routes.get('/app/connect', async (req, res) => {
	const uuid = wallets[req.ip];
	if(!uuid) return returnResult(false, req, res);
	returnResult(uuid, req, res);
});

routes.get('/app/socket/', async (req, res) => {
	const uuid = wallets[req.ip];
	returnResult(wallets[req.ip], req, res);
});




/************************************************/
/*                                              */
/*                  SOCKETS                     */
/*                                              */
/************************************************/

const createSocket = require('./sockets');
const socket = createSocket();



routes.all('*', (req, res) => res.sendStatus(403));
module.exports = routes;
