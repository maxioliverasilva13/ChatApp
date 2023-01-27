import express from "express"
import morgan from "morgan";
import { Server as SocketServer } from "socket.io"
import http from "http"
import cors from "cors"
import { PORT } from "./config.js";
import UserRoutes from "./routes/users.js";
import ChatRoutes from "./routes/chat.js";
import { createConnection } from "typeorm";
import bodyParser from "body-parser";
import jwt from 'jsonwebtoken';
import { SECRET_SEED } from "./helpers/jwt.js";

const app = express();
const server = http.createServer(app);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

const io = new SocketServer(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true,
    },
    allowEIO3: true
})

const connection = await createConnection();
app.use(morgan("dev"))
app.use(cors())


var connected_users_keys_pair = [];


io.sockets.on("connection", (socket) => {
    try {
        socket.on("message", async (message) => {
            console.log("llego aca")
            const { id: userId } = jwt.verify(message?.token, SECRET_SEED);
            const userTo = message?.message?.chats_to;
            if (userTo !== userId) {
                console.log("deberia enviar")
                const myListOfUsers = connected_users_keys_pair?.filter((item) => item?.clientId === userTo) || [];
                console.log(myListOfUsers);
                if (myListOfUsers?.length > 0) {
                    myListOfUsers?.forEach((item) => {
                        socket.to(item?.socketId).emit("msg", `${message?.message?.chats_to}`)
                        console.log("emitido a ", item?.socketId);
                    })
                }

            }
        })

        socket.on('addUserConnections', (data) => {
            if (connected_users_keys_pair?.find(keyPars => keyPars?.socketId === socket.id) === undefined) {
                console.log("se conecto el usuario", data)
                console.log("su usuario es", socket.id)
                connected_users_keys_pair?.push({
                    clientId: data,
                    socketId: socket?.id,
                })
            }
        });
    } catch (error) {
        console.log("error in socket io", error)
    }
})

app.use("/users", UserRoutes)
app.use("/chats", ChatRoutes)

server.listen(PORT)
console.log("app listen in port", PORT);