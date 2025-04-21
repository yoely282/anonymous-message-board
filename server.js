'use strict';
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet'); // ✅ required for FCC tests 2-4
const mongoose = require('mongoose');

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const app = express();

// ✅ Connect to MongoDB
mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ Mongo error:', err));

// ✅ Static files
app.use('/public', express.static(process.cwd() + '/public'));

// ✅ Security headers (FCC tests 2-4)
app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(helmet.dnsPrefetchControl());
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

// ✅ CORS (only for FCC testing)
app.use(cors({ origin: '*' }));

// ✅ Body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Front-end HTML routes
app.route('/b/:board/')
  .get((req, res) => res.sendFile(process.cwd() + '/views/board.html'));
app.route('/b/:board/:threadid')
  .get((req, res) => res.sendFile(process.cwd() + '/views/thread.html'));
app.route('/')
  .get((req, res) => res.sendFile(process.cwd() + '/views/index.html'));

// ✅ FCC testing routes
fccTestingRoutes(app);

// ✅ API routes
apiRoutes(app);

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

// ✅ Start server and tests
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch (e) {
        console.log('Tests are not valid:');
        console.error(e);
      }
    }, 1500);
  }
});

module.exports = app; //for testing
