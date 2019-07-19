const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const wallets = require('./wallets');
require('isomorphic-fetch');
const ecc = require('eosjs-ecc');
const sha256 = x => ecc.sha256(x);

const walletConnections = {};
const appConnections = {};
const queuedMessages = {};

const emit = async (socket, path, data) => {
	if(!socket) return console.error('No socket found');
	socket.send('42/scatter,' + JSON.stringify([path, data ? data : false]))
}

const socketHandler = socket => {
	const ip = socket._socket.address().address;
	let device;

	let origin = null, isWallet = false;
	const socketId = Math.round(Math.random() * 999999999).toString();

	socket.send("40");
	socket.send("40/scatter");
	socket.send(`42/scatter,["connected"]`);

	// Just logging errors for debugging purposes (dev only)
	socket.on('error', async request => console.log('error', request));

	// Different clients send different message types for disconnect (ws vs socket.io)
	const closeConnection = () => isWallet  ? delete walletConnections[sha256(ip+device)] : delete appConnections[origin+socketId];
	socket.on('close',      closeConnection);
	socket.on('disconnect', closeConnection);

	socket.on('message', msg => {
		if(msg.indexOf('42/scatter') === -1) return false;
		let [type, request] = JSON.parse(msg.replace('42/scatter,', ''));
		device = request.device;

		/************************************************/
		/*                  WALLETS                     */
		/************************************************/

		if(type === 'wallet'){
			isWallet = true;
			walletConnections[sha256(ip+device)] = socket;
			return emit(socket, 'linked', {id:request.id, result:true});
		}

		if(type === 'wallet_response'){
			if(!queuedMessages[request.id]) return;
			return queuedMessages[request.id](request);
		}







		/************************************************/
		/*                     APPS                     */
		/************************************************/

		const killRequest = () => emit(socket, 'api', {id:request.id, result:null});

		if(!request.plugin || request.plugin.length > 100) return killRequest();
		request.plugin = request.plugin.replace(/\s/g, "");

		if(request.plugin.trim().toLowerCase() === 'Scatter') return killRequest();
		if(request.data.hasOwnProperty('payload') && request.data.payload.origin.trim().toLowerCase() === 'Scatter') return killRequest();

		let requestOrigin;
		if(request.data.hasOwnProperty('payload')) requestOrigin = request.data.payload.origin;
		else requestOrigin = request.data.origin;

		if(!origin) origin = requestOrigin;
		else if(origin && requestOrigin !== origin) return emit(socket, 'api', {id:request.id, result:null});
		if(!appConnections.hasOwnProperty(origin+socketId)) appConnections[origin+socketId] = socket;

		new Promise((resolve, reject) => {
			queuedMessages[request.id] = resolve;
			return emit(walletConnections[sha256(ip+device)], type, request);
		}).then(result => {
			emit(socket, result.type, result.data || false)
		});


	});
};



const getCerts = async () => {
	return fetch('https://certs.get-scatter.com?rand='+Math.round(Math.random()*100 + 1))
		.then(res => res.json())
		.then(res => {
			if(res.hasOwnProperty('key') && res.hasOwnProperty('cert')) return res;
			PopupService.push(Popup.prompt("Couldn't fetch certificates", 'There was an issue trying to fetch the certificates which allow Scatter to run on SSL. This is usually caused by proxies, firewalls, and anti-viruses.'))
			return null;
		})
		.catch(() => console.error('Could not fetch certs. Probably due to a proxy, vpn, or firewall.'));
};

const createSocket = async () => {
	// const certs = await getCerts();
	// const server = https.createServer(certs);
	const server = http.createServer();
	const websocket = new WebSocket.Server({ server });
	websocket.on('connection', socketHandler)
	server.listen(50005);
	// server.listen(50006);

	return websocket
}

module.exports = createSocket