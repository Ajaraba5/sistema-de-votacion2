/**
 * Middleware de autenticación
 * Verifica si hay una sesión activa
 */

module.exports = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: 'No autenticado'
    })
  }

  next()
}
