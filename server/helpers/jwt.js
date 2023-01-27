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


export const validateJwt = async (req, res, next) => {

    try {
        const { token } = req?.headers;

        if (!token) {
            throw new Error("El token es invalido")
        }

        const { id, exp } = jwt.verify(token, SECRET_SEED);
        const isExpired = Date.now() >= exp * 1000;
        if (isExpired) {
            throw new Error("El token no es valido")
        }

        next();
    } catch (error) {
        return res.json({
            ok: false,
            isValid: false,
            msg: "Error al checkear el token"
        })
    }
}