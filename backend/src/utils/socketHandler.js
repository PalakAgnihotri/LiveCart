const Stream = require('../models/Stream');

const roomViewers = new Map(); // roomId -> Set of socketIds
const userSockets = new Map(); // userId -> socketId

exports.socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // ── User online ──
    socket.on('user:online', (userId) => {
      userSockets.set(userId, socket.id);
    });

    // ── Join stream room ──
    socket.on('stream:join', async ({ roomId, userId, userName }) => {
      socket.join(roomId);

      if (!roomViewers.has(roomId)) roomViewers.set(roomId, new Set());
      roomViewers.get(roomId).add(socket.id);

      const count = roomViewers.get(roomId).size;

      // Update viewer count in DB
      try {
        const stream = await Stream.findOne({ roomId });
        if (stream) {
          stream.viewerCount = count;
          if (count > stream.peakViewers) stream.peakViewers = count;
          await stream.save();
        }
      } catch {}

      // Notify room of new viewer count
      io.to(roomId).emit('stream:viewerCount', count);

      // Announce join in chat
      io.to(roomId).emit('stream:chat', {
        type:    'system',
        message: `${userName} joined the stream`,
        time:    new Date(),
      });
    });

    // ── Leave stream room ──
    socket.on('stream:leave', async ({ roomId, userName }) => {
      socket.leave(roomId);
      roomViewers.get(roomId)?.delete(socket.id);

      const count = roomViewers.get(roomId)?.size || 0;

      try {
        await Stream.findOneAndUpdate({ roomId }, { viewerCount: count });
      } catch {}

      io.to(roomId).emit('stream:viewerCount', count);
      io.to(roomId).emit('stream:chat', {
        type:    'system',
        message: `${userName} left`,
        time:    new Date(),
      });
    });

    // ── Live chat message ──
    socket.on('stream:chat', async ({ roomId, userId, userName, message }) => {
      const payload = { userId, userName, message, time: new Date(), type: 'message' };

      // Broadcast to room
      io.to(roomId).emit('stream:chat', payload);

      // Save to DB chat log
      try {
        await Stream.findOneAndUpdate(
          { roomId },
          { $push: { chatLog: { user: userName, message, time: payload.time } } }
        );
      } catch {}
    });

    // ── Emoji reaction ──
    socket.on('stream:reaction', ({ roomId, emoji }) => {
      io.to(roomId).emit('stream:reaction', { emoji });
    });

      // Notify seller to send a WebRTC offer to this new viewer
      socket.to(roomId).emit('webrtc:request-offer', { viewerId: socket.id });
    });

    // ── WebRTC signalling (Targeted) ──
    socket.on('webrtc:offer', ({ targetId, offer }) => {
      io.to(targetId).emit('webrtc:offer', { from: socket.id, offer });
    });

    socket.on('webrtc:answer', ({ to, answer }) => {
      io.to(to).emit('webrtc:answer', { answer, viewerId: socket.id });
    });

    socket.on('webrtc:ice', ({ targetId, candidate }) => {
      io.to(targetId).emit('webrtc:ice', { candidate, from: socket.id });
    });

    socket.on('webrtc:end', ({ roomId }) => {
      socket.to(roomId).emit('webrtc:end');
    });

    // ── Disconnect cleanup ──
    socket.on('disconnect', async () => {
      for (const [roomId, viewers] of roomViewers.entries()) {
        if (viewers.has(socket.id)) {
          viewers.delete(socket.id);
          const count = viewers.size;
          io.to(roomId).emit('stream:viewerCount', count);
          try {
            await Stream.findOneAndUpdate({ roomId }, { viewerCount: count });
          } catch {}
        }
      }
      for (const [uid, sid] of userSockets.entries()) {
        if (sid === socket.id) { userSockets.delete(uid); break; }
      }
    });
  });
};
