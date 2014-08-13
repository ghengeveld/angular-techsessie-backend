var sys = require('sys');
var express = require('express');
var app = express();
var _ = require('underscore');

// Get port from Heroku environment
var port = process.env.PORT || 9002;

sys.log('Starting API...');

// Add CSRF support, allow all OPTION reqs from every origin.
allowCrossDomain = function(request, response, next) {
  response.header('Access-Control-Allow-Origin', '*');
  response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-requested-With');

  if ('OPTIONS' == request.method) {
    response.send(200);
  } else {
    next();
  }
};

app.configure(function() {
  app.use(allowCrossDomain);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/../app/'));
});

function sendJSON(response, data) {
  response.setHeader('Content-Type', 'application/json');
  response.send(200, JSON.stringify(data));
}

function findEntryById(id) {
  return _.find(entries, function(entry) {
    return entry.id === parseInt(id, 10);
  });
}

function buildEntry(data, removeId) {
  if (_.isObject(data)) {
    var entry = _.pick(data, entryKeys);
    if (entry.id && removeId) {
      delete entry.id;
    }
    return entry;
  }
}

// Load initial values
var customers = require('./customers.json');
var entryKeys = ['id', 'date', 'customer', 'hours', 'description'];
var entries = [{
  id: 1,
  date: '2013-10-15',
  customer: { id: 1, name: 'Finalist' },
  hours: 3,
  description: 'Techsessie AngularJS'
}];
var nextEntryId = 2;

app.get('/api/customers', function(request, response) {
  sendJSON(response, customers);
});

app.get('/api/entries', function(request, response) {
  sendJSON(response, entries);
});

app.post('/api/entries', function(request, response) {
  var newEntry = buildEntry(request.body);
  if (newEntry) {
    newEntry.id = nextEntryId++;
    entries.push(newEntry);
    response.send(200, newEntry);
  } else {
    response.send(400);
  }
});

app.get('/api/entries/:id', function(request, response) {
  var entry = findEntryById(request.param('id'));
  if (entry) {
    sendJSON(response, entry);
  } else {
    response.send(404);
  }
});

app.put('/api/entries/:id', function(request, response) {
  var originalEntry = findEntryById(request.param('id'));
  var newEntry = buildEntry(request.body, true);
  if (originalEntry && newEntry) {
    var entry = _.extend(originalEntry, newEntry);
    sendJSON(response, entry);
  } else {
    response.send(404);
  }
});

app.delete('/api/entries/:id', function(request, response) {
  var entry = findEntryById(request.param('id'));
  if (entry) {
    entries.splice(entries.indexOf(entry), 1);
    response.send(200);
  } else {
    response.send(404);
  }
});

// Start the application.
app.listen(port);
sys.log('API is now listening at port ' + port + '...');
