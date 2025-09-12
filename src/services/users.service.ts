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

export module UsersService {
  export const create = async (
    creatorIsManager: boolean,
    creatorGroupId: number,
    creatorParentGroupId: number,
    userDto: CreateUserDTO,
    userImage?: Express.Multer.File
  ): Promise<User> => {
    if (!creatorIsManager) {
      throw new Error("not-permission");
    }

    try {
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

      if (userImage) {
        newUser.imageUri = await AwsHelper.uploadImageToS3("user", userImage);
      }

      return await dataSource.getRepository(User).save(newUser);
    } catch (error) {
      throw error;
    }
  };

  export const login = async (username: string, password: string): Promise<string> => {
    try {
      const userRepository = dataSource.getRepository(User);
      const user: User = await userRepository.findOne({ where: { username } });

      if (!user) {
        throw new Error("user-not-found");
      }

      const passwordMatch = await bcryptjs.compare(password, user.password);

      if (!passwordMatch) {
        throw new Error("invalid-email-or-password");
      }

      const token = jwt.sign(
        {
          userId: user.id,
          userEmail: user.email,
          userUuid: user.uuid,
          isManager: user.isManager,
          groupId: user.groupId,
          parentGroupId: user?.parentGroupId,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      return token;
    } catch (error) {
      throw error;
    }
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
    try {
      const usersRepository = dataSource.getRepository(User);

      const userFound: User = await usersRepository.findOne({
        where,
        relations,
      });

      if (!userFound) throw new Error("user-not-found");

      return userFound;
    } catch (error) {
      throw error;
    }
  };

  export const getMany = async (
    where: FindOptionsWhere<User>,
    relations: FindOptionsRelations<User> = {}
  ): Promise<User[]> => {
    try {
      const usersRepository = dataSource.getRepository(User);

      return await usersRepository.find({
        where,
        relations,
      });
    } catch (error) {
      throw error;
    }
  };

  export const getOne = async (where: FindOptionsWhere<User>): Promise<User> => {
    try {
      const usersRepository = dataSource.getRepository(User);

      return await usersRepository.findOne({
        where,
      });
    } catch (error) {
      throw error;
    }
  };

  export const getManagerVisibleUsers = async (
    userId: number,
    isManager: boolean
  ): Promise<{ users: User[]; count: number }> => {
    if (!isManager) {
      throw new Error("not-permission");
    }

    try {
      const manager = await dataSource.getRepository(User).findOne({
        where: { id: userId, isManager: true },
      });

      if (!manager) {
        throw new Error("Manager not found");
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
    } catch (error) {
      throw error;
    }
  };

  export const getAgentVisibleUsers = async (
    userId: number,
    isManager: boolean
  ): Promise<{ users: User[]; count: number }> => {
    if (isManager) {
      throw new Error("not-permission");
    }

    try {
      const agentUserVisibleUsers = await AgentUserVisibleUserService.getMany(
        { agentId: userId },
        { visibleUser: true }
      );

      const agentVisibleUsers: User[] = [];

      for (const agentUserVisibleUser of agentUserVisibleUsers) {
        agentVisibleUsers.push(agentUserVisibleUser.visibleUser);
      }

      return { users: agentVisibleUsers, count: agentVisibleUsers.length };
    } catch (error) {
      throw error;
    }
  };

  export const getVisibleUserIds = async (
    userId: number,
    isManager: boolean,
    groupId: number
  ): Promise<number[]> => {
    try {
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
    } catch (error) {
      throw error;
    }
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
      throw new Error("not-permission");
    }

    try {
      const user = await dataSource.getRepository(User).findOne({
        where: { uuid: userUuid },
      });

      if (!user) {
        throw new Error("user-not-found");
      }

      await dataSource.getRepository(User).remove(user);

      return true;
    } catch (error) {
      throw error;
    }
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
        throw new Error("Invalid user data format.");
      }
    } else {
      userData = userDataParam;
    }

    if (!isManager) {
      throw new Error("not-permission");
    }

    try {
      const user = await dataSource.getRepository(User).findOne({
        where: { uuid: userUuid },
      });

      if (!user) {
        throw new Error("user-not-found");
      }

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
    } catch (error) {
      throw error;
    }
  };

  export const resetPasswordService = async (
    userUuid: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    if (!newPassword || !confirmPassword) {
      throw { status: 400, message: "Please, complete all fields." };
    }

    if (newPassword !== confirmPassword) {
      throw { status: 400, message: "The passwords do not match." };
    }

    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { uuid: userUuid } });

    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    user.password = hashedPassword;

    await userRepo.save(user);

    return {
      message: "Password updated successfully for all matched users.",
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
    if (role == "admin") {
      return {
        groupId: creatorGroupId,
        parentGroupId: creatorParentGroupId,
        isManager: true,
      };
    } else if (role == "supervisor") {
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
    try {
      const documentUri = await AwsHelper.uploadGenericCommentDocumentToS3("users", file);

      const userDocumentRepository = dataSource.getRepository(UserDocument);
      const newDocument = userDocumentRepository.create({
        userId,
        documentUri,
        originalName: file.originalname,
      });

      await userDocumentRepository.save(newDocument);

      return newDocument;
    } catch (error) {
      console.error("Error en el servicio uploadDocument:", error);
      throw error;
    }
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
  ): Promise<string | null> => {
    const userDocumentRepository = dataSource.getRepository(UserDocument);
    const document = await userDocumentRepository.findOne({ where: { uuid: documentUuid } });

    if (!document) {
      return null;
    }

    return AwsHelper.getPresignedUrl(document.documentUri, 3600);
  };

  export const deleteDocument = async (
    documentUuid: string,
    requestingUserId: number,
    isManager: boolean
  ): Promise<boolean> => {
    try {
      const userDocumentRepository = dataSource.getRepository(UserDocument);
      const document = await userDocumentRepository.findOne({
        where: { uuid: documentUuid },
        relations: { user: true },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      if (!isManager && document.userId !== requestingUserId) {
        throw new Error("Unauthorized to delete this document");
      }

      try {
        await AwsHelper.deleteFileFromS3(document.documentUri);
        console.log(`Document ${document.documentUri} deleted successfully from S3`);
      } catch (s3Error) {
        console.error("Error deleting from S3:", s3Error);
      }

      await userDocumentRepository.remove(document);

      return true;
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  };
}
