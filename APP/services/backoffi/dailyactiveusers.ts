import mongoose from 'mongoose';
import { IActivityLog } from '../activity_logs';

// Importar el servicio de activity_logs para asegurar que el modelo esté registrado
import '../activity_logs';

// Interfaces para los datos de Daily Active Users
export interface IDailyActiveUserData {
  date: string; // YYYY-MM-DD
  active_users: number;
  new_logins: number;
  returning_users: number;
  total_logins: number;
  total_logouts: number;
  peak_hour?: number; // Hora pico del día (0-23)
  avg_session_duration_minutes?: number; // Duración promedio de sesión en minutos
}

export interface IDailyActiveUsersResponse {
  success: boolean;
  message: string;
  data: IDailyActiveUserData[];
  summary?: {
    total_days: number;
    average_daily_active_users: number;
    peak_day: string;
    peak_active_users: number;
    total_active_users: number; // Usuarios únicos en todo el período
  };
}

export interface IDetailedUserData {
  user_id: string;
  username: string;
  email: string;
  first_login: string; // ISO string
  last_login: string; // ISO string
  last_logout?: string; // ISO string (puede no existir si la sesión está activa)
  login_count: number;
  logout_count: number;
  session_duration_minutes?: number; // Duración de sesión en minutos
  is_active: boolean; // true si último login > último logout (sesión activa)
}

export interface IDailyActiveUsersDetailedResponse {
  success: boolean;
  message: string;
  date: string;
  data: {
    active_users: number;
    users: IDetailedUserData[];
  };
}

// Clase de servicio para Daily Active Users
export class DailyActiveUsersService {
  private static instance: DailyActiveUsersService;

  private constructor() {}

  public static getInstance(): DailyActiveUsersService {
    if (!DailyActiveUsersService.instance) {
      DailyActiveUsersService.instance = new DailyActiveUsersService();
    }
    return DailyActiveUsersService.instance;
  }

  /**
   * Obtener el modelo ActivityLog de mongoose
   */
  private getActivityLogModel(): mongoose.Model<IActivityLog> {
    return mongoose.model<IActivityLog>('ActivityLog');
  }

  /**
   * Obtener usuarios activos diarios usando agregación de MongoDB
   * @param startDate Fecha de inicio (opcional, formato YYYY-MM-DD o Date)
   * @param endDate Fecha de fin (opcional, formato YYYY-MM-DD o Date)
   * @param groupBy Agrupar por período: 'day' | 'week' | 'month' (por ahora solo 'day')
   */
  public async getDailyActiveUsers(
    startDate?: string | Date,
    endDate?: string | Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<IDailyActiveUsersResponse> {
    try {
      // Obtener el modelo ActivityLog
      const ActivityLog = this.getActivityLogModel();

      // Preparar fechas
      const start = startDate 
        ? (startDate instanceof Date ? startDate : new Date(startDate + 'T00:00:00.000Z'))
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Últimos 30 días por defecto
      
      const end = endDate
        ? (endDate instanceof Date ? endDate : new Date(endDate + 'T23:59:59.999Z'))
        : new Date(); // Hasta hoy por defecto

      // Validar que startDate < endDate
      if (start > end) {
        throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
      }

      // Pipeline de agregación optimizado para MongoDB
      const pipeline: any[] = [
        // Match: Filtrar solo logs de login y logout exitosos
        {
          $match: {
            action: { $in: ['login', 'logout'] },
            status: 'success',
            timestamp: {
              $gte: start,
              $lte: end
            }
          }
        },
        // Project: Extraer fecha y preparar datos
        {
          $project: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timestamp',
                timezone: 'UTC'
              }
            },
            hour: {
              $hour: '$timestamp'
            },
            user_id: { $toString: '$user_id' },
            username: 1,
            email: 1,
            action: 1,
            timestamp: 1
          }
        },
        // Group: Agrupar por fecha y usuario
        {
          $group: {
            _id: {
              date: '$date',
              user_id: '$user_id'
            },
            username: { $first: '$username' },
            email: { $first: '$email' },
            logins: {
              $sum: { $cond: [{ $eq: ['$action', 'login'] }, 1, 0] }
            },
            logouts: {
              $sum: { $cond: [{ $eq: ['$action', 'logout'] }, 1, 0] }
            },
            first_login: {
              $min: {
                $cond: [{ $eq: ['$action', 'login'] }, '$timestamp', null]
              }
            },
            last_login: {
              $max: {
                $cond: [{ $eq: ['$action', 'login'] }, '$timestamp', null]
              }
            },
            last_logout: {
              $max: {
                $cond: [{ $eq: ['$action', 'logout'] }, '$timestamp', null]
              }
            },
            login_hours: {
              $push: {
                $cond: [{ $eq: ['$action', 'login'] }, '$hour', null]
              }
            }
          }
        },
        // Group: Agrupar por fecha para obtener métricas diarias
        {
          $group: {
            _id: '$_id.date',
            active_users: { $sum: 1 }, // Contar usuarios únicos por día
            total_logins: { $sum: '$logins' },
            total_logouts: { $sum: '$logouts' },
            users: {
              $push: {
                user_id: '$_id.user_id',
                username: '$username',
                email: '$email',
                logins: '$logins',
                logouts: '$logouts',
                first_login: '$first_login',
                last_login: '$last_login',
                last_logout: '$last_logout',
                login_hours: {
                  $filter: {
                    input: '$login_hours',
                    as: 'hour',
                    cond: { $ne: ['$$hour', null] }
                  }
                }
              }
            }
          }
        },
        // Sort: Ordenar por fecha ascendente
        {
          $sort: { _id: 1 }
        },
        // Project: Calcular métricas adicionales
        {
          $project: {
            date: '$_id',
            active_users: 1,
            total_logins: 1,
            total_logouts: 1,
            users: 1,
            // Calcular hora pico (hora con más logins)
            peak_hour: {
              $arrayElemAt: [
                {
                  $map: {
                    input: {
                      $slice: [
                        {
                          $sortArray: {
                            input: {
                              $reduce: {
                                input: '$users',
                                initialValue: [],
                                in: {
                                  $concatArrays: [
                                    '$$value',
                                    '$$this.login_hours'
                                  ]
                                }
                              }
                            },
                            sortBy: 1
                          }
                        },
                        -1,
                        1
                      ]
                    },
                    as: 'hour',
                    in: '$$hour'
                  }
                },
                0
              ]
            }
          }
        }
      ];

      // Ejecutar agregación
      const dailyData = await ActivityLog.aggregate(pipeline);

      // Procesar resultados y calcular métricas adicionales
      const allUsersSet = new Set<string>(); // Para usuarios únicos en todo el período
      const result: IDailyActiveUserData[] = [];
      const previousDayUsers = new Set<string>(); // Para calcular returning users

      for (const day of dailyData) {
        const dayUsers = new Set<string>();
        let newLogins = 0;
        let totalSessionDuration = 0;
        let sessionCount = 0;

        // Procesar usuarios del día
        for (const user of day.users) {
          dayUsers.add(user.user_id);
          allUsersSet.add(user.user_id);

          // Calcular si es nuevo login (no estaba en el día anterior)
          if (!previousDayUsers.has(user.user_id)) {
            newLogins++;
          }

          // Calcular duración de sesión si hay login y logout
          if (user.last_login && user.last_logout) {
            const duration = (new Date(user.last_logout).getTime() - new Date(user.last_login).getTime()) / (1000 * 60); // minutos
            if (duration > 0) {
              totalSessionDuration += duration;
              sessionCount++;
            }
          }
        }

        const returningUsers = day.active_users - newLogins;
        const avgSessionDuration = sessionCount > 0 ? Math.round(totalSessionDuration / sessionCount) : undefined;

        result.push({
          date: day.date,
          active_users: day.active_users,
          new_logins: newLogins,
          returning_users: returningUsers,
          total_logins: day.total_logins,
          total_logouts: day.total_logouts,
          peak_hour: day.peak_hour !== null && day.peak_hour !== undefined ? day.peak_hour : undefined,
          avg_session_duration_minutes: avgSessionDuration
        });

        // Actualizar usuarios del día anterior para el siguiente día
        previousDayUsers.clear();
        dayUsers.forEach(userId => previousDayUsers.add(userId));
      }

      // Calcular resumen
      const totalDays = result.length;
      const totalActiveUsers = allUsersSet.size;
      const averageDAU = totalDays > 0 
        ? Math.round((result.reduce((sum, day) => sum + day.active_users, 0) / totalDays) * 100) / 100
        : 0;

      let peakDay = '';
      let peakActiveUsers = 0;
      if (result.length > 0) {
        const peak = result.reduce((max, day) => 
          day.active_users > max.active_users ? day : max
        , result[0]);
        peakDay = peak.date;
        peakActiveUsers = peak.active_users;
      }

      return {
        success: true,
        message: 'Usuarios activos diarios obtenidos exitosamente',
        data: result,
        summary: {
          total_days: totalDays,
          average_daily_active_users: averageDAU,
          peak_day: peakDay,
          peak_active_users: peakActiveUsers,
          total_active_users: totalActiveUsers
        }
      };

    } catch (error: any) {
      console.error('Error al obtener usuarios activos diarios:', error);
      throw new Error(error.message || 'Error interno del servidor al obtener usuarios activos diarios');
    }
  }

  /**
   * Obtener detalles de usuarios activos para una fecha específica
   * @param date Fecha específica (formato YYYY-MM-DD)
   * @param includeUserDetails Si incluir detalles de cada usuario
   */
  public async getDailyActiveUsersDetailed(
    date: string,
    includeUserDetails: boolean = true
  ): Promise<IDailyActiveUsersDetailedResponse> {
    try {
      // Obtener el modelo ActivityLog
      const ActivityLog = this.getActivityLogModel();

      if (!date) {
        throw new Error('La fecha es requerida');
      }

      // Preparar fechas (inicio y fin del día)
      const start = new Date(date + 'T00:00:00.000Z');
      const end = new Date(date + 'T23:59:59.999Z');

      // Pipeline de agregación para obtener detalles
      const pipeline: any[] = [
        // Match: Filtrar logs del día específico
        {
          $match: {
            action: { $in: ['login', 'logout'] },
            status: 'success',
            timestamp: {
              $gte: start,
              $lte: end
            }
          }
        },
        // Project: Preparar datos
        {
          $project: {
            user_id: { $toString: '$user_id' },
            username: 1,
            email: 1,
            action: 1,
            timestamp: 1
          }
        },
        // Group: Agrupar por usuario
        {
          $group: {
            _id: '$user_id',
            username: { $first: '$username' },
            email: { $first: '$email' },
            logins: {
              $sum: { $cond: [{ $eq: ['$action', 'login'] }, 1, 0] }
            },
            logouts: {
              $sum: { $cond: [{ $eq: ['$action', 'logout'] }, 1, 0] }
            },
            first_login: {
              $min: {
                $cond: [{ $eq: ['$action', 'login'] }, '$timestamp', null]
              }
            },
            last_login: {
              $max: {
                $cond: [{ $eq: ['$action', 'login'] }, '$timestamp', null]
              }
            },
            last_logout: {
              $max: {
                $cond: [{ $eq: ['$action', 'logout'] }, '$timestamp', null]
              }
            }
          }
        },
        // Project: Formatear datos de usuario
        {
          $project: {
            user_id: '$_id',
            username: 1,
            email: 1,
            first_login: {
              $cond: [
                { $ne: ['$first_login', null] },
                { $dateToString: { date: '$first_login', format: '%Y-%m-%dT%H:%M:%S.%LZ' } },
                null
              ]
            },
            last_login: {
              $cond: [
                { $ne: ['$last_login', null] },
                { $dateToString: { date: '$last_login', format: '%Y-%m-%dT%H:%M:%S.%LZ' } },
                null
              ]
            },
            last_logout: {
              $cond: [
                { $ne: ['$last_logout', null] },
                { $dateToString: { date: '$last_logout', format: '%Y-%m-%dT%H:%M:%S.%LZ' } },
                null
              ]
            },
            login_count: '$logins',
            logout_count: '$logouts',
            // Calcular si está activo (último login > último logout o no tiene logout)
            is_active: {
              $or: [
                { $eq: ['$last_logout', null] },
                { $gt: ['$last_login', '$last_logout'] }
              ]
            },
            // Calcular duración de sesión en minutos
            session_duration_minutes: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$last_login', null] },
                    { $ne: ['$last_logout', null] },
                    { $gt: ['$last_login', '$last_logout'] }
                  ]
                },
                {
                  $divide: [
                    { $subtract: ['$last_logout', '$last_login'] },
                    60000 // Convertir de ms a minutos
                  ]
                },
                null
              ]
            }
          }
        },
        // Sort: Ordenar por último login descendente
        {
          $sort: { last_login: -1 }
        }
      ];

      // Ejecutar agregación
      const usersData = await ActivityLog.aggregate(pipeline);

      // Formatear respuesta
      const detailedUsers: IDetailedUserData[] = usersData.map((user: any) => ({
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        first_login: user.first_login || '',
        last_login: user.last_login || '',
        last_logout: user.last_logout || undefined,
        login_count: user.login_count,
        logout_count: user.logout_count,
        session_duration_minutes: user.session_duration_minutes ? Math.round(user.session_duration_minutes) : undefined,
        is_active: user.is_active
      }));

      return {
        success: true,
        message: 'Detalles de usuarios activos obtenidos exitosamente',
        date: date,
        data: {
          active_users: detailedUsers.length,
          users: includeUserDetails ? detailedUsers : []
        }
      };

    } catch (error: any) {
      console.error('Error al obtener detalles de usuarios activos:', error);
      throw new Error(error.message || 'Error interno del servidor al obtener detalles de usuarios activos');
    }
  }
}

// Exportar instancia singleton del servicio
export const dailyActiveUsersService = DailyActiveUsersService.getInstance();

