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
import { getRepository } from "typeorm"
import { handleChangeUserStatus } from "./controllers/user.js";

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
            const { id: userId } = jwt.verify(message?.token, SECRET_SEED);
            const userTo = message?.message?.chats_to;
            if (userTo !== userId) {
                const myListOfUsers = connected_users_keys_pair?.filter((item) => item?.clientId === userTo) || [];
                if (myListOfUsers?.length > 0) {
                    myListOfUsers?.forEach((item) => {
                        socket.to(item?.socketId).emit("msg", `${message?.message?.chats_to}`)
                    })
                }

            }
        })

        socket.on('addUserConnections', async (data) => {
            if (data === 2 || data === "2") {
                console.log("se conecto el usuario 2 con el socket id", socket.id)
            }
            connected_users_keys_pair?.push({
                clientId: data,
                socketId: socket?.id,
            })

            handleChangeUserStatus(data, true)
            const myFriends = await getRepository("friends").createQueryBuilder("friends").where("friends.usersId_1 = :usersId_1", { usersId_1: data }).getRawMany();

            connected_users_keys_pair?.forEach((item) => {
                if (myFriends?.find(u => u?.friends_usersId_2 === item?.clientId)) {
                    socket?.to(item?.socketId)?.emit("changeUserConnectedTrue", data);
                }
            })

        });

        socket.on('desconectar', async (uid) => {
            handleChangeUserStatus(uid, false)
            connected_users_keys_pair = connected_users_keys_pair?.filter((item) => item?.clientId !== uid)
            const myFriends = await getRepository("friends").createQueryBuilder("friends").where("friends.usersId_1 = :usersId_1", { usersId_1: uid }).getRawMany();
            connected_users_keys_pair?.forEach((item) => {
                if (myFriends?.find(u => u?.friends_usersId_2 === item?.clientId)) {
                    socket?.to(item?.socketId)?.emit("changeUserConnectedFalse", uid);
                }
            })

        });
    } catch (error) {
        console.log("error in socket io", error)
    }
})

app.use("/users", UserRoutes)
app.use("/chats", ChatRoutes)

server.listen(PORT)
console.log("app listen in port", PORT);