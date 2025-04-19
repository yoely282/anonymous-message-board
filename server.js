'use strict';
require('dotenv').config();

const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors');
const helmet      = require('helmet');
const mongoose    = require('mongoose');

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');

console.log('ENV is:', process.env.NODE_ENV);

// ✅ MongoDB Connection
mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

const app = express();

// ✅ Static Files
app.use('/public', express.static(process.cwd() + '/public'));

// ✅ CORS for FCC Testing
app.use(cors({ origin: '*' }));

// ✅ Helmet Security Headers (for tests 2, 3, and 4)
app.use(helmet.frameguard({ action: 'sameorigin' })); // Test #2
app.use(helmet.dnsPrefetchControl());                 // Test #3
app.use(helmet.referrerPolicy({ policy: 'same-origin' })); // Test #4

// ✅ Body Parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ HTML Routes
app.route('/b/:board/')
  .get((req, res) => res.sendFile(process.cwd() + '/views/board.html'));

app.route('/b/:board/:threadid')
  .get((req, res) => res.sendFile(process.cwd() + '/views/thread.html'));

app.route('/')
  .get((req, res) => res.sendFile(process.cwd() + '/views/index.html'));

// ✅ Testing and API Routes
fccTestingRoutes(app);
apiRoutes(app);

// ✅ 404 Middleware
app.use((req, res, next) => {
  res.status(404)
    .type('text')
    .send('Not Found');
});

// ✅ Start Server and Run Tests (when NODE_ENV=test)
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
  
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (e) {
        console.log('Tests are not valid:');
        console.error(e);
      }
    }, 1500);
  }
});

module.exports = app; // for testing
