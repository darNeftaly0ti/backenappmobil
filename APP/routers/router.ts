import { Router } from 'express';
import { authController } from '../controllers/controller';
import { activityLogController } from '../controllers/activity_logs';
import { smartOLTController } from '../controllers/smartOLT/getconsumer';
import { base64PhotoController } from '../controllers/smartOLT/b64photo';
import { createUserController } from '../controllers/backoffi/createuser';
import { createAlertController } from '../controllers/backoffi/createalerts';

// Crear instancia del router
const router = Router();

// Rutas de autenticación
router.post('/login', authController.login); // POST /api/users/login

// Rutas de creación de usuarios (deben ir antes de las rutas genéricas /:id)
router.post('/create', createUserController.createUser); // POST /api/users/create
router.post('/create-minimal', createUserController.createUserMinimal); // POST /api/users/create-minimal
router.get('/create/health', createUserController.healthCheck); // GET /api/users/create/health

// Rutas de notificaciones/alertas (deben ir antes de las rutas genéricas /:id)
// IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas genéricas
router.post('/alerts', createAlertController.createAlert); // POST /api/users/alerts
router.get('/alerts/health', createAlertController.healthCheck); // GET /api/users/alerts/health
router.patch('/alerts/mark-all-read', createAlertController.markAllAsRead); // PATCH /api/users/alerts/mark-all-read
router.put('/alerts/mark-all-read', createAlertController.markAllAsRead); // PUT /api/users/alerts/mark-all-read
router.get('/alerts/:userId/unread-count', createAlertController.getUnreadCount); // GET /api/users/alerts/:userId/unread-count
router.patch('/alerts/:alertId/mark-read', createAlertController.markAsRead); // PATCH /api/users/alerts/:alertId/mark-read
router.put('/alerts/:alertId/mark-read', createAlertController.markAsRead); // PUT /api/users/alerts/:alertId/mark-read
router.delete('/alerts/:alertId', createAlertController.deleteAlert); // DELETE /api/users/alerts/:alertId
router.get('/alerts/:userId', createAlertController.getUserAlerts); // GET /api/users/alerts/:userId (debe ir al final)

// Ruta de prueba para verificar que el router funciona (debe ir antes de /:id)
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Router funcionando correctamente',
    timestamp: new Date().toISOString()
  });
}); // GET /api/users/health

// Rutas de usuarios
// NOTA: El servidor ya tiene el prefijo '/api/users', así que estas rutas son relativas a ese prefijo
// IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas genéricas (/:id)
router.get('/email/:email', authController.getUserByEmail); // GET /api/users/email/:email
router.get('/:id', authController.getUserById); // GET /api/users/:id
router.put('/:id', authController.updateUser); // PUT /api/users/:id
router.delete('/:id', authController.deleteUser); // DELETE /api/users/:id
router.get('/', authController.getAllUsers); // GET /api/users (debe ir al final)

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

// Rutas de SmartOLT (consumo)
router.get('/smartolt/consumption/:userId', smartOLTController.getConsumption);
router.get('/smartolt/consumption/onu/:onuSn', smartOLTController.getConsumptionByONU);

// Rutas de SmartOLT (imágenes en Base64 - el backend obtiene la imagen de SmartOLT y la convierte a Base64)
router.get('/smartolt/image/user/:userId', base64PhotoController.getImageByUserId); // GET /api/users/smartolt/image/user/:userId?graphType=daily
router.get('/smartolt/image/onu/:onuSn', base64PhotoController.getImageByONU); // GET /api/users/smartolt/image/onu/:onuSn?graphType=daily

export default router;
