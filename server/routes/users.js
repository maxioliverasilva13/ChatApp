import express from "express"
import { addContact, changeUserStatus, checkToken, createUser, getUsers, handleChangeUserInfo, loadContacts, login, searchUser } from "../controllers/user.js"

const router = express.Router();

router.get("/", getUsers);
router.post("/", createUser);
router.post("/signIn", login);
router.post("/checkToken", checkToken);
router.get("/searchUser", searchUser);
router.post("/addContact", addContact);
router.get("/loadContacts", loadContacts);
router.post("/changeUserStatus", changeUserStatus);
router.post("/changeUserInfo", handleChangeUserInfo);



export default router;