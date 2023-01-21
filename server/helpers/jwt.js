import jwt from "jsonwebtoken";

export const SECRET_SEED = "SDA12DA"
// process.env.SECRET_JWT_SEED

export const generateJWT = (id, name) => {
    return new Promise((resolve, reject) => {
        const payload = { id, name };
        jwt.sign(payload, SECRET_SEED, {
            expiresIn: "2h"
        }, (err, token) => {
            if (err) {
                console.log(err)
                reject("No se pudo generar el token");
            }
            resolve(token)
        })
    })

}