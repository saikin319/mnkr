// server.js
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// publicフォルダ配信
app.use(express.static('public'));

// プレイヤー情報保持
const players = {};
const colors = ['red','blue','green','orange','purple','pink','yellow'];

// 初期座標とカラー生成
function createNewPlayer(id, name) {
    return {
        id,
        name,
        x: Math.floor(Math.random() * 460) + 20, // 500-20-20
        y: Math.floor(Math.random() * 460) + 20,
        color: colors[Math.floor(Math.random() * colors.length)]
    };
}

// 移動速度
const speed = 5;

// クライアント接続
io.on('connection', socket => {
    console.log('New connection:', socket.id);

    // 名前セット受信
    socket.on('setName', (name) => {
        const player = createNewPlayer(socket.id, name);
        players[socket.id] = player;

        // 既存プレイヤーを新規クライアントに送信
        socket.emit('currentPlayers', players);

        // 新規プレイヤーを全体に通知
        socket.broadcast.emit('newPlayer', player);
    });

    // 移動処理
    socket.on('move', (dir) => {
        const p = players[socket.id];
        if (!p) return;

        if (dir === 'left') p.x -= speed;
        else if (dir === 'right') p.x += speed;
        else if (dir === 'up') p.y -= speed;
        else if (dir === 'down') p.y += speed;

        // 壁で制限
        p.x = Math.max(10, Math.min(470, p.x));
        p.y = Math.max(10, Math.min(470, p.y));

        io.emit('playerMoved', { id: socket.id, x: p.x, y: p.y });
    });

    // チャット受信
    socket.on('chatMessage', (msg) => {
        const p = players[socket.id];
        if (!p) return;
        io.emit('chatMessage', { name: p.name, msg });
    });

    // 切断処理
    socket.on('disconnect', () => {
        console.log('Disconnected:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

// サーバー起動
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
