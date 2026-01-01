import { AgentUserVisibleUsersService } from "../services/agent-user-visible-users.service";
import { AwsHelper } from "../helpers/aws.helper";
import { CreateUserDTO } from "../dto/create-user.dto";
import { User } from "../models/user.entity";
import { UsersService } from "../services/users.service";

export module UsersController {
  export const create = async (req, res, next) => {
    const { isManager, groupId, parentGroupId } = req.user;

    const userData: CreateUserDTO = req.body;
    const userImage: Express.Multer.File = req.file;

    try {
      const userCreated: User = await UsersService.create(
        isManager,
        groupId,
        parentGroupId,
        userData,
        userImage
      );
      res.json(userCreated);
    } catch (err) {
      next(err);
    }
  };

  export const login = async (req, res, next) => {
    const { username, password } = req.body;
    try {
      const jwt: string = await UsersService.login(username, password);
      res.json({ jwt });
    } catch (err) {
      next(err);
    }
  };

  export const sendResetPasswordEmail = async (req, res, next) => {
    const { uuid, email } = req.body;
    try {
      await UsersService.sendPasswordEmail(uuid, email);
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  export const get = async (req, res, next) => {
    const { userId } = req.user;

    try {
      const user: User = await UsersService.get({ id: userId });

      res.json(user);
    } catch (err) {
      next(err);
    }
  };

  export const getList = async (req, res, next) => {
    const { agentId } = req.body;

    try {
      const users: User[] = await UsersService.getMany({});

      const visibleUsersIds: number[] = await AgentUserVisibleUsersService.getVisibleUsersIds({
        agentId,
      });

      res.json({ users, visibleUsersIds });
    } catch (err) {
      next(err);
    }
  };

  export const getAgentsList = async (req, res, next) => {
    try {
      const users: User[] = await UsersService.getMany({ isManager: false });

      res.json(users);
    } catch (err) {
      next(err);
    }
  };

  export const getAllUsers = async (req, res, next) => {
    try {
      const users: User[] = await UsersService.getMany({});

      res.json(users);
    } catch (err) {
      next(err);
    }
  };

  export const getProfilePicture = async (req, res, next) => {
    try {
      const { userId } = req.params;

      const profileImageUri: string = await UsersService.getProfilePictureUri(userId);

      res.json({ profileImageUri });
    } catch (err) {
      next(err);
    }
  };

  export const getByUuid = async (req, res, next) => {
    const { userUuid } = req.params;

    try {
      const user: User = await UsersService.get(
        { uuid: userUuid },
        { groupUsers: { group: true } }
      );

      res.json(user);
    } catch (err) {
      next(err);
    }
  };

  export const getByEmail = async (req, res, next) => {
    const { userEmail } = req.params;

    if (!userEmail || userEmail.trim() === "") {
      return res.status(400).json({ error: "Email cannot be empty." });
    }

    try {
      const user: User = await UsersService.getOne({ email: userEmail });

      res.json(user);
    } catch (err) {
      next(err);
    }
  };

  export const getLead = async (req, res, next) => {
    try {
      const { userId } = req.user;

      const userWithLead = await UsersService.get(
        { id: userId },
        {
          lead: {
            leadLogs: { leadState: true, user: true },
            campaign: true,
            leadSheet: true,
          },
        }
      );

      const lead = userWithLead.lead;

      if (lead?.billUri && !lead.billUri.startsWith("https://bajatufactura")) {
        try {
          lead.billUri = AwsHelper.getPresignedUrl(lead.billUri);
        } catch (error) {
          console.error(`Error generating presigned URL for lead ID: ${lead.id}`, error);
        }
      }

      res.json(lead);
    } catch (error) {
      next(error);
    }
  };

  export const getManagerVisibleUsers = async (req, res, next) => {
    const { userId, isManager } = req.user;

    try {
      if (!isManager) {
        res.status(403).send("unauthorized");
        return;
      }

      const visibleUsers: { users: User[]; count: number } =
        await UsersService.getManagerVisibleUsers(userId, isManager);

      res.json(visibleUsers);
    } catch (err) {
      next(err);
    }
  };

  export const getAgentVisibleUsers = async (req, res, next) => {
    const { userId, isManager } = req.user;

    try {
      if (isManager) {
        res.status(403).send("unauthorized");
        return;
      }

      const visibleUsers: { users: User[]; count: number } =
        await UsersService.getAgentVisibleUsers(userId, isManager);
      res.json(visibleUsers);
    } catch (err) {
      next(err);
    }
  };

  export const getAgentsAndSupervisors = async (req, res, next) => {
    try {
      const { userId, isManager, groupId } = req.user;
      if (!isManager) {
        return res.status(403).json({ message: "unauthorized" });
      }
      const list = await UsersService.getAgentsAndSupervisors(groupId);
      res.json(list);
    } catch (err) {
      next(err);
    }
  };

  export const updateUser = async (req, res, next) => {
    const { isManager, userUuid: authenticatedUserUuid } = req.user;

    const { userData, userUuid } = req.body;
    const userImage: Express.Multer.File = req.file;

    try {
      const updatedUser = await UsersService.updateUser(isManager, userUuid, userData, userImage, authenticatedUserUuid);

      res.json(updatedUser);
    } catch (err) {
      next(err);
    }
  };

  export const resetPassword = async (req, res, next) => {
    const { userUuid } = req.params;
    const { newPassword, confirmPassword } = req.body;

    try {
      const result = await UsersService.resetPasswordService(
        userUuid,
        newPassword,
        confirmPassword
      );
      return res.status(200).json(result);
    } catch (error: any) {
      console.error("Error actualizando contraseña:", error);
      return res
        .status(error.status || 500)
        .json({ message: error.message || "Error interno del servidor." });
    }
  };

  export const deleteUser = async (req, res, next) => {
    const { isManager } = req.user;
    const { userUuid } = req.body;
    try {
      const deleted: boolean = await UsersService.deleteUser(isManager, userUuid);
      res.json({ deleted });
    } catch (err) {
      next(err);
    }
  };

  //User documents
  export const uploadDocument = async (req, res, next) => {
    try {
      const { userId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No se ha proporcionado ningún archivo." });
      }

      const newDocument = await UsersService.uploadDocument(Number(userId), file);
      res.status(201).json(newDocument);
    } catch (error) {
      next(error);
    }
  }

  export const getDocumentsForUser = async (req, res, next) => {
    try {
      const { userId } = req.params;
      const documents = await UsersService.getDocumentsForUser(Number(userId));
      res.status(200).json(documents);
    } catch (error) {
      next(error);
    }
  }

  export const getDownloadUrl = async (req, res, next) => {
    try {
        const { documentUuid } = req.params;
        const downloadUrl = await UsersService.getPresignedUrlForDocument(documentUuid);
        if (!downloadUrl) {
            return res.status(404).json({ message: "Documento no encontrado." });
        }
        res.status(200).json({ url: downloadUrl });
    } catch (error) {
        next(error);
    }
  }

  export const deleteDocument = async (req, res, next) => {
    try {
      const { documentUuid } = req.params;
      const { userId, isManager } = req.user;

      const deleted = await UsersService.deleteDocument(documentUuid, userId, isManager);
      
      if (deleted) {
        res.status(200).json({ message: "Documento eliminado exitosamente." });
      } else {
        res.status(400).json({ message: "Error al eliminar el documento." });
      }
    } catch (error) {
      if (error.message === "Document not found") {
        return res.status(404).json({ message: "Documento no encontrado." });
      }
      if (error.message === "Unauthorized to delete this document") {
        return res.status(403).json({ message: "No tienes permisos para eliminar este documento." });
      }
      next(error);
    }
  }

  // Datos fiscales del emisor
  export const getIssuerFiscalData = async (req, res, next) => {
    try {
      const { userId } = req.user;
      const fiscalData = await UsersService.getIssuerFiscalData(userId);
      res.json(fiscalData);
    } catch (error) {
      next(error);
    }
  };

  export const updateIssuerFiscalData = async (req, res, next) => {
    try {
      const { userId } = req.user;
      const fiscalData = req.body;
      const updatedData = await UsersService.updateIssuerFiscalData(userId, fiscalData);
      res.json(updatedData);
    } catch (error) {
      next(error);
    }
  };
}
