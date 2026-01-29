/**
 * Definición central de roles y permisos del sistema
 * Aquí se controla qué puede hacer cada tipo de usuario
 */

const ROLES = {
  ADMIN: 'admin',
  LEADER: 'leader',
  USER: 'user' // opcional (solo lectura)
}

const PERMISSIONS = {
  // Admin (Usuario Dios)
  CREATE_LEADER: 'create_leader',
  DELETE_LEADER: 'delete_leader',
  ASSIGN_VOTERS: 'assign_voters',
  VIEW_ALL_STATS: 'view_all_stats',
  RESET_VOTES: 'reset_votes',
  EXPORT_EXCEL: 'export_excel',

  // Líder
  VIEW_OWN_VOTERS: 'view_own_voters',
  UPDATE_VOTE_STATUS: 'update_vote_status',

  // Usuario lectura
  VIEW_ONLY: 'view_only'
}

/**
 * Mapa de permisos por rol
 */
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.CREATE_LEADER,
    PERMISSIONS.DELETE_LEADER,
    PERMISSIONS.ASSIGN_VOTERS,
    PERMISSIONS.VIEW_ALL_STATS,
    PERMISSIONS.RESET_VOTES,
    PERMISSIONS.EXPORT_EXCEL
  ],

  [ROLES.LEADER]: [
    PERMISSIONS.VIEW_OWN_VOTERS,
    PERMISSIONS.UPDATE_VOTE_STATUS
  ],

  [ROLES.USER]: [
    PERMISSIONS.VIEW_ONLY
  ]
}

/**
 * Verifica si un rol tiene un permiso específico
 */
function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission)
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission
}
