const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users');

// config express to use socket.io
const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

//Define paths for express config
const publicDirPath = path.join(__dirname, '../public');

app.use(express.static(publicDirPath));

io.on('connection', (socket)=>{
    console.log('New websocket connection');

    // listen to a cutome event
    // join rooms
    socket.on('join', (options, callback)=>{

        const { error, user } = addUser({ id: socket.id, ...options});
        if(error){
            return callback(error);
        }

        socket.join(user.room);
        //  send welcome message to the connected user
        socket.emit('message', generateMessage('Admin', 'Welcome!'));
        // send message to all user in the room except the new connected one
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`));

        // send room data
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
    })

    socket.on('sendMessage', (message, callback)=>{
        const filter = new Filter();
        const user = getUser(socket.id);

        if (filter.isProfane(message)) {
            return callback('profanity is not allowed');
        }
        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
    });
    socket.on('sendLocation', (coords, callback)=>{
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `http://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback();
    })

    // send a message to all user when a connected user disconnect
    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));
            // send room data
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    });

})


server.listen(port, ()=>{
    console.log('Server is listening on port :'+ port);
})