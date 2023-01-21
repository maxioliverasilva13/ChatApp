import express from "express"
import morgan from "morgan";
import { Server as SocketServer } from "socket.io"
import http from "http"
import cors from "cors"
import { PORT } from "./config.js";
import UserRoutes from "./routes/users.js";
import { createConnection } from "typeorm";
import bodyParser from "body-parser";

const app = express();
const server = http.createServer(app);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

const io = new SocketServer(server, {
    cors: {
        origin: "http://localhost:3000"
    }
})

const connection = await createConnection();
app.use(morgan("dev"))
app.use(cors())

io.on("connection", (socket) => {
    console.log(socket.id)

    socket.on("message", (message) => {
        console.log(message)
        socket.broadcast.emit("message", {
            body: message,
            from: socket?.id, 
        })
    })
})

app.use("/users", UserRoutes)

server.listen(PORT)
console.log("app listen in port", PORT);