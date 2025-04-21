const { suite, test } = require('mocha');
const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let testThreadId;
let testThreadIdForReply;
let testReplyId;

suite('Functional Tests', function () {
  suite('API ROUTING FOR /api/threads/:board', function () {
    test('POST a new thread', function (done) {
      chai
        .request(server)
        .post('/api/threads/testboard')
        .send({
          text: 'Test thread',
          delete_password: 'testpass'
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          done();
        });
    });

    test('GET threads: 10 most recent with 3 replies each', function (done) {
      chai
        .request(server)
        .get('/api/threads/testboard')
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], 'text');
          assert.property(res.body[0], 'replies');
          testThreadId = res.body[0]._id;
          done();
        });
    });

    test('DELETE thread with incorrect password', function (done) {
      chai
        .request(server)
        .delete('/api/threads/testboard')
        .send({
          thread_id: testThreadId,
          delete_password: 'wrongpass'
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('DELETE thread with correct password', function (done) {
      chai
        .request(server)
        .delete('/api/threads/testboard')
        .send({
          thread_id: testThreadId,
          delete_password: 'testpass'
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

    test('PUT report thread', function (done) {
      chai
        .request(server)
        .post('/api/threads/testboard')
        .send({
          text: 'Thread to report',
          delete_password: 'reportpass'
        })
        .end((err, res) => {
          chai
            .request(server)
            .get('/api/threads/testboard')
            .end((err, res) => {
              const threadIdToReport = res.body[0]._id;
              chai
                .request(server)
                .put('/api/threads/testboard')
                .send({ thread_id: threadIdToReport })
                .end((err, res) => {
                  assert.equal(res.status, 200);
                  assert.equal(res.text, 'reported');
                  done();
                });
            });
        });
    });
  });

  suite('API ROUTING FOR /api/replies/:board', function () {
    test('POST a reply to a thread', function (done) {
      chai
        .request(server)
        .post('/api/threads/testboard')
        .send({ text: 'Thread for replies', delete_password: 'threadpass' })
        .end((err, res) => {
          chai
            .request(server)
            .get('/api/threads/testboard')
            .end((err, res) => {
              testThreadIdForReply = res.body[0]._id;
              chai
                .request(server)
                .post('/api/replies/testboard')
                .send({
                  thread_id: testThreadIdForReply,
                  text: 'This is a test reply',
                  delete_password: 'replypass'
                })
                .end((err, res) => {
                  assert.equal(res.status, 200);
                  done();
                });
            });
        });
    });

    test('GET thread with all replies', function (done) {
      chai
        .request(server)
        .get('/api/replies/testboard')
        .query({ thread_id: testThreadIdForReply })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isArray(res.body.replies);
          testReplyId = res.body.replies[0]._id;
          done();
        });
    });

    test('DELETE reply with incorrect password', function (done) {
      chai
        .request(server)
        .delete('/api/replies/testboard')
        .send({
          thread_id: testThreadIdForReply,
          reply_id: testReplyId,
          delete_password: 'wrongpass'
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('DELETE reply with correct password', function (done) {
      chai
        .request(server)
        .delete('/api/replies/testboard')
        .send({
          thread_id: testThreadIdForReply,
          reply_id: testReplyId,
          delete_password: 'replypass'
        })
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

    test('PUT report reply', function (done) {
      chai
        .request(server)
        .post('/api/replies/testboard')
        .send({
          thread_id: testThreadIdForReply,
          text: 'Reply to be reported',
          delete_password: 'reportpass'
        })
        .end((err, res) => {
          chai
            .request(server)
            .get('/api/replies/testboard')
            .query({ thread_id: testThreadIdForReply })
            .end((err, res) => {
              const replyToReport = res.body.replies.find(r => r.text === 'Reply to be reported');
              chai
                .request(server)
                .put('/api/replies/testboard')
                .send({
                  thread_id: testThreadIdForReply,
                  reply_id: replyToReport._id
                })
                .end((err, res) => {
                  assert.equal(res.status, 200);
                  assert.equal(res.text, 'reported');
                  done();
                });
            });
        });
    });
  });
});
