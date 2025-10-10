import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import { DashboardService } from '../services/dashboard.service';

const router = express.Router();
const dashboardService = new DashboardService();

// Middleware de autenticación para todas las rutas
router.use(authenticateJWT);

/**
 * GET /colaboradores/:id
 * Obtiene el perfil completo de un colaborador
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    const profile = await dashboardService.getUserProfile(userId);

    // Verificar que el usuario es un colaborador
    if (profile.role !== 'colaborador') {
      return res.status(404).json({ message: 'Colaborador no encontrado' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error getting colaborador profile:', error);
    res.status(500).json({ message: 'Error obteniendo perfil de colaborador' });
  }
});

export default router;
