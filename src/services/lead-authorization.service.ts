import { dataSource } from "../../app-data-source";
import { GroupCampaign } from "../models/group-campaign.entity";
import { GroupUser } from "../models/group-user.entity";
import { Lead } from "../models/lead.entity";
import { LeadCall } from "../models/lead-call.entity";
import { LeadQueue } from "../models/lead-queue.entity";
import { User } from "../models/user.entity";
import { In, Not } from "typeorm";

/**
 * Acciones posibles sobre leads
 */
export enum LeadAction {
  VIEW = "view",
  EDIT = "edit",
  DELETE = "delete",
  REASSIGN = "reassign",
  TYPE = "type",
  MANAGE_CALLS = "manage_calls",
  MANAGE_DOCUMENTS = "manage_documents",
  MANAGE_QUEUE = "manage_queue",
}

/**
 * Contexto del usuario para autorización
 */
export interface UserAuthContext {
  userId: number;
  groupId: number;
  parentGroupId?: number;
  isManager: boolean;
}

/**
 * Resultado de autorización
 */
export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
}

const SUPER_ADMIN_GROUP_ID = 1;

/**
 * Servicio centralizado de autorización para leads.
 *
 * Reglas de permisos:
 * - Admin (groupId === 1): Acceso total a todas las acciones sobre todos los leads
 * - Manager: Puede ver/gestionar leads de campañas asociadas a sus grupos y descendientes
 * - Usuario regular: Solo puede gestionar el lead que tiene asignado actualmente o en su cola
 *
 * Superposición de permisos (cuando usuario pertenece a varios grupos):
 * - Admin siempre tiene acceso total
 * - Para el resto, gana el permiso MÁS RESTRICTIVO
 */
export module LeadAuthorizationService {
  /**
   * Verifica si un usuario puede realizar una acción sobre un lead específico.
   * Esta es la función principal que debe usarse en todos los controladores.
   */
  export const canPerformAction = async (
    userContext: UserAuthContext,
    leadId: number,
    action: LeadAction
  ): Promise<AuthorizationResult> => {
    try {
      // Admin siempre tiene acceso total
      if (userContext.groupId === SUPER_ADMIN_GROUP_ID) {
        return { allowed: true };
      }

      const lead = await dataSource.getRepository(Lead).findOne({
        where: { id: leadId },
        relations: { user: true, campaign: true },
      });

      if (!lead) {
        return { allowed: false, reason: "lead-not-found" };
      }

      // Obtener todos los grupos del usuario
      const userGroups = await getUserGroups(userContext.userId);
      const groupIds = [userContext.groupId, ...userGroups.map((g) => g.groupId)];

      // Verificar según la acción solicitada
      switch (action) {
        case LeadAction.VIEW:
          return await canViewLead(userContext, lead, groupIds);

        case LeadAction.EDIT:
          return await canEditLead(userContext, lead, groupIds);

        case LeadAction.DELETE:
          // Solo Admin puede borrar leads
          return {
            allowed: false,
            reason: "only-admin-can-delete-leads",
          };

        case LeadAction.REASSIGN:
          return await canReassignLead(userContext, lead, groupIds);

        case LeadAction.TYPE:
          return await canTypeLead(userContext, lead, groupIds);

        case LeadAction.MANAGE_CALLS:
          return await canManageLeadCalls(userContext, lead, groupIds);

        case LeadAction.MANAGE_DOCUMENTS:
          return await canManageLeadDocuments(userContext, lead, groupIds);

        case LeadAction.MANAGE_QUEUE:
          return await canManageLeadQueue(userContext, lead, groupIds);

        default:
          return { allowed: false, reason: "unknown-action" };
      }
    } catch (error) {
      console.error("Error checking lead authorization:", error);
      return { allowed: false, reason: "authorization-error" };
    }
  };

  /**
   * Verifica si un usuario puede realizar una acción sobre un lead por UUID.
   */
  export const canPerformActionByUuid = async (
    userContext: UserAuthContext,
    leadUuid: string,
    action: LeadAction
  ): Promise<AuthorizationResult> => {
    const lead = await dataSource.getRepository(Lead).findOne({
      where: { uuid: leadUuid },
    });

    if (!lead) {
      return { allowed: false, reason: "lead-not-found" };
    }

    return canPerformAction(userContext, lead.id, action);
  };

  /**
   * Verifica si el usuario puede ver un lead específico.
   *
   * Reglas:
   * - Manager: puede ver leads de campañas de sus grupos
   * - Usuario regular: solo puede ver leads asignados a él o en su cola
   */
  const canViewLead = async (
    userContext: UserAuthContext,
    lead: Lead,
    groupIds: number[]
  ): Promise<AuthorizationResult> => {
    // Si el usuario tiene este lead asignado actualmente
    if (lead.user?.id === userContext.userId) {
      return { allowed: true };
    }

    // Si el lead está en la cola del usuario
    const inQueue = await dataSource.getRepository(LeadQueue).findOne({
      where: { leadId: lead.id, userId: userContext.userId },
    });
    if (inQueue) {
      return { allowed: true };
    }

    // Si es manager, verificar si el lead pertenece a una campaña de sus grupos
    if (userContext.isManager) {
      const hasAccessViaCampaign = await checkCampaignAccess(lead.campaignId, groupIds);
      if (hasAccessViaCampaign) {
        return { allowed: true };
      }

      // Manager también puede ver leads de usuarios descendientes
      const hasAccessViaHierarchy = await checkHierarchyAccess(userContext, lead);
      if (hasAccessViaHierarchy) {
        return { allowed: true };
      }
    }

    return { allowed: false, reason: "no-view-permission" };
  };

  /**
   * Verifica si el usuario puede editar un lead.
   *
   * Reglas:
   * - Manager: puede editar leads de campañas de sus grupos
   * - Usuario regular: solo puede editar el lead que tiene asignado actualmente
   */
  const canEditLead = async (
    userContext: UserAuthContext,
    lead: Lead,
    groupIds: number[]
  ): Promise<AuthorizationResult> => {
    // Si el usuario tiene este lead asignado actualmente
    if (lead.user?.id === userContext.userId) {
      return { allowed: true };
    }

    // Si es manager, verificar acceso por campaña o jerarquía
    if (userContext.isManager) {
      const hasAccessViaCampaign = await checkCampaignAccess(lead.campaignId, groupIds);
      if (hasAccessViaCampaign) {
        return { allowed: true };
      }

      const hasAccessViaHierarchy = await checkHierarchyAccess(userContext, lead);
      if (hasAccessViaHierarchy) {
        return { allowed: true };
      }
    }

    return { allowed: false, reason: "no-edit-permission" };
  };

  /**
   * Verifica si el usuario puede reasignar un lead.
   *
   * Reglas:
   * - Manager: puede reasignar leads de su ámbito
   * - Usuario regular: solo puede reasignar a usuarios en su lista de UserShareLead
   */
  const canReassignLead = async (
    userContext: UserAuthContext,
    lead: Lead,
    groupIds: number[]
  ): Promise<AuthorizationResult> => {
    // Manager puede reasignar leads de su ámbito
    if (userContext.isManager) {
      const hasAccessViaCampaign = await checkCampaignAccess(lead.campaignId, groupIds);
      if (hasAccessViaCampaign) {
        return { allowed: true };
      }

      const hasAccessViaHierarchy = await checkHierarchyAccess(userContext, lead);
      if (hasAccessViaHierarchy) {
        return { allowed: true };
      }
    }

    // Usuario regular solo puede reasignar el lead que tiene asignado
    if (lead.user?.id === userContext.userId) {
      return { allowed: true };
    }

    return { allowed: false, reason: "no-reassign-permission" };
  };

  /**
   * Verifica si el usuario puede tipificar (cambiar estado de) un lead.
   * Solo se puede tipificar el lead que el usuario tiene asignado actualmente.
   */
  const canTypeLead = async (
    userContext: UserAuthContext,
    lead: Lead,
    groupIds: number[]
  ): Promise<AuthorizationResult> => {
    // Solo se puede tipificar el lead asignado actualmente
    if (lead.user?.id === userContext.userId) {
      return { allowed: true };
    }

    // Manager puede tipificar leads de su ámbito
    if (userContext.isManager) {
      const hasAccessViaCampaign = await checkCampaignAccess(lead.campaignId, groupIds);
      if (hasAccessViaCampaign) {
        return { allowed: true };
      }
    }

    return { allowed: false, reason: "no-type-permission" };
  };

  /**
   * Verifica si el usuario puede gestionar llamadas de un lead.
   */
  const canManageLeadCalls = async (
    userContext: UserAuthContext,
    lead: Lead,
    groupIds: number[]
  ): Promise<AuthorizationResult> => {
    // Si el usuario tiene el lead asignado
    if (lead.user?.id === userContext.userId) {
      return { allowed: true };
    }

    // Si tiene una llamada programada para este lead
    const hasCall = await dataSource.getRepository(LeadCall).findOne({
      where: { leadId: lead.id, userId: userContext.userId },
    });
    if (hasCall) {
      return { allowed: true };
    }

    // Manager puede gestionar llamadas de leads de su ámbito
    if (userContext.isManager) {
      const hasAccessViaCampaign = await checkCampaignAccess(lead.campaignId, groupIds);
      if (hasAccessViaCampaign) {
        return { allowed: true };
      }
    }

    return { allowed: false, reason: "no-manage-calls-permission" };
  };

  /**
   * Verifica si el usuario puede gestionar documentos de un lead.
   */
  const canManageLeadDocuments = async (
    userContext: UserAuthContext,
    lead: Lead,
    groupIds: number[]
  ): Promise<AuthorizationResult> => {
    // Misma lógica que edición
    return canEditLead(userContext, lead, groupIds);
  };

  /**
   * Verifica si el usuario puede gestionar la cola de un lead.
   */
  const canManageLeadQueue = async (
    userContext: UserAuthContext,
    lead: Lead,
    groupIds: number[]
  ): Promise<AuthorizationResult> => {
    // Si el lead está en la cola del usuario
    const inQueue = await dataSource.getRepository(LeadQueue).findOne({
      where: { leadId: lead.id, userId: userContext.userId },
    });
    if (inQueue) {
      return { allowed: true };
    }

    // Manager puede gestionar colas de su ámbito
    if (userContext.isManager) {
      const hasAccessViaCampaign = await checkCampaignAccess(lead.campaignId, groupIds);
      if (hasAccessViaCampaign) {
        return { allowed: true };
      }
    }

    return { allowed: false, reason: "no-manage-queue-permission" };
  };

  /**
   * Obtiene los IDs de leads visibles para un usuario (para listados).
   * Aplica filtros según el rol del usuario.
   */
  export const getAccessibleLeadIds = async (
    userContext: UserAuthContext
  ): Promise<number[]> => {
    // Admin puede ver todos
    if (userContext.groupId === SUPER_ADMIN_GROUP_ID) {
      const allLeads = await dataSource.getRepository(Lead).find({
        select: ["id"],
      });
      return allLeads.map((l) => l.id);
    }

    const accessibleIds = new Set<number>();

    // Lead asignado actualmente
    const currentUser = await dataSource.getRepository(User).findOne({
      where: { id: userContext.userId },
    });
    if (currentUser?.leadId) {
      accessibleIds.add(currentUser.leadId);
    }

    // Leads en cola
    const queuedLeads = await dataSource.getRepository(LeadQueue).find({
      where: { userId: userContext.userId },
      select: ["leadId"],
    });
    queuedLeads.forEach((q) => accessibleIds.add(q.leadId));

    // Si es manager, añadir leads de campañas de sus grupos
    if (userContext.isManager) {
      const userGroups = await getUserGroups(userContext.userId);
      const groupIds = [userContext.groupId, ...userGroups.map((g) => g.groupId)];

      const campaignIds = await getCampaignIdsForGroups(groupIds);
      if (campaignIds.length > 0) {
        const campaignLeads = await dataSource.getRepository(Lead).find({
          where: { campaignId: In(campaignIds) },
          select: ["id"],
        });
        campaignLeads.forEach((l) => accessibleIds.add(l.id));
      }

      // Añadir leads de usuarios descendientes
      const descendantUserIds = await getDescendantUserIds(userContext.groupId);
      if (descendantUserIds.length > 0) {
        const descendantUsers = await dataSource.getRepository(User).find({
          where: { id: In(descendantUserIds), leadId: Not(null as any) },
          select: ["leadId"],
        });
        descendantUsers.forEach((u) => {
          if (u.leadId) accessibleIds.add(u.leadId);
        });
      }
    }

    return Array.from(accessibleIds);
  };

  /**
   * Verifica si el usuario puede asignar un lead a otro usuario específico.
   * Aplica restricción basada en UserShareLead para usuarios no-manager.
   */
  export const canAssignLeadToUser = async (
    userContext: UserAuthContext,
    targetUserId: number
  ): Promise<AuthorizationResult> => {
    // Admin puede asignar a cualquiera
    if (userContext.groupId === SUPER_ADMIN_GROUP_ID) {
      return { allowed: true };
    }

    // Manager puede asignar a usuarios de su ámbito
    if (userContext.isManager) {
      const isInScope = await isUserInManagerScope(userContext, targetUserId);
      if (isInScope) {
        return { allowed: true };
      }
    }

    // Usuario regular solo puede asignar a usuarios en su lista UserShareLead
    const shareLeadRelation = await dataSource.query(
      `SELECT * FROM user_share_lead WHERE userId = ? AND visibleShareLeadUserId = ?`,
      [userContext.userId, targetUserId]
    );

    if (shareLeadRelation.length > 0) {
      return { allowed: true };
    }

    return { allowed: false, reason: "cannot-assign-to-user" };
  };

  // ============== Funciones auxiliares ==============

  /**
   * Obtiene los grupos a los que pertenece un usuario.
   */
  const getUserGroups = async (userId: number): Promise<GroupUser[]> => {
    return dataSource.getRepository(GroupUser).find({
      where: { userId },
    });
  };

  /**
   * Verifica si un lead pertenece a una campaña accesible por los grupos del usuario.
   */
  const checkCampaignAccess = async (
    campaignId: number | null | undefined,
    groupIds: number[]
  ): Promise<boolean> => {
    if (!campaignId) return false;

    const groupCampaign = await dataSource.getRepository(GroupCampaign).findOne({
      where: {
        campaignId,
        groupId: In(groupIds),
      },
    });

    return !!groupCampaign;
  };

  /**
   * Verifica si el manager tiene acceso al lead por jerarquía de usuarios.
   */
  const checkHierarchyAccess = async (
    userContext: UserAuthContext,
    lead: Lead
  ): Promise<boolean> => {
    if (!lead.user) return false;

    const descendantIds = await getDescendantUserIds(userContext.groupId);
    return descendantIds.includes(lead.user.id);
  };

  /**
   * Obtiene los IDs de campañas asociadas a un conjunto de grupos.
   */
  const getCampaignIdsForGroups = async (groupIds: number[]): Promise<number[]> => {
    const groupCampaigns = await dataSource.getRepository(GroupCampaign).find({
      where: { groupId: In(groupIds) },
      select: ["campaignId"],
    });
    return groupCampaigns.map((gc) => gc.campaignId);
  };

  /**
   * Obtiene los IDs de usuarios descendientes de un grupo.
   */
  const getDescendantUserIds = async (groupId: number): Promise<number[]> => {
    const visitedGroups = new Set<number>();
    const descendantIds: number[] = [];

    const collectDescendants = async (currentGroupId: number) => {
      if (visitedGroups.has(currentGroupId)) return;
      visitedGroups.add(currentGroupId);

      // Usuarios con parentGroupId igual al grupo actual
      const users = await dataSource.getRepository(User).find({
        where: { parentGroupId: currentGroupId },
        select: ["id", "groupId"],
      });

      for (const user of users) {
        descendantIds.push(user.id);
        // Recursivamente buscar descendientes
        if (user.groupId) {
          await collectDescendants(user.groupId);
        }
      }
    };

    await collectDescendants(groupId);
    return descendantIds;
  };

  /**
   * Verifica si un usuario está dentro del ámbito de un manager.
   */
  const isUserInManagerScope = async (
    managerContext: UserAuthContext,
    targetUserId: number
  ): Promise<boolean> => {
    // Mismo grupo
    const targetUser = await dataSource.getRepository(User).findOne({
      where: { id: targetUserId },
    });

    if (!targetUser) return false;

    if (targetUser.groupId === managerContext.groupId) return true;
    if (targetUser.parentGroupId === managerContext.groupId) return true;

    // Verificar si está en descendientes
    const descendantIds = await getDescendantUserIds(managerContext.groupId);
    return descendantIds.includes(targetUserId);
  };

  /**
   * Extrae el contexto de autorización desde el objeto de request.
   */
  export const extractUserContext = (reqUser: any): UserAuthContext => {
    return {
      userId: reqUser.userId,
      groupId: reqUser.groupId,
      parentGroupId: reqUser.parentGroupId,
      isManager: reqUser.isManager,
    };
  };
}
