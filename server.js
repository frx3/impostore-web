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

let games = {}; // { code: { players: [{id,name}], word, impostorId, code } }

const WORDS = [
  // --- Originali ---
  'Colosseo','Testimone','Astronave','Fucile','Ferrari','Caricatura','Neve','Netflix','Fragola',
  'Giulio Cesare','Panificio','Buddha','Zebra','Storia','Dottor','Guida','Tennis da tavolo','Superman',
  'Caramello','Piuma','Pizza','Mare','Montagna','Computer','Scuola','Cinema','Telefono','Pallone','Gatto',
  'Cane','Viaggio','Sedia','Occhiali','Finestra','Porta','Luna','Sole','Nuvola','Tempesta','Bosco','Fiume',
  'Aereo','Treno','Bicicletta','Caffè','Libro','Penna','Matita','Cioccolato',

  // --- Musica ---
  'Chitarra','Batteria','Concerto','Festival','Microfono','Nota','Canzone','Sanremo','Rap','Orchestra',

  // --- Cultura pop / Cinema ---
  'Avengers','Harry Potter','Star Wars','Batman','Spider-Man','Matrix','Oscar','Popcorn','Regista','Marvel',

  // --- Religione cristiana cattolica ---
  'Gesù','Bibbia','Preghiera','Vangelo','Papa','Croce','Chiesa','Angelo','Rosario','Sacerdote',

  // --- Anime / Manga ---
  'Naruto','One Piece','Goku','Dragon Ball','Anime','Manga','Sailor Moon','Attacco dei Giganti','Pokémon','Luffy',

  // --- Videogiochi ---
  'Minecraft','Fortnite','Super Mario','Zelda','Joystick','Console','Tetris','Controller','Pokemon','PlayStation',

  // --- Altro semplice ---
  'Ospedale','Semaforo','Uovo','Scarpa','Orologio','Gelato','Calcio','Maglietta','Specchio','Farfalla'
];

function generateCode() {
  return Math.random().toString(36).substr(2,4).toUpperCase();
}

function assignRound(game) {
  game.word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const idx = Math.floor(Math.random() * game.players.length);
  game.impostorId = game.players[idx].id;
  game.players.forEach(p => {
    if (p.id === game.impostorId) {
      io.to(p.id).emit('role', { impostor: true });
    } else {
      io.to(p.id).emit('role', { impostor: false, word: game.word });
    }
  });
  console.log(`🔄 Round per stanza ${game.code}: parola="${game.word}", impostore=${game.impostorId}`);
}

io.on('connection', socket => {
  console.log(`✅ Connessione: ${socket.id}`);

  socket.on('create', () => {
    const code = generateCode();
    games[code] = { players: [], code };
    socket.join(code);
    socket.emit('created', code);
    console.log(`🎮 Stanza creata: ${code}`);
  });

  socket.on('join', ({ code, name }) => {
    const game = games[code];
    if (!game) return socket.emit('error', 'Codice stanza non valido');
    const player = { id: socket.id, name };
    game.players.push(player);
    socket.join(code);
    io.in(code).emit('lobby', game.players);
    console.log(`👤 ${name} entrato in ${code}`);
  });

  socket.on('start', code => {
    const game = games[code];
    if (!game || game.players.length === 0) return;
    assignRound(game);
  });

  socket.on('nextRound', code => {
    const game = games[code];
    if (!game || game.players.length === 0) return;
    assignRound(game);
  });
});

server.listen(PORT, () => console.log(`✨ Server in ascolto su http://localhost:${PORT}`));