'use strict';
const Thread = require('../models/Thread');

module.exports = function (app) {
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
      console.error('❌ Failed to report reply:', err);
      res.status(500).json({ error: 'Failed to report reply' });
    }
  });
  
  
  
  
  

  // GET 10 most recent threads with 3 replies each
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

  // POST a reply to a thread
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
      res.redirect(`/b/${board}/${thread_id}`);
    } catch (err) {
      res.status(500).json({ error: 'Failed to post reply' });
    }
  });
};
