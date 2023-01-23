import express from "express"
import { addContact, checkToken, createUser, getUsers, loadContacts, login, searchUser } from "../controllers/user.js"

const router = express.Router();

router.get("/", getUsers);
router.post("/", createUser);
router.post("/signIn", login);
router.post("/checkToken", checkToken);
router.get("/searchUser", searchUser);
router.post("/addContact", addContact);
router.get("/loadContacts", loadContacts);

export default router;