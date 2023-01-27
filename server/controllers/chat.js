import { request, response } from "express";
import { User } from "../entities/user.js";
import { getRepository } from "typeorm"
import bcrypt from "bcrypt"
import { generateJWT, SECRET_SEED } from './../helpers/jwt.js';
import jwt from 'jsonwebtoken';
import mom from "moment";
import { Chat } from "../entities/chat.js";

const moment = mom();

export const createMessage = async (req = request, res = response) => {
    //select from
    try {
        const { token } = req?.headers;
        const { id: userId } = jwt.verify(token, SECRET_SEED);

        const { message, to } = req?.body;

        if (!message || !to) {
            throw new Error("Mensaje o remitente incorrectos")
        }

        const newMessage = await getRepository(Chat).create({
            message,
            from: userId,
            to: to,
        });
        const response = await getRepository(Chat).save(newMessage)

        return res.json({
            ok: true,
            newMessage: {
                chats_id: response?.id,
                chats_message: response?.message,
                chats_time: response?.time,
                chats_from: response?.from,
                chats_to: response?.to,
                isMe: true,
            },
        })
    } catch (error) {
        console.log(error)
        return res.json({ ok: false, msg: "Contacte con el desarrollador" });
    }
};



export const getMessages = async (req = request, res = response) => {
    //select from
    try {
        const { token } = req?.headers;
        const { id: userId } = jwt.verify(token, SECRET_SEED);

        const messages = await getRepository(Chat).createQueryBuilder().where(
            "chats.from =:meId OR chats.to=:meId", { meId: userId }).orderBy('chats_time', 'DESC').execute()

        const newListOfMessages = {};

        const listOfUsers = {};

        await messages?.forEach(msg => {
            if (!listOfUsers[msg?.chats_from]) {
                listOfUsers[msg?.chats_from] = null;
                // newListOfMessages[msg?.chats_from] = null;
            }
            if (!listOfUsers[msg?.chats_to]) {
                listOfUsers[msg?.chats_to] = null;
                // newListOfMessages[msg?.chats_from] = null;
            }
        })

        await Promise.all(Object.keys(listOfUsers)?.map(async (uid) => {
            const userInfo = await getRepository(User).findOneBy({ id: uid });
            listOfUsers[uid] = userInfo;
        }))

        const handleAddData = async (item, idToUse,) => {
            if (newListOfMessages[idToUse] === null || typeof newListOfMessages[idToUse] === "undefined") {
                const userInfo = listOfUsers[idToUse];
                const messageItem = {
                    ...userInfo,
                    password: null,
                    chats: messages?.filter(it => it?.chats_from === idToUse || it?.chats_to === idToUse) || []
                }

                const newItem = {
                    ...messageItem,
                    lastMessage: messageItem?.chats[0] || null,
                    chats: messageItem?.chats?.map((msg) => {
                        return {
                            ...msg,
                            isMe: userId === msg?.chats_from
                        }
                    })
                }

                newListOfMessages[idToUse] = newItem;
            }
            return !newListOfMessages[idToUse] && item?.chats_to != userId;
        }

        await Promise.all(messages?.map(async (item) => {
            const response = await handleAddData(item, item?.chats_to);
            if (!response) {
                await handleAddData(item, item?.chats_from);
            }

        }))

        delete newListOfMessages[userId];

        const listOfMessagesArr = Object.keys(newListOfMessages)?.map((key) => {
            return newListOfMessages[key];
        })

        const sortedListOfMessages = listOfMessagesArr?.sort((itemA, itemB) => itemA?.lastMessage?.chats_time > itemB?.lastMessage?.chats_time ? -1 : 1) || []

        return res.json({
            ok: true,
            chats: sortedListOfMessages,
        })
    } catch (error) {
        console.log(error)
        return res.json({ ok: false, msg: "Contacte con el desarrollador" });
    }
};
