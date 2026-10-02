import http from 'http';
import app from './app.js';
import { initSocket } from './sockets/index.js';
import { registerNotifier } from './services/notificationService.js';
import { emitToUser } from './sockets/index.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

initSocket(server);

registerNotifier(emitToUser);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`BorrowBox API running on http://localhost:${PORT}`);
});