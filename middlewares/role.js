/**
 * Middleware de control por rol
 * Permite acceso solo al rol indicado
 */

module.exports = (requiredRole) => {
  return (req, res, next) => {

    if (!req.session || !req.session.user) {
      return res.status(401).json({
        error: 'No autenticado'
      })
    }

    const userRole = req.session.user.role

    if (userRole !== requiredRole) {
      return res.status(403).json({
        error: 'Acceso denegado'
      })
    }

    next()
  }
}
