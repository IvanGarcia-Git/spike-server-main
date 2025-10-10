import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import { DashboardService } from '../services/dashboard.service';

const router = express.Router();
const dashboardService = new DashboardService();

// Middleware de autenticación para todas las rutas
router.use(authenticateJWT);

/**
 * GET /agentes/:id
 * Obtiene el perfil completo de un agente
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    const profile = await dashboardService.getUserProfile(userId);

    // Verificar que el usuario es un agente
    if (profile.role !== 'agente') {
      return res.status(404).json({ message: 'Agente no encontrado' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error getting agente profile:', error);
    res.status(500).json({ message: 'Error obteniendo perfil de agente' });
  }
});

export default router;
