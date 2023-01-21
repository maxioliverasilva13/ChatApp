import express from "express"
import { checkToken, createUser, getUsers, login } from "../controllers/user.js"

const router = express.Router();

router.get("/", getUsers);
router.post("/", createUser);
router.post("/signIn", login);
router.post("/checkToken", checkToken);

export default router;