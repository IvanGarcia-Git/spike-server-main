import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import { DashboardService } from '../services/dashboard.service';

const router = express.Router();
const dashboardService = new DashboardService();

router.use(authenticateJWT);

/**
 * GET /:role/:id
 * Obtiene el perfil completo de un usuario según su rol
 * @param role - 'agente' | 'colaborador'
 * @param id - ID del usuario
 */
router.get('/:role/:id', async (req: Request, res: Response) => {
  try {
    const { role, id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    const validRoles = ['agente', 'colaborador'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    const profile = await dashboardService.getUserProfile(userId);

    if (profile.role !== role) {
      return res.status(404).json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} no encontrado` });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Error obteniendo perfil de usuario' });
  }
});

export default router;
