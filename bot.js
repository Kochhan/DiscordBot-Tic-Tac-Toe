const Discord = require("discord.js");
const Canvas = require("canvas");

require('dotenv').config();

const client = new Discord.Client();
client.login(process.env.BOTTOKEN);
console.log("Initializing...");

client.once('ready', () => {
    console.log("logged in");
});

function showBoard(position, channel) {
    const canvas = Canvas.createCanvas(300, 300);
    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;

    ctx.strokeStyle = "dimgrey";
    ctx.lineCap = "round";
    ctx.lineWidth = 10;

    ctx.beginPath();
    ctx.moveTo(width / 3, 10);
    ctx.lineTo(width / 3, height - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width * 2 / 3, 10);
    ctx.lineTo(width * 2 / 3, height - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, height / 3);
    ctx.lineTo(width - 10, height / 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, height * 2 / 3);
    ctx.lineTo(width - 10, height * 2 / 3);
    ctx.stroke();

    ctx.lineWidth = 5;

    let size = 35 / 300 * width;
    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            let r = Math.random();

            let sq = position[x + y * 3];
            if (sq == 1) {
                ctx.strokeStyle = "lightblue";
                ctx.beginPath();
                ctx.arc(width / 6 + width / 3 * x, height / 6 + height / 3 * y, size, 0, Math.PI * 2);
                ctx.stroke();
            } else if (sq == -1) {
                ctx.strokeStyle = "orange";
                ctx.beginPath();
                ctx.moveTo(width / 6 + width / 3 * x - size, height / 6 + height / 3 * y - size);
                ctx.lineTo(width / 6 + width / 3 * x + size, height / 6 + height / 3 * y + size);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(width / 6 + width / 3 * x + size, height / 6 + height / 3 * y - size);
                ctx.lineTo(width / 6 + width / 3 * x - size, height / 6 + height / 3 * y + size);
                ctx.stroke();
            }
        }
    }

    const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'game-position-image.png');
    channel.send((player == 1 ? "Your move:" : "My move:"), attachment);
}

function playMove(x, y) {
    board[x + y * 3] = player;
    player *= -1;
}

function minimax(position, maximizing, depth) {
    let eval = checkSbWon(position);
    if (eval != null)
        return eval * 100 / depth;

    let value;
    if (maximizing) {
        value = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (position[i] == 0) {
                position[i] = 1;
                value = Math.max(value, minimax(position, !maximizing, depth + 1));
                position[i] = 0;
            }
        }
    } else {
        value = Infinity;
        for (let i = 0; i < 9; i++) {
            if (position[i] == 0) {
                position[i] = -1;
                value = Math.min(value, minimax(position, !maximizing, depth));
                position[i] = 0;
            }
        }
    }

    return value;
}

function check(a, b, c) {
    return (a != 0) && (a == b) && (b == c);
}

function gP(x, y) {
    return board[x + y * 3];
}

function checkSbWon() {
    if (check(gP(0, 0), gP(1, 0), gP(2, 0))) return gP(0, 0);
    if (check(gP(0, 1), gP(1, 1), gP(2, 1))) return gP(0, 1);
    if (check(gP(0, 2), gP(1, 2), gP(2, 2))) return gP(0, 2);

    if (check(gP(0, 0), gP(0, 1), gP(0, 2))) return gP(0, 0);
    if (check(gP(1, 0), gP(1, 1), gP(1, 2))) return gP(1, 0);
    if (check(gP(2, 0), gP(2, 1), gP(2, 2))) return gP(2, 0);

    if (check(gP(0, 0), gP(1, 1), gP(2, 2))) return gP(0, 0);
    if (check(gP(2, 0), gP(1, 1), gP(0, 2))) return gP(2, 0);

    let draw = true;
    for (let i = 0; (i < 9) && draw; i++) {
        if (board[i] == 0)
            draw = false;
    }
    if (draw)
        return 0;
    return null;

}

function updateGameState(channel) {
    let outcome = checkSbWon();
    if (outcome != null) {
        gameover = true;
        if (outcome == 1) {
            channel.send("O won.");
        } else if (outcome == -1) {
            channel.send("X won.");
        } else {
            channel.send("Tie.");
        }
    }

}

let player = 1;

let board = [
    0, 0, 0,
    0, 0, 0,
    0, 0, 0
];

let gameover = true;

let invalid_command_answer = new Discord.MessageEmbed()
    .setTitle("Invalid Command")
    .addFields(
        {
            name: 'Here is a list of commands:', value: "`!can`: to display the game\n\
        `new game`: start a new game\n"
        }, {
        name: 'Terms for placing your circle: ', value: "`upper left corner`\n\
        `upper center`\n\
        `upper right corner`\n\
        `left center`\n\
        `center`\n\
        `right center`\n\
        `lower left corner`\n\
        `lower center`\n\
        `lower right corner`"
    }
    );

client.on('message', msg => {
    let channel = msg.channel;
    if (channel.name == "tic-tac-toe") {
        console.log(msg);
        console.log(msg.content);

        if (msg.content == "!can") {
            if (!gameover)
                showBoard(board, channel);
        } else if (msg.content == "new game") {
            player = 1;

            board = [
                0, 0, 0,
                0, 0, 0,
                0, 0, 0
            ];
            gameover = false;
            showBoard(board, channel);
        }
        else {

            if (!gameover) {
                let dict = {
                    "upper left corner": [0, 0],
                    "upper center": [1, 0],
                    "upper right corner": [2, 0],
                    "left center": [0, 1],
                    "center": [1, 1],
                    "right center": [2, 1],
                    "lower left corner": [0, 2],
                    "lower center": [1, 2],
                    "lower right corner": [2, 2]
                };


                let p = dict[msg];
                if ((p != null) && board[p[0] + p[1] * 3] == 0) {
                    playMove(p[0], p[1]);
                    showBoard(board, channel);
                    updateGameState(channel);
                } else if (!msg.author.bot) {
                    msg.reply(invalid_command_answer);
                }
            } else if (!msg.author.bot) {
                msg.reply("You are currently not playing.\n Start a new game with the command `new game`!")
            }

            if ((player == -1) && !gameover) {
                let bestmove = 0;
                let eval = Infinity;
                for (let i = 0; i < 9; i++) {
                    if (board[i] == 0) {
                        board[i] = -1;
                        let e = minimax(board, true, 1); // now maximizing because we already did the minimizing move
                        if (e < eval) {
                            eval = e;
                            bestmove = i;
                        }
                        board[i] = 0;
                    }
                }
                console.log(bestmove);
                board[bestmove] = player;
                player *= -1;
                showBoard(board, channel);
                updateGameState(channel);
            }
        }
    }
});