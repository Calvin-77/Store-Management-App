var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var accountsRouter = require('./routes/accounts');
var productsRouter = require('./routes/products');
var reportsRouter = require('./routes/reports');
var conversionRouter = require('./routes/conversions');

var app = express();

app.use(cors())

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/test', (req, res) => {
  res.send('Welcome to my API!');
});

app.use('/accounts', accountsRouter);
app.use('/products', productsRouter);
app.use('/reports', reportsRouter);
app.use('/conversions', conversionRouter);

module.exports = app;