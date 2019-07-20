const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const routes = require('./routes');
const cors = require('cors');
const compression = require('compression');

const app = express();
app.disable('x-powered-by');

app.use ((req, res, next) => {
	req.ipData = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

	next();
});

app.use(compression())
app.use(cors({
	exposedHeaders: ['proof'],
}));
app.use(logger('dev', { skip: () => app.get('env') === 'test' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
app.use('', routes);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// Error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
	res
		.status(err.status || 500)
		.render('error', {
			message: err.message
		});
});

module.exports = app;
