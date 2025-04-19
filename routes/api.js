'use strict';
const Thread = require('../models/Thread');

module.exports = function (app) {
  // ✅ POST thread
  app.post('/api/threads/:board', async (req, res) => {
    const { text, delete_password } = req.body;
    const board = req.params.board;

    try {
      const thread = new Thread({
        board,
        text,
        delete_password,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        replies: []
      });

      const saved = await thread.save();
      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create thread' });
    }
  });

  // ✅ GET threads (10 threads + 3 replies)
  app.get('/api/threads/:board', async (req, res) => {
    try {
      const threads = await Thread.find({ board: req.params.board })
        .sort({ bumped_on: -1 })
        .limit(10)
        .lean();

      threads.forEach(t => {
        t.replycount = t.replies.length;
        t.replies = t.replies
          .sort((a, b) => b.created_on - a.created_on)
          .slice(0, 3)
          .map(r => ({
            _id: r._id,
            text: r.text,
            created_on: r.created_on
          }));
        delete t.delete_password;
        delete t.reported;
      });

      res.json(threads);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch threads' });
    }
  });

  // ✅ DELETE thread
  app.delete('/api/threads/:board', async (req, res) => {
    const { thread_id, delete_password } = req.body;

    try {
      const thread = await Thread.findById(thread_id);
      if (!thread || thread.delete_password !== delete_password)
        return res.send('incorrect password');

      await Thread.findByIdAndDelete(thread_id);
      res.send('success');
    } catch (err) {
      res.status(500).send('error');
    }
  });

  // ✅ PUT thread (report)
  app.put('/api/threads/:board', async (req, res) => {
    const { report_id } = req.body;

    try {
      const thread = await Thread.findById(report_id);
      if (!thread) return res.send('Thread not found');

      thread.reported = true;
      await thread.save();
      res.send('reported');
    } catch (err) {
      res.status(500).send('error');
    }
  });

  // ✅ POST reply
  app.post('/api/replies/:board', async (req, res) => {
    const { thread_id, text, delete_password } = req.body;

    try {
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.status(404).send('Thread not found');

      const newReply = {
        text,
        delete_password,
        created_on: new Date(),
        reported: false
      };

      thread.replies.push(newReply);
      thread.bumped_on = new Date();

      await thread.save();
      res.json(thread);
    } catch (err) {
      res.status(500).send('error');
    }
  });

  // ✅ GET full thread with all replies
  app.get('/api/replies/:board', async (req, res) => {
    const thread_id = req.query.thread_id;

    try {
      const thread = await Thread.findById(thread_id).lean();
      if (!thread) return res.status(404).send('Thread not found');

      delete thread.delete_password;
      delete thread.reported;
      thread.replies = thread.replies.map(r => {
        const { delete_password, reported, ...clean } = r;
        return clean;
      });

      res.json(thread);
    } catch (err) {
      res.status(500).send('error');
    }
  });

  // ✅ DELETE reply
  app.delete('/api/replies/:board', async (req, res) => {
    const { thread_id, reply_id, delete_password } = req.body;

    try {
      const thread = await Thread.findById(thread_id);
      const reply = thread.replies.id(reply_id);

      if (!reply || reply.delete_password !== delete_password)
        return res.send('incorrect password');

      reply.text = '[deleted]';
      await thread.save();
      res.send('success');
    } catch (err) {
      res.status(500).send('error');
    }
  });

  // ✅ PUT reply (report)
  app.put('/api/replies/:board', async (req, res) => {
    const { thread_id, reply_id } = req.body;

    try {
      const thread = await Thread.findById(thread_id);
      const reply = thread.replies.id(reply_id);

      if (!reply) return res.send('Reply not found');

      reply.reported = true;
      await thread.save();
      res.send('reported');
    } catch (err) {
      res.status(500).send('error');
    }
  });
};
