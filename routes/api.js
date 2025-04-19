'use strict';
const mongoose = require('mongoose');
const Thread = require('../models/Thread');

module.exports = function (app) {
  
  // ✅ Create a new thread
  app.post('/api/threads/:board', async (req, res) => {
    const board = req.params.board;
    const { text, delete_password } = req.body;

    try {
      const newThread = new Thread({
        board,
        text,
        delete_password,
      });

      const savedThread = await newThread.save();
      res.json(savedThread);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create thread' });
    }
  });

  // ✅ Get 10 most recent threads with 3 replies each
  app.get('/api/threads/:board', async (req, res) => {
    const board = req.params.board;

    try {
      const threads = await Thread.find({ board })
        .sort({ bumped_on: -1 })
        .limit(10)
        .select('-delete_password -reported')
        .lean();

      threads.forEach(thread => {
        thread.replycount = thread.replies.length;
        thread.replies = thread.replies
          .sort((a, b) => b.created_on - a.created_on)
          .slice(0, 3)
          .map(reply => {
            const { delete_password, reported, ...cleanReply } = reply;
            return cleanReply;
          });
      });

      res.json(threads);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch threads' });
    }
  });

  // ✅ Delete a thread
  app.delete('/api/threads/:board', async (req, res) => {
    const { thread_id, delete_password } = req.body;

    try {
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.status(404).send('Thread not found');

      if (thread.delete_password !== delete_password) {
        return res.send('incorrect password');
      }

      await Thread.findByIdAndDelete(thread_id);
      res.send('success');
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete thread' });
    }
  });

  // ✅ Report a thread
  app.put('/api/threads/:board', async (req, res) => {
    const { report_id } = req.body;

    try {
      const thread = await Thread.findById(report_id);
      if (!thread) return res.status(404).send('Thread not found');

      thread.reported = true;
      await thread.save();
      res.send('reported');
    } catch (err) {
      res.status(500).json({ error: 'Failed to report thread' });
    }
  });

  // ✅ Create a reply
  app.post('/api/replies/:board', async (req, res) => {
    const board = req.params.board;
    const { thread_id, text, delete_password } = req.body;

    try {
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.status(404).json({ error: 'Thread not found' });

      const newReply = {
        text,
        delete_password,
        created_on: new Date(),
        reported: false,
      };

      thread.replies.push(newReply);
      thread.bumped_on = new Date();

      await thread.save();
      res.json(thread);
    } catch (err) {
      res.status(500).json({ error: 'Failed to post reply' });
    }
  });

  // ✅ Get full thread with all replies
  app.get('/api/replies/:board', async (req, res) => {
    const thread_id = req.query.thread_id;

    try {
      const thread = await Thread.findById(thread_id)
        .select('-delete_password -reported')
        .lean();

      if (!thread) return res.status(404).json({ error: 'Thread not found' });

      thread.replies = thread.replies.map(reply => {
        const { delete_password, reported, ...cleanReply } = reply;
        return cleanReply;
      });

      res.json(thread);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch replies' });
    }
  });

  // ✅ Delete a reply
  app.delete('/api/replies/:board', async (req, res) => {
    const { thread_id, reply_id, delete_password } = req.body;

    try {
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.status(404).send('Thread not found');

      const reply = thread.replies.id(reply_id);
      if (!reply) return res.status(404).send('Reply not found');

      if (reply.delete_password !== delete_password) {
        return res.send('incorrect password');
      }

      reply.text = '[deleted]';
      await thread.save();
      res.send('success');
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete reply' });
    }
  });

  // ✅ Report a reply
  app.put('/api/replies/:board', async (req, res) => {
    const { thread_id, reply_id } = req.body;

    try {
      const thread = await Thread.findById(thread_id);
      if (!thread) return res.status(404).send('Thread not found');

      const reply = thread.replies.id(reply_id);
      if (!reply) return res.status(404).send('Reply not found');

      reply.reported = true;
      await thread.save();

      res.send('reported');
    } catch (err) {
      res.status(500).json({ error: 'Failed to report reply' });
    }
  });
};
