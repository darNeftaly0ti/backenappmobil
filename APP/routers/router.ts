import { Router } from 'express';
import { authController } from '../controllers/controller';
import { activityLogController } from '../controllers/activity_logs';

// Crear instancia del router
const router = Router();

// Rutas de autenticación
router.post('/login', authController.login);

// Rutas de usuarios
router.get('/users', authController.getAllUsers);
router.get('/users/:id', authController.getUserById);
router.get('/users/email/:email', authController.getUserByEmail);
router.put('/users/:id', authController.updateUser);
router.delete('/users/:id', authController.deleteUser);

// Ruta de prueba para verificar que el router funciona
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Router funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Rutas de logs de actividad
router.post('/activity-logs', activityLogController.createActivityLog);
router.get('/activity-logs', activityLogController.getAllActivityLogs);
router.get('/activity-logs/health', activityLogController.healthCheck);
router.get('/activity-logs/stats', activityLogController.getActivityStats);
router.get('/activity-logs/user/:userId', activityLogController.getActivityLogsByUser);
router.get('/activity-logs/action/:action', activityLogController.getActivityLogsByAction);
router.get('/activity-logs/severity/:severity', activityLogController.getActivityLogsBySeverity);
router.get('/activity-logs/search/:searchText', activityLogController.searchActivityLogs);
router.get('/activity-logs/:id', activityLogController.getActivityLogById);
router.post('/activity-logs/cleanup', activityLogController.deleteOldLogs);

export default router;
