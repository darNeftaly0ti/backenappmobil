import { Router } from 'express';
import { authController } from '../controllers/controller';
import { activityLogController } from '../controllers/activity_logs';
import { smartOLTController } from '../controllers/smartOLT/getconsumer';
import { base64PhotoController } from '../controllers/smartOLT/b64photo';

// Crear instancia del router
const router = Router();

// Rutas de autenticación
router.post('/login', authController.login); // POST /api/users/login

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

// Rutas de SmartOLT (conversión de imágenes a Base64)
router.post('/smartolt/image/to-base64', base64PhotoController.convertImageToBase64); // POST /api/users/smartolt/image/to-base64
router.get('/smartolt/image/to-base64', base64PhotoController.convertImageToBase64); // GET /api/users/smartolt/image/to-base64?imageUrl=...
router.get('/smartolt/traffic-graph/:uniqueExternalId/to-base64', base64PhotoController.convertTrafficGraphToBase64); // GET /api/users/smartolt/traffic-graph/:uniqueExternalId/to-base64?graphType=daily

export default router;
