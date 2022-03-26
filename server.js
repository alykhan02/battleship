const express = require('express')
const path = require('path')
const http = require('http')
const PORT = process.env.PORT || 3000
const socketio = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')))

server.listen(PORT, () => console.log(`listening on port ${PORT}`))


const connections = [null, null]

io.on('connection', socket => {
    //console.log('New WS connection')
    let playerIndex = -1
    for (const i in connections){
        if (connections[i] === null) {
            playerIndex = i
            break
        }
    }
    // what player num they are
    socket.emit('player-number', playerIndex)

    console.log(`Player ${playerIndex} has connected`)

    // ignore player3
    if (playerIndex === -1) return

    connections[playerIndex] = false

    // tell everyone what player just connected
    socket.broadcast.emit('player-connection', playerIndex)

    // do disconnect
    socket.on('disconnect', () => {
        console.log(`Player ${playerIndex} disconnected`)
        connections[playerIndex] = null
        socket.broadcast.emit('player-connection', playerIndex)
    })


    socket.on('player-ready', () => {
        socket.broadcast.emit('enemy-ready', playerIndex)
        connections[playerIndex] = true
    })

    socket.on('check-players', () => {
        const players = []
        for (const i in connections) {
            connections[i] === null ? players.push({connected: false, ready: false}) : players.push({connected: true, ready: connections[i]})
        }
        socket.emit('check-players', players)
    })


    socket.on('fire', id => {
        console.log(`Shot fired from ${playerIndex}`, id)

        //emit move to other players
        socket.broadcast.emit('fire', id)
    })

    socket.on('fire-reply', square => {
        console.log(square)

        socket.broadcast.emit('fire-reply', square)
    })

    // TIME OUT
    setTimeout(() => {
        connections[playerIndex] = null
        socket.emit('timeout')
        socket.disconnect()

    }, 600000)
})