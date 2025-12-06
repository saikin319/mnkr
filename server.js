const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const players = {};

io.on('connection', (socket) => {
    console.log('user connected:', socket.id);

    // 接続時に名前受け取る
    socket.on('setName', (name) => {
        players[socket.id] = { 
            x: 50, y: 50, 
            color: '#' + Math.floor(Math.random()*16777215).toString(16),
            name: name || '名無し'
        };

        // 接続済みプレイヤー情報送信
        socket.emit('currentPlayers', players);

        // 他プレイヤーに通知
        socket.broadcast.emit('newPlayer', { id: socket.id, ...players[socket.id] });
    });

    // 移動処理
    socket.on('move', (dir) => {
        const player = players[socket.id];
        if (!player) return;

        const speed = 8; // 速度アップ
        if (dir === 'left' && player.x > 10) player.x -= speed;
        if (dir === 'right' && player.x < 470) player.x += speed;
        if (dir === 'up' && player.y > 10) player.y -= speed;
        if (dir === 'down' && player.y < 470) player.y += speed;

        io.emit('playerMoved', { id: socket.id, x: player.x, y: player.y });
    });

    // チャット処理
    socket.on('chatMessage', (msg) => {
        if (!players[socket.id]) return;
        io.emit('chatMessage', { name: players[socket.id].name, msg });
    });

    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});
