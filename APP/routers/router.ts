import { Router } from 'express';
import { authController } from '../controllers/controller';

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

export default router;
