import { Request, Response } from 'express';
import { createUserService, ICreateUserData } from '../../services/backoffi/createuser';

// Controlador para creación de usuarios
export class CreateUserController {
  
  /**
   * Método para crear un nuevo usuario
   * POST /api/users/create o POST /api/backoffi/create-user
   */
  public async createUser(req: Request, res: Response): Promise<void> {
    try {
      // Obtener datos del body
      const userData: ICreateUserData = req.body;

      // Obtener IP de origen desde el request
      const ipOrigin = req.ip || 
                      req.headers['x-forwarded-for']?.toString().split(',')[0] || 
                      req.headers['x-real-ip']?.toString() || 
                      req.connection.remoteAddress || 
                      '127.0.0.1';

      // Validar que se envíen los datos mínimos requeridos
      if (!userData.username || !userData.first_name || !userData.last_name || 
          !userData.email || !userData.phone_number || !userData.password) {
        res.status(400).json({
          success: false,
          message: 'Campos requeridos faltantes: username, first_name, last_name, email, phone_number, password'
        });
        return;
      }

      // Crear usuario usando el servicio
      const result = await createUserService.createUser(userData, ipOrigin);

      if (result.success && result.user) {
        // Usuario creado exitosamente
        res.status(201).json({
          success: true,
          message: result.message,
          user: {
            _id: result.user._id,
            username: result.user.username,
            first_name: result.user.first_name,
            last_name: result.user.last_name,
            email: result.user.email,
            phone_number: result.user.phone_number,
            account_status: result.user.account_status,
            ONU_sn: result.user.ONU_sn,
            olt_name: result.user.olt_name,
            onu_port: result.user.onu_port,
            olt_id: result.user.olt_id,
            board: result.user.board,
            port: result.user.port,
            zone: result.user.zone,
            plan: result.user.plan,
            network: result.user.network,
            devices: result.user.devices,
            preferences: result.user.preferences,
            roles: result.user.roles,
            tags: result.user.tags,
            verified: result.user.verified,
            created_on: result.user.created_on,
            activity_log: result.user.activity_log
          }
        });
      } else {
        // Error al crear usuario
        // Determinar código de estado apropiado según el tipo de error
        let statusCode = 400;
        
        if (result.message.includes('Ya existe')) {
          statusCode = 409; // Conflict
        } else if (result.message.includes('Error interno')) {
          statusCode = 500;
        } else if (result.message.includes('Error de validación')) {
          statusCode = 422; // Unprocessable Entity
        }

        res.status(statusCode).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('Error en el controlador de creación de usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al crear usuario'
      });
    }
  }

  /**
   * Método para crear usuario con datos mínimos
   * POST /api/users/create-minimal
   */
  public async createUserMinimal(req: Request, res: Response): Promise<void> {
    try {
      const { username, first_name, last_name, email, phone_number, password } = req.body;

      // Validar que se envíen todos los campos requeridos
      if (!username || !first_name || !last_name || !email || !phone_number || !password) {
        res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos: username, first_name, last_name, email, phone_number, password'
        });
        return;
      }

      // Obtener IP de origen
      const ipOrigin = req.ip || 
                      req.headers['x-forwarded-for']?.toString().split(',')[0] || 
                      req.headers['x-real-ip']?.toString() || 
                      req.connection.remoteAddress || 
                      '127.0.0.1';

      // Crear usuario usando el servicio
      const result = await createUserService.createUserMinimal(
        username,
        first_name,
        last_name,
        email,
        phone_number,
        password,
        ipOrigin
      );

      if (result.success && result.user) {
        // Usuario creado exitosamente
        res.status(201).json({
          success: true,
          message: result.message,
          user: {
            _id: result.user._id,
            username: result.user.username,
            first_name: result.user.first_name,
            last_name: result.user.last_name,
            email: result.user.email,
            phone_number: result.user.phone_number,
            account_status: result.user.account_status,
            verified: result.user.verified,
            roles: result.user.roles,
            tags: result.user.tags,
            created_on: result.user.created_on
          }
        });
      } else {
        // Error al crear usuario
        let statusCode = 400;
        
        if (result.message.includes('Ya existe')) {
          statusCode = 409; // Conflict
        } else if (result.message.includes('Error interno')) {
          statusCode = 500;
        }

        res.status(statusCode).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('Error en el controlador de creación mínima de usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al crear usuario'
      });
    }
  }

  /**
   * Health check del controlador
   */
  public async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        message: 'Controlador de creación de usuarios funcionando correctamente',
        timestamp: new Date().toISOString(),
        controller: 'CreateUserController',
        version: '1.0.0'
      });
    } catch (error) {
      console.error('Error en health check:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el controlador de creación de usuarios'
      });
    }
  }
}

// Exportar instancia del controlador
export const createUserController = new CreateUserController();

