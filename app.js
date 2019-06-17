// main dependencies
var express = require('express'),
    path = require('path'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    http = require('http'),
    https = require('https'),
    swig = require('swig');
    
const cors = require('cors');
// routes
var routes = require('./routes/index');

var privateKey = fs.readFileSync('private.key').toString();
var certificate = fs.readFileSync('certificate.crt').toString();

// init express
var app = express();

// view engine
swig = new swig.Swig();
app.engine('html', swig.renderFile);
app.set('view engine', 'html');

// middleware
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.use('/', routes);

const corsOptions = {
    origin: 'https://puretag.net:8443',
    credentials: true
};
//app.use(cors(corsOptions));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

server = https.createServer({key: privateKey,cert: certificate}, app);

module.exports = server;
