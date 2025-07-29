import { Roles } from "../enums/roles.enum";
import { UserShift } from "../enums/user-shift.enum";

export interface CreateUserDTO {
  name: string;
  firstSurname: string;
  secondSurname: string;
  username: string;
  email: string;
  password: string;
  role: Roles;
  startDate?: string;
  days?: string;
  time?: string;
  shift?: UserShift;
  phone?: string;
  iban?: string;
  address?: string;
  cif?: string;
}
