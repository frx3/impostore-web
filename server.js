// =============================
// IMPOSTORE - VERSIONE MINIMA WEB (robusta)
// =============================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('public'));

const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

let games = {}; // struttura: { code: { players: [{id,name}], started:bool, word, impostorId } }

const WORDS = [
  'Colosseo', 'Testimone', 'Astronave', 'Fucile', 'Ferrari', 'Caricatura', 'Neve', 'Netflix', 'Fragola',
  'Giulio Cesare', 'Panificio', 'Buddha', 'Zebra', 'Storia', 'Dottor', 'Guida', 'Tennis da tavolo',
  'Superman', 'Caramello', 'Piuma', 'Pizza', 'Mare', 'Montagna', 'Computer', 'Scuola', 'Cinema',
  'Telefono', 'Pallone', 'Gatto', 'Cane', 'Viaggio', 'Sedia', 'Occhiali', 'Finestra', 'Porta', 'Luna',
  'Sole', 'Nuvola', 'Tempesta', 'Bosco', 'Fiume', 'Aereo', 'Treno', 'Bicicletta', 'Caffè', 'Libro',
  'Penna', 'Matita', 'Cioccolato'
];

function generateCode() {
  return Math.random().toString(36).substr(2, 4).toUpperCase();
}

io.on('connection', (socket) => {
  console.log(`✅ Nuova connessione: ${socket.id}`);

  socket.on('create', () => {
    const code = generateCode();
    games[code] = { players: [], started: false };
    socket.join(code);
    socket.emit('created', code);
    console.log(`🎮 Stanza creata: ${code}`);
  });

  socket.on('join', ({ code, name }) => {
    const game = games[code];
    console.log('📥 JOIN REQUEST:', code, name);
    if (!game) {
      socket.emit('error', 'Codice stanza non valido');
      return;
    }
    if (game.started) {
      socket.emit('error', 'La partita è già iniziata');
      return;
    }

    const player = { id: socket.id, name };
    game.players.push(player);
    socket.join(code);
    io.in(code).emit('lobby', game.players);
    console.log(`👤 ${name} è entrato nella stanza ${code}`);
  });

  socket.on('start', (code) => {
    const game = games[code];
    if (!game || game.started) return;

    game.started = true;
    game.word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const impostorIndex = Math.floor(Math.random() * game.players.length);
    game.impostorId = game.players[impostorIndex].id;

    console.log(`🚀 Partita iniziata nella stanza ${code} - parola: ${game.word}`);

    game.players.forEach((player) => {
      if (player.id === game.impostorId) {
        io.to(player.id).emit('role', { impostor: true });
      } else {
        io.to(player.id).emit('role', { impostor: false, word: game.word });
      }
    });
  });
});

server.listen(PORT, () => console.log(`✨ Server attivo su http://localhost:${PORT}`));