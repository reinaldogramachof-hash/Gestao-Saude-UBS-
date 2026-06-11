/**
 * HOOK DE AUTENTICAÇÃO (hooks/useAuth.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * FUNÇÃO: Atalho para acessar o AuthContext de qualquer componente.
 *         Em vez de escrever useContext(AuthContext) em todo lugar,
 *         basta importar e chamar useAuth().
 *
 * COMO USAR em qualquer componente:
 *   import { useAuth } from '../../hooks/useAuth';
 *   const { user, login, logout, isAuthenticated } = useAuth();
 * ─────────────────────────────────────────────────────────────────────────────
 */
export { useAuth } from '../contexts/AuthContext';
