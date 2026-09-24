const express = require('express');
const socket = require('socket.io');
const app = express();

const { Chess } = require('chess.js');
const chess = new Chess();

const http = require('http');
const Server = http.createServer(app);

const Path = require('path');
const io = socket(Server);

let players = {
    white: null,
    black: null
};

app.set('view engine', 'ejs');
app.use(express.static(Path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render("index", { title: "Chess Game" });
});


io.on("connection", function(uniqueSocket) {

    console.log("A user connected");

    // Assign player role
    if (!players.white) {

        players.white = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "w");

    } else if (!players.black) {

        players.black = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "b");

    } else {

        uniqueSocket.emit("playerRole", "s");

    }

    // Send current board to newly connected player
    uniqueSocket.emit("boardState", chess.fen());


    // Handle disconnect
    uniqueSocket.on("disconnect", function() {

        console.log("A user disconnected");

        if (players.white === uniqueSocket.id) {

            players.white = null;

        } else if (players.black === uniqueSocket.id) {

            players.black = null;

        }
    });


    // Handle chess move
    uniqueSocket.on("move", function(move) {

        try {

            // Check whose turn it is
            if (chess.turn() === "w" && uniqueSocket.id !== players.white) {
                return;
            }

            if (chess.turn() === "b" && uniqueSocket.id !== players.black) {
                return;
            }


            // Try to make the move
            const result = chess.move(move);


            if (result) {

                console.log("Valid move:", move);

                // Send updated board to everyone
                io.emit("boardState", chess.fen());

            } else {

                console.log("Invalid move:", move);

                uniqueSocket.emit("invalidMove", move);
            }

        } catch (err) {

            console.log("Move error:", err);

            uniqueSocket.emit("invalidMove", move);
        }
    });

});


Server.listen(3000, () => {
    console.log('Server is running on port 3000');
});