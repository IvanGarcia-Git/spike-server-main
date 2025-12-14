import { AwsHelper } from "../helpers/aws.helper";
import { dataSource } from "../../app-data-source";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.entity";
import { CreateUserDTO } from "../dto/create-user.dto";
import { FindOptionsRelations, FindOptionsWhere, Not } from "typeorm";
import { Roles } from "../enums/roles.enum";
import { AgentUserVisibleUserService } from "./user-agent-visible-user.service";
import { sendEmail } from "../helpers/resend.helper";
import { EmailHelper } from "../helpers/email.helper";
import { UserDocument } from "../models/user-document.entity";
import { ValidationService } from "./validation.service";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  UnauthorizedError,
} from "../errors/app-errors";
import { ErrorMessages } from "../errors/error-messages";

export module UsersService {
  /**
   * Valida los datos de un usuario antes de crear/actualizar
   */
  const validateUserData = (
    userDto: Partial<CreateUserDTO>,
    isCreate: boolean = true
  ): void => {
    // Validaciones obligatorias en creación
    if (isCreate) {
      ValidationService.required(userDto.name, "name", "Nombre");
      ValidationService.required(userDto.firstSurname, "firstSurname", "Primer apellido");
      ValidationService.required(userDto.username, "username", "Nombre de usuario");
      ValidationService.required(userDto.email, "email", "Email");
      ValidationService.required(userDto.password, "password", "Contraseña");
    }

    // Validaciones de formato
    if (userDto.username) {
      ValidationService.username(userDto.username, "username", "Nombre de usuario");
    }

    if (userDto.email) {
      ValidationService.email(userDto.email, "email", "Email");
    }

    if (userDto.password && isCreate) {
      ValidationService.password(userDto.password, "password", "Contraseña");
    }

    if (userDto.phone) {
      ValidationService.phoneSpain(userDto.phone, "phone", "Teléfono");
    }

    if (userDto.iban) {
      ValidationService.ibanSpain(userDto.iban, "iban", "IBAN");
    }

    // Validar rol si se proporciona
    if (userDto.role) {
      ValidationService.oneOf(
        userDto.role,
        Object.values(Roles) as Roles[],
        "role",
        "Rol"
      );
    }
  };

  export const create = async (
    creatorIsManager: boolean,
    creatorGroupId: number,
    creatorParentGroupId: number,
    userDto: CreateUserDTO,
    userImage?: Express.Multer.File
  ): Promise<User> => {
    if (!creatorIsManager) {
      throw new ForbiddenError("crear usuarios", ErrorMessages.User.ONLY_MANAGERS_CAN_CREATE);
    }

    // Validar datos del usuario
    validateUserData(userDto, true);

    const hashedPassword = await bcryptjs.hash(userDto.password, 10);

    const newUser = new User();

    newUser.name = userDto.name;
    newUser.firstSurname = userDto.firstSurname;
    newUser.secondSurname = userDto.secondSurname;
    newUser.username = userDto.username;
    newUser.email = userDto.email;
    newUser.password = hashedPassword;
    newUser.startDate = userDto.startDate ?? null;
    newUser.days = userDto.days ?? null;
    newUser.time = userDto.time ?? null;
    newUser.shift = userDto.shift ?? null;
    newUser.phone = userDto.phone ?? null;
    newUser.iban = userDto.iban ?? null;
    newUser.leadPriorities = [];

    const { groupId, parentGroupId, isManager } = defineGroupStructureForTypeUser(
      userDto.role,
      creatorGroupId,
      creatorParentGroupId
    );

    if (groupId) {
      newUser.groupId = groupId;
    }

    newUser.parentGroupId = parentGroupId;
    newUser.isManager = isManager;
    newUser.role = userDto.role || Roles.Colaborador;

    if (userImage) {
      newUser.imageUri = await AwsHelper.uploadImageToS3("user", userImage);
    }

    return await dataSource.getRepository(User).save(newUser);
  };

  export const login = async (username: string, password: string): Promise<string> => {
    // Validar campos requeridos
    ValidationService.required(username, "username", "Nombre de usuario");
    ValidationService.required(password, "password", "Contraseña");

    const userRepository = dataSource.getRepository(User);
    const user: User = await userRepository.findOne({ where: { username } });

    if (!user) {
      throw new UnauthorizedError(ErrorMessages.Auth.INVALID_CREDENTIALS);
    }

    const passwordMatch = await bcryptjs.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedError(ErrorMessages.Auth.INVALID_CREDENTIALS);
    }

    const token = jwt.sign(
      {
        userId: user.id,
        userEmail: user.email,
        userUuid: user.uuid,
        isManager: user.isManager,
        role: user.role,
        groupId: user.groupId,
        parentGroupId: user?.parentGroupId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return token;
  };

  export const sendPasswordEmail = async (uuid: string, email: string): Promise<void> => {
    const html = EmailHelper.passwordResetEmail(uuid);
    await sendEmail([email], "Restablece tu contraseña", html);
  };

  export const getProfilePictureUri = async (userId: number): Promise<string> => {
    try {
      const userFound: User = await get({ id: userId });

      //24 hours expiration
      return userFound?.imageUri ? AwsHelper.getPresignedUrl(userFound?.imageUri, 86400) : null;
    } catch (error) {
      throw error;
    }
  };

  export const get = async (
    where: FindOptionsWhere<User>,
    relations: FindOptionsRelations<User> = {}
  ): Promise<User> => {
    const usersRepository = dataSource.getRepository(User);

    const userFound: User = await usersRepository.findOne({
      where,
      relations,
    });

    if (!userFound) {
      const identifier = where.uuid || where.id;
      throw new NotFoundError("Usuario", identifier?.toString());
    }

    return userFound;
  };

  export const getMany = async (
    where: FindOptionsWhere<User>,
    relations: FindOptionsRelations<User> = {}
  ): Promise<User[]> => {
    const usersRepository = dataSource.getRepository(User);

    return await usersRepository.find({
      where,
      relations,
    });
  };

  export const getOne = async (where: FindOptionsWhere<User>): Promise<User> => {
    const usersRepository = dataSource.getRepository(User);

    return await usersRepository.findOne({
      where,
    });
  };

  export const getManagerVisibleUsers = async (
    userId: number,
    isManager: boolean
  ): Promise<{ users: User[]; count: number }> => {
    if (!isManager) {
      throw new ForbiddenError("ver usuarios", "Esta función es solo para managers");
    }

    const manager = await dataSource.getRepository(User).findOne({
      where: { id: userId, isManager: true },
    });

    if (!manager) {
      throw new NotFoundError("Manager", userId.toString());
    }

    const sameGroupUsers = await dataSource.getRepository(User).find({
      where: { groupId: manager.groupId },
    });

    const allDescendants = await getAllDescendantUsers(manager.groupId, new Set());

    const allVisibleUsersSet = new Set<User>([...sameGroupUsers, ...allDescendants]);

    const allVisibleUsers = Array.from(allVisibleUsersSet);

    for (const visibleUser of allVisibleUsers) {
      if (visibleUser?.imageUri) {
        visibleUser.imageUri = AwsHelper.getPresignedUrl(visibleUser.imageUri);
      }
    }

    return { users: allVisibleUsers, count: allVisibleUsers.length };
  };

  export const getAgentVisibleUsers = async (
    userId: number,
    isManager: boolean
  ): Promise<{ users: User[]; count: number }> => {
    if (isManager) {
      throw new ForbiddenError("ver usuarios visibles de agente", "Esta función es solo para agentes");
    }

    const agentUserVisibleUsers = await AgentUserVisibleUserService.getMany(
      { agentId: userId },
      { visibleUser: true }
    );

    const agentVisibleUsers: User[] = [];

    for (const agentUserVisibleUser of agentUserVisibleUsers) {
      agentVisibleUsers.push(agentUserVisibleUser.visibleUser);
    }

    return { users: agentVisibleUsers, count: agentVisibleUsers.length };
  };

  export const getVisibleUserIds = async (
    userId: number,
    isManager: boolean,
    groupId: number
  ): Promise<number[]> => {
    if (!isManager) {
      return [userId];
    }

    const sameGroupUsers = await dataSource.getRepository(User).find({
      where: { groupId, id: Not(userId) },
    });

    const allDescendants = await getAllDescendantUsers(groupId, new Set());

    const visibleUserIdsSet = new Set<number>();

    visibleUserIdsSet.add(userId);

    sameGroupUsers.forEach((user) => visibleUserIdsSet.add(user.id));

    allDescendants.forEach((user) => visibleUserIdsSet.add(user.id));

    return Array.from(visibleUserIdsSet);
  };

  export const getAgentsAndSupervisors = async (parentGroupId: number): Promise<User[]> => {
    const repo = dataSource.getRepository(User);

    const supervisors = await repo.find({
      where: { isManager: true, parentGroupId },
    });

    const agents = await repo.find({
      where: { isManager: false, parentGroupId },
    });

    return [...supervisors, ...agents];
  };

  export const deleteUser = async (isManager: boolean, userUuid: string): Promise<boolean> => {
    if (!isManager) {
      throw new ForbiddenError("eliminar usuarios", ErrorMessages.User.ONLY_MANAGERS_CAN_DELETE);
    }

    const user = await dataSource.getRepository(User).findOne({
      where: { uuid: userUuid },
    });

    if (!user) {
      throw new NotFoundError("Usuario", userUuid);
    }

    await dataSource.getRepository(User).remove(user);

    return true;
  };

  export const updateUser = async (
    isManager: boolean,
    userUuid: string,
    userDataParam: string | Partial<User>,
    userImage?: Express.Multer.File
  ): Promise<User> => {
    let userData: Partial<User>;
    if (typeof userDataParam === "string") {
      try {
        userData = JSON.parse(userDataParam);
      } catch (e) {
        throw new ValidationError(ErrorMessages.Generic.INVALID_FORMAT("datos de usuario"), {
          field: "userData",
          reason: "JSON inválido",
        });
      }
    } else {
      userData = userDataParam;
    }

    if (!isManager) {
      throw new ForbiddenError("actualizar usuarios", ErrorMessages.User.ONLY_MANAGERS_CAN_UPDATE);
    }

    const user = await dataSource.getRepository(User).findOne({
      where: { uuid: userUuid },
    });

    if (!user) {
      throw new NotFoundError("Usuario", userUuid);
    }

    // Validar datos del usuario (formato solamente, no campos obligatorios)
    validateUserData(userData as Partial<CreateUserDTO>, false);

    if (userData?.password) {
      userData.password = await bcryptjs.hash(userData.password, 10);
    } else {
      delete userData.password;
    }

    if (userData.hasOwnProperty("isManager") && typeof userData.isManager === "string") {
      userData.isManager = (userData.isManager as string).toLowerCase() === "true";
    }

    if (userImage) {
      userData.imageUri = await AwsHelper.uploadImageToS3("user", userImage);
    } else if (userData.hasOwnProperty("imageUri") && userData.imageUri === null) {
    } else {
      delete userData.imageUri;
    }

    Object.assign(user, userData);

    const updatedUser = await dataSource.getRepository(User).save(user);

    return updatedUser;
  };

  export const resetPasswordService = async (
    userUuid: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    // Validar campos obligatorios
    ValidationService.required(newPassword, "newPassword", "Nueva contraseña");
    ValidationService.required(confirmPassword, "confirmPassword", "Confirmar contraseña");

    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      throw new ValidationError(ErrorMessages.Auth.PASSWORDS_DO_NOT_MATCH, {
        field: "confirmPassword",
      });
    }

    // Validar formato de contraseña
    ValidationService.password(newPassword, "newPassword", "Nueva contraseña");

    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { uuid: userUuid } });

    if (!user) {
      throw new NotFoundError("Usuario", userUuid);
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    user.password = hashedPassword;

    await userRepo.save(user);

    return {
      message: "Contraseña actualizada correctamente.",
    };
  };

  //Private functions
  const getAllDescendantUsers = async (
    groupId: number,
    visitedGroups: Set<number>
  ): Promise<User[]> => {
    if (visitedGroups.has(groupId)) {
      return [];
    }

    visitedGroups.add(groupId);

    const users = await dataSource.getRepository(User).find({
      where: { parentGroupId: groupId },
    });

    const allDescendantsSet = new Set<User>(users);

    for (const user of users) {
      const descendants = await getAllDescendantUsers(user.groupId, visitedGroups);
      descendants.forEach((descendant) => allDescendantsSet.add(descendant));
    }

    return Array.from(allDescendantsSet);
  };

  const defineGroupStructureForTypeUser = (
    role: Roles,
    creatorGroupId: number,
    creatorParentGroupId: number
  ): { groupId: number; parentGroupId: number; isManager: boolean } => {
    if (role == Roles.Admin) {
      return {
        groupId: creatorGroupId,
        parentGroupId: creatorParentGroupId,
        isManager: true,
      };
    } else if (role == Roles.Agente) {
      return { groupId: null, parentGroupId: creatorGroupId, isManager: true };
    } else {
      return { groupId: null, parentGroupId: creatorGroupId, isManager: false };
    }
  };

  //User documents
  export const uploadDocument = async (
    userId: number,
    file: Express.Multer.File
  ): Promise<UserDocument> => {
    // Validar que el usuario exista
    await ValidationService.userExists(userId, "documento de usuario");

    const documentUri = await AwsHelper.uploadGenericCommentDocumentToS3("users", file);

    const userDocumentRepository = dataSource.getRepository(UserDocument);
    const newDocument = userDocumentRepository.create({
      userId,
      documentUri,
      originalName: file.originalname,
    });

    await userDocumentRepository.save(newDocument);

    return newDocument;
  };

  export const getDocumentsForUser = async (userId: number): Promise<UserDocument[]> => {
    const userDocumentRepository = dataSource.getRepository(UserDocument);
    return userDocumentRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  };

  export const getPresignedUrlForDocument = async (
    documentUuid: string
  ): Promise<string> => {
    const userDocumentRepository = dataSource.getRepository(UserDocument);
    const document = await userDocumentRepository.findOne({ where: { uuid: documentUuid } });

    if (!document) {
      throw new NotFoundError("Documento de usuario", documentUuid);
    }

    return AwsHelper.getPresignedUrl(document.documentUri, 3600);
  };

  export const deleteDocument = async (
    documentUuid: string,
    requestingUserId: number,
    isManager: boolean
  ): Promise<boolean> => {
    const userDocumentRepository = dataSource.getRepository(UserDocument);
    const document = await userDocumentRepository.findOne({
      where: { uuid: documentUuid },
      relations: { user: true },
    });

    if (!document) {
      throw new NotFoundError("Documento de usuario", documentUuid);
    }

    if (!isManager && document.userId !== requestingUserId) {
      throw new ForbiddenError(
        "eliminar este documento",
        "Solo puedes eliminar tus propios documentos o ser manager"
      );
    }

    try {
      await AwsHelper.deleteFileFromS3(document.documentUri);
    } catch (s3Error) {
      console.error("Error al eliminar de S3:", s3Error);
      // Continuar con la eliminación del registro aunque falle S3
    }

    await userDocumentRepository.remove(document);

    return true;
  };
}
