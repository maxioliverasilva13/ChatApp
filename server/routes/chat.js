import express from "express"
import { createMessage, getMessages } from './../controllers/chat.js';
import { validateJwt } from "../helpers/jwt.js";

const router = express.Router();

router.post("/create", validateJwt, createMessage);
router.get("/getMessages", validateJwt, getMessages);

export default router;