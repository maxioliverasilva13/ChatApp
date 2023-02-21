import { request, response } from "express";
import { User } from "../entities/user.js";
import { getRepository } from "typeorm"
import bcrypt from "bcrypt"
import { generateJWT, SECRET_SEED } from './../helpers/jwt.js';
import jwt from 'jsonwebtoken';
import mom from "moment";

const moment = mom();

export const getUsers = async (req = request, res = response) => {
  //select from
  try {
    const user = await getRepository(User).find();
    if (user) {
      const userReturn = user.map((e) => {
        return {
          id: e.id,
          name: e.name,
          last_name: e.last_name,
          photo: e.photo,
          name_user: e.name_user,
          email: e.email,
          estado: e.estado,
        };
      });
      return res.json({ ok: true, data: userReturn });
    } else {
      return res.json({ ok: false, msg: "Error al obtener usuario" });
    }
  } catch (error) {
    console.log(error)
    return res.json({ ok: false, msg: "Contacte con el desarrollador" });
  }
};

export const createUser = async (req = request, res = response) => {
  try {
    bcrypt
      .hash(req.body.password, 12)
      .then(async (e) => {
        const userEmail = await getRepository(User).findOneBy({
          email: req.body.email,
        });
        if (userEmail) {
          return res.json({
            ok: false,
            msg: "El email ya existe",
          });
        }
        const Newuser = await getRepository(User).create({
          password: e,
          email: req?.body?.email,
          name: req?.body?.name,
          photo: req?.body?.image,
          apellido: req?.body?.apellido,
          ciudad: req?.body?.ciudad,
          direccion: req?.body?.direccion,
          telefono: req?.body?.telefono,
          pais: req?.body?.pais,
        });
        const resultado = await getRepository(User).save(Newuser);
        const token = await generateJWT(resultado.id, resultado.email);
        console.log("token is", token)
        return res.json({
          ok: true,
          token,
          msg: "Usuario creado correctamente"
        });
      })
      .catch((err) => {
        console.log(err)
        return res.json({ ok: false, msg: "Contacte con el desarrollador" });
      });
  } catch (error) {
    console.log(error);
    return res.json({ ok: false, msg: "Contacte con el desarrollador" });
  }
};


export const login = async (req = request, res = response) => {
  const { email, password } = req?.body;
  console.log("email is", email)
  const userFound = await getRepository(User).findOneBy({
    email,
  })

  const passwordHasMatch = await bcrypt.compare(password, userFound?.password || "")

  try {
    if (!userFound || !passwordHasMatch) {
      return res.json({
        ok: false,
        msg: "Credenciales incorrectas"
      })
    } else {

      const newToken = await generateJWT(userFound?.id, userFound?.email);

      return res.json({
        ok: true,
        msg: "Usuario logueado correctamente",
        userInfo: {
          ...userFound,
          password: null,
        },
        token: newToken,
      })
    }

  } catch (error) {
    console.log(error);
    return res.json({
      ok: false,
      msg: "Error al iniciar sesion"
    })
  }
}

export const checkToken = async (req = request, res = response) => {

  try {
    const { token } = req?.body;

    if (!token) {
      throw new Error("El token es invalido")
    }

    const { id, exp } = jwt.verify(token, SECRET_SEED);
    const isExpired = Date.now() >= exp * 1000;
    if (isExpired) {
      throw new Error("El token no es valido")
    }

    const userFound = await getRepository(User).findOneBy({
      id: id,
    })

    return res.json({
      ok: true,
      isValid: true,
      userInfo: {
        ...userFound,
        password: null,
      },
    })

  } catch (error) {
    console.log(error);
    return res.json({
      ok: false,
      isValid: false,
      msg: "Error al checkear el token"
    })
  }
}


export const searchUser = async (req = request, res = response) => {

  try {
    const { query } = req?.query;

    console.log("query is", query)

    const filteredResults = await getRepository(User)
      .createQueryBuilder("user")
      .where("user.name like :name OR user.email like :email", { name: `%${query}%`, email: `%${query}%` })
      .getMany();

    return res.json({
      ok: true,
      results: filteredResults?.map((item) => {
        return {
          ...item,
          password: null,
        }
      }),
    })
  } catch (error) {
    console.log(error);
    return res.json({
      ok: false,
      isValid: false,
      msg: "Error al checkear el token"
    })
  }
}


export const handleChangeUserStatus = async (uid, status) => {
  const user = await getRepository(User).findOneBy({ id: uid });

  if (!user) {
    return new Error("User not found");
  }

  await getRepository(User).update({
    id: uid
  }, {
    ...user,
    isOnline: status,
  })
}


export const changeUserStatus = async (req = request, res = response) => {

  try {
    const { status } = req?.body;
    const { token } = req?.headers;

    const { id } = jwt.verify(token, SECRET_SEED);

    hnadleChangeUserStatus(id, status)

    return res.json({
      ok: true,
      msg: "Estado actualizado"
    })
  } catch (error) {
    console.log(error);
    return res.json({
      ok: false,
      isValid: false,
      msg: "Error al checkear el token"
    })
  }
}


export const handleChangeUserInfo = async (req = request, res = response) => {

  try {
    const { userInfo } = req?.body;
    const { token } = req?.headers;

    const { id } = jwt.verify(token, SECRET_SEED);

    if (!id || !userInfo) {
      return new Error("User not found");
    }
    const user = await getRepository(User).findOneBy({ id: id });

    await getRepository(User).update({
      id: id
    }, {
      ...user,
      ...userInfo,
    })

    return res.json({
      ok: true,
      msg: "Usuario actualizado"
    })
  } catch (error) {
    return res.json({
      ok: false,
      isValid: false,
      msg: "Error al checkear el token"
    })
  }
}


const loadContactsFromToken = async (token) => {
  const { id: meUserId } = jwt.verify(token, SECRET_SEED);

  if (!meUserId) {
    throw new Error("El id de el usuario es invalido")
  }

  const newListOfContacts = await getRepository("friendsDate").createQueryBuilder("friendsDate").where("friendsDate.usersId_1 = :usersId_1", { usersId_1: meUserId }).getRawMany();

  const contactsList = await Promise.all(newListOfContacts?.map(async (item) => {
    const userId = item?.friends_usersId_2;
    const userInfo = await getRepository(User).findOneBy({ id: userId })
    return {
      ...userInfo,
      password: null,
    };
  }))

  return contactsList;
}

const loadSolicitudesDeAmistad = async (token) => {
  const { id: meUserId } = jwt.verify(token, SECRET_SEED);

  if (!meUserId) {
    throw new Error("El id de el usuario es invalido")
  }

  const meListOfRequestlyUsers = await getRepository("friendsDate").query(`SELECT * FROM friendsdate AS fd WHERE fd.usersId_2=${meUserId} and not EXISTS(SELECT * FROM friendsdate WHERE usersId_1=${meUserId} )`);

  const contactsList = await Promise.all(meListOfRequestlyUsers?.map(async (item) => {
    const userId = item?.usersId_1;
    const userInfo = await getRepository(User).findOneBy({ id: userId })
    return {
      ...userInfo,
      password: null,
      ...item,
    };
  }))

  return contactsList;
}

export const loadRequestlyFriends = async (req = request, res = response) => {

  try {
    const { token } = req?.headers;

    const contactsList = await loadSolicitudesDeAmistad(token);

    return res.json({
      ok: true,
      contacts: contactsList
    })
  } catch (error) {
    return res.json({
      ok: false,
      isValid: false,
      msg: error?.message
    })
  }
}

export const loadContacts = async (req = request, res = response) => {

  try {
    const { token } = req?.headers;

    const contactsList = await loadContactsFromToken(token);

    return res.json({
      ok: true,
      contacts: contactsList
    })
  } catch (error) {
    return res.json({
      ok: false,
      isValid: false,
      msg: error?.message
    })
  }
}

export const addContact = async (req = request, res = response) => {

  try {
    const { userData } = req?.body;
    const { token } = req?.headers;

    if (!userData) {
      throw new Error("Error al agregar un contacto")
    }

    const { id: meUserId } = jwt.verify(token, SECRET_SEED);
    const newContactId = userData?.id;

    if (!meUserId || !newContactId) {
      throw new Error("El id de el usuario es invalido")
    }

    const alreadyAdded = await getRepository("friendsDate").createQueryBuilder("friendsDate").where("friendsDate.usersId_1 = :usersId_1 AND friendsDate.usersId_2 = :usersId_2", { usersId_1: meUserId, usersId_2: newContactId }).getCount()

    if (alreadyAdded >= 1) {
      const response = await getRepository("friendsDate").createQueryBuilder("friendsDate").delete().where("friendsDate.usersId_1 = :usersId_1 AND friendsDate.usersId_2 = :usersId_2", { usersId_1: meUserId, usersId_2: newContactId }).execute();
    } else {
      await getRepository(User)
        .createQueryBuilder("friendsDate").insert().into("friendsDate").values([
          {
            usersId_1: meUserId,
            usersId_2: newContactId,
          },
        ]).execute();
    }

    const newContactsList = await loadContactsFromToken(token);
    return res.json({
      ok: true,
      contacts: newContactsList,
    })
  } catch (error) {
    return res.json({
      ok: false,
      isValid: false,
      msg: error?.message
    })
  }
}


export const acceptContactOrDelete = async (req = request, res = response) => {

  try {
    const { usersId_2, usersId_1, accept } = req?.body;
    const { token } = req?.headers;

    if (!usersId_2 || !usersId_1) {
      throw new Error("El id de el usuario es invalido")
    }

    if (!accept) {
      await getRepository("friendsDate").createQueryBuilder("friendsDate").delete().where("friendsDate.usersId_1 = :usersId_1 AND friendsDate.usersId_2 = :usersId_2", { usersId_1: usersId_1, usersId_2: usersId_2 }).execute();
    } else {
      await getRepository(User)
        .createQueryBuilder("friendsDate").insert().into("friendsDate").values([
          {
            usersId_1: usersId_2,
            usersId_2: usersId_1,
          },
        ]).execute();
    }

    const newContactsList = await loadContactsFromToken(token);
    return res.json({
      ok: true,
      newContacts: newContactsList,
    })
  } catch (error) {
    return res.json({
      ok: false,
      isValid: false,
      msg: error?.message
    })
  }
}