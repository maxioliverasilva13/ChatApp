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