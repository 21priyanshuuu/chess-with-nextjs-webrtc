const socket = io();
const chess = new Chess();
const boardElement = document.querySelector('.chessboard');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let fen; // Declare the fen variable

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square",
                (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
            );
            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === 'w' ? "white" : "black");
                pieceElement.innerText = getPieceUnicode(square.type);
                pieceElement.draggable = playerRole === square.color;
   // Add the flipped class to the pieces if the board is flipped
   if (playerRole === 'b') {
    pieceElement.classList.add("flipped");
} else {
    pieceElement.classList.remove("flipped");
}
                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowindex, col: squareindex }; // Corrected to store index
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", function(e) {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", function(e) {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };
                    handleMove(sourceSquare, targetSquare);  
                }
            });

            boardElement.appendChild(squareElement);
        });
    });
    if(playerRole === 'b') {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q' // promote to a queen for simplicity
    };

    // Attempt to make the move on the chess board
    const result = chess.move(move);

    if (result) {
        fen = chess.fen(); // Update fen after a successful move
        socket.emit("move", move); // Emit the move
        renderBoard();
    } else {
        console.log('Invalid move');
    }
};

const getPieceUnicode = (type) => {
    switch (type) {
        case 'p': return '♟'; // Pawn
        case 'r': return '♖'; // Rook
        case 'n': return '♞'; // Knight
        case 'b': return '♗'; // Bishop
        case 'q': return '♕'; // Queen
        case 'k': return '♔'; // King
        default: return '';
    }
};

socket.on("playerRole", function(role) {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", function() {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", function(boardFen) {
    fen = boardFen; // Assign the received FEN string
    chess.load(fen);
    renderBoard();
});

socket.on("move", function(move) {
    chess.move(move);
    fen = chess.fen(); // Update fen after receiving a move
    renderBoard();
});

renderBoard();
