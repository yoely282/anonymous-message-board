'use strict';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const fccTestingRoutes = require('./routes/fcctesting.js');
const apiRoutes = require('./routes/api.js');
const runner = require('./test-runner');

const app = express();

// ✅ Connect to MongoDB
mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Middleware
app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({ origin: '*' }));

// ✅ Required Helmet Security Headers
app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(helmet.dnsPrefetchControl());
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ HTML Pages
app.route('/b/:board/').get((req, res) => res.sendFile(process.cwd() + '/views/board.html'));
app.route('/b/:board/:threadid').get((req, res) => res.sendFile(process.cwd() + '/views/thread.html'));
app.route('/').get((req, res) => res.sendFile(process.cwd() + '/views/index.html'));

// ✅ FCC Test Routes
fccTestingRoutes(app);

// ✅ API Routes
apiRoutes(app);

// ✅ 404 Not Found
app.use((req, res) => res.status(404).type('text').send('Not Found'));

// ✅ Start Server & Tests
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

module.exports = app;
