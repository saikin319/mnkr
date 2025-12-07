const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 静的ファイル配置
app.use(express.static('public'));

const players = {};

io.on('connection', (socket) => {
    console.log('user connected:', socket.id);

    // 名前設定
    socket.on('setName', (name) => {
        players[socket.id] = { 
            x: 50, 
            y: 50, 
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

        const speed = 8;
        if (dir === 'left' && player.x > 10) player.x -= speed;
        else if (dir === 'right' && player.x < 470) player.x += speed;
        else if (dir === 'up' && player.y > 10) player.y -= speed;
        else if (dir === 'down' && player.y < 470) player.y += speed;

        io.emit('playerMoved', { id: socket.id, x: player.x, y: player.y });
    });

    // チャット処理
    socket.on('chatMessage', (msg) => {
        if (!players[socket.id]) return;
        io.emit('chatMessage', { name: players[socket.id].name, msg });
    });

    // 切断処理
    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

// クラウド対応：ポート自動取得
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
