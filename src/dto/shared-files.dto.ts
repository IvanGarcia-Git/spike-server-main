import { Roles } from "../enums/roles.enum";

export interface SharedFilesDTO {
    id: number;
    uuid: string;
    name: string;
    uri: string;
    size: number;
    mimetype: string;
    type: "private" | "shared";
    createdAt: Date;
    ownerEmail: string;
  }
