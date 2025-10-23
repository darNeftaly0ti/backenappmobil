
import { Request, Response } from 'express';
import { userService, ILoginCredentials } from '../services/services';

// Controlador de autenticación
export class AuthController {
  
  /**
   * Método para hacer login de usuario
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validar que se envíen los datos requeridos
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
        return;
      }

      // Validar formato de email
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Formato de email inválido'
        });
        return;
      }

      // Crear objeto de credenciales
      const credentials: ILoginCredentials = {
        email: email.trim().toLowerCase(),
        password: password
      };

      // Validar login usando el servicio
      const result = await userService.validateLogin(credentials);

      if (result.success) {
        // Login exitoso
        res.status(200).json({
          success: true,
          message: result.message,
          user: {
            _id: result.user?._id,
            username: result.user?.username,
            first_name: result.user?.first_name,
            last_name: result.user?.last_name,
            email: result.user?.email,
            phone_number: result.user?.phone_number,
            account_status: result.user?.account_status,
            plan: result.user?.plan,
            network: result.user?.network,
            devices: result.user?.devices,
            preferences: result.user?.preferences,
            roles: result.user?.roles,
            tags: result.user?.tags,
            last_login: result.user?.last_login,
            verified: result.user?.verified
          }
        });
      } else {
        // Login fallido
        res.status(401).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('Error en el controlador de login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Método para obtener información del usuario por ID
   */
  public async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario es requerido'
        });
        return;
      }

      const user = await userService.findUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number,
          account_status: user.account_status,
          plan: user.plan,
          network: user.network,
          devices: user.devices,
          preferences: user.preferences,
          roles: user.roles,
          tags: user.tags,
          last_login: user.last_login,
          verified: user.verified,
          created_on: user.created_on
        }
      });

    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Método para obtener información del usuario por email
   */
  public async getUserByEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email es requerido'
        });
        return;
      }

      const user = await userService.findUserByEmail(email);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone_number: user.phone_number,
          account_status: user.account_status,
          plan: user.plan,
          network: user.network,
          devices: user.devices,
          preferences: user.preferences,
          roles: user.roles,
          tags: user.tags,
          last_login: user.last_login,
          verified: user.verified,
          created_on: user.created_on
        }
      });

    } catch (error) {
      console.error('Error al obtener usuario por email:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Método para obtener todos los usuarios (solo para administradores)
   */
  public async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.getAllUsers();

      res.status(200).json({
        success: true,
        users: users,
        total: users.length
      });

    } catch (error) {
      console.error('Error al obtener todos los usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Método para actualizar información del usuario
   */
  public async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario es requerido'
        });
        return;
      }

      // No permitir actualizar campos sensibles
      delete updateData.password;
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      const updatedUser = await userService.updateUser(id, updateData);

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        user: {
          _id: updatedUser._id,
          username: updatedUser.username,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          email: updatedUser.email,
          phone_number: updatedUser.phone_number,
          account_status: updatedUser.account_status,
          plan: updatedUser.plan,
          network: updatedUser.network,
          devices: updatedUser.devices,
          preferences: updatedUser.preferences,
          roles: updatedUser.roles,
          tags: updatedUser.tags,
          last_login: updatedUser.last_login,
          verified: updatedUser.verified,
          updated_on: updatedUser.updated_on
        }
      });

    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Método para eliminar usuario
   */
  public async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario es requerido'
        });
        return;
      }

      const deleted = await userService.deleteUser(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

// Exportar instancia del controlador
export const authController = new AuthController();