const socket = io();

let currentCode = "";

function createGame() {
  socket.emit('create');
  socket.on('created', (code) => {
    currentCode = code;
    document.getElementById('menu').style.display = 'none';
    document.getElementById('lobby').style.display = 'block';
  });
}

function joinGame() {
  const code = document.getElementById('joinCode').value.toUpperCase();
  const name = document.getElementById('nickname').value;
  currentCode = code;
  socket.emit('join', { code, name });
}

socket.on('lobby', (players) => {
  document.getElementById('menu').style.display = 'none';
  document.getElementById('lobby').style.display = 'block';
  const ul = document.getElementById('players');
  ul.innerHTML = '';
  players.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p.name;
    ul.appendChild(li);
  });
});

function startGame() {
  socket.emit('start', currentCode);
}

socket.on('role', (data) => {
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('private').style.display = 'block';
  if (data.impostor) {
    document.getElementById('role').innerHTML = '💀 <strong>Sei l\'IMPOSTORE</strong>';
  } else {
    document.getElementById('role').innerHTML = `🔍 <strong>Parola segreta:</strong><br> ${data.word}`;
  }
});

socket.on('error', (msg) => {
  alert(msg);
});