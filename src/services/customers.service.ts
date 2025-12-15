import { Customer } from "../models/customer.entity";
import { dataSource } from "../../app-data-source";
import { FindOptionsRelations, FindOptionsWhere } from "typeorm";
import { ValidationService } from "./validation.service";
import { NotFoundError, ValidationError } from "../errors/app-errors";
import { ErrorMessages } from "../errors/error-messages";

export module CustomersService {
  /**
   * Valida los datos de un cliente antes de crear/actualizar
   * @param requireEmail - Si es true, el email es obligatorio (factura electrónica). Default: true
   */
  const validateCustomerData = (
    customerData: Partial<Customer>,
    isCreate: boolean = true,
    requireEmail: boolean = true
  ): void => {
    // Validaciones obligatorias solo en creación
    if (isCreate) {
      ValidationService.required(customerData.name, "name", "Nombre");
      ValidationService.required(customerData.surnames, "surnames", "Apellidos");
      ValidationService.required(customerData.nationalId, "nationalId", "DNI/NIE/NIF");
      // Email solo obligatorio si es factura electrónica
      if (requireEmail) {
        ValidationService.required(customerData.email, "email", "Email");
      }
      ValidationService.required(customerData.phoneNumber, "phoneNumber", "Teléfono");
      ValidationService.required(customerData.address, "address", "Dirección");
      ValidationService.required(customerData.zipCode, "zipCode", "Código postal");
      ValidationService.required(customerData.province, "province", "Provincia");
      ValidationService.required(customerData.populace, "populace", "Población");
      ValidationService.required(customerData.iban, "iban", "IBAN");
    }

    // Validaciones de formato (siempre que el campo tenga valor)
    if (customerData.email) {
      ValidationService.email(customerData.email, "email", "Email");
    }

    if (customerData.phoneNumber) {
      ValidationService.phoneSpain(customerData.phoneNumber, "phoneNumber", "Teléfono");
    }

    if (customerData.nationalId) {
      ValidationService.nationalIdSpain(customerData.nationalId, "nationalId", "DNI/NIE/NIF");
    }

    if (customerData.iban) {
      ValidationService.ibanSpain(customerData.iban, "iban", "IBAN");
    }

    if (customerData.zipCode) {
      ValidationService.zipCodeSpain(customerData.zipCode, "zipCode", "Código postal");
    }

    // Validaciones de longitud
    if (customerData.name) {
      ValidationService.length(customerData.name, "name", { min: 2, max: 100 }, "Nombre");
    }

    if (customerData.surnames) {
      ValidationService.length(customerData.surnames, "surnames", { min: 2, max: 150 }, "Apellidos");
    }
  };

  export const create = async (
    customerData: Partial<Customer> & { requireEmail?: boolean }
  ): Promise<Customer> => {
    const customerRepository = dataSource.getRepository(Customer);

    // Extraer requireEmail del body (default true para factura electrónica)
    const { requireEmail = true, ...customerFields } = customerData;

    // Validar datos del cliente
    validateCustomerData(customerFields, true, requireEmail);

    const newCustomer = customerRepository.create(customerFields);

    return await customerRepository.save(newCustomer);
  };

  export const getOne = async (
    where: FindOptionsWhere<Customer>,
    relations: FindOptionsRelations<Customer> = {}
  ): Promise<Customer | null> => {
    const customerRepository = dataSource.getRepository(Customer);

    return await customerRepository.findOne({ where, relations });
  };

  export const getAll = async (): Promise<Customer[]> => {
    const customerRepository = dataSource.getRepository(Customer);
    return await customerRepository.find();
  };

  export const update = async (
    uuid: string,
    customerData: Partial<Customer>
  ): Promise<Customer> => {
    const customerRepository = dataSource.getRepository(Customer);
    const customerToUpdate = await customerRepository.findOne({
      where: { uuid },
    });

    if (!customerToUpdate) {
      throw new NotFoundError("Cliente", uuid);
    }

    // Validar datos del cliente (formato solamente, no campos obligatorios)
    validateCustomerData(customerData, false);

    Object.assign(customerToUpdate, customerData);
    return await customerRepository.save(customerToUpdate);
  };

  export const remove = async (uuid: string): Promise<boolean> => {
    const customerRepository = dataSource.getRepository(Customer);
    const deleteResult = await customerRepository.delete({ uuid });

    if (deleteResult.affected === 0) {
      throw new NotFoundError("Cliente", uuid);
    }

    return true;
  };

  export const getDuplicated = async (
    conditions: Partial<Customer> & { cups?: string }
  ): Promise<Customer[]> => {
    if (!conditions.phoneNumber && !conditions.email && !conditions.iban && !conditions.cups) {
      return [];
    }

    const customerRepository = dataSource.getRepository(Customer);
    const query = customerRepository.createQueryBuilder("customer");

    if (conditions.cups) {
      query.leftJoin("customer.contracts", "contract");
    }

    const whereClauses: string[] = [];
    const parameters: object = {};

    if (conditions.phoneNumber) {
      whereClauses.push("customer.phoneNumber = :phoneNumber");
      parameters["phoneNumber"] = conditions.phoneNumber;
    }
    if (conditions.email) {
      whereClauses.push("customer.email = :email");
      parameters["email"] = conditions.email;
    }
    if (conditions.iban) {
      whereClauses.push("customer.iban = :iban");
      parameters["iban"] = conditions.iban;
    }
    if (conditions.cups) {
      whereClauses.push("contract.cups = :cups");
      parameters["cups"] = conditions.cups;
    }

    query.where(`(${whereClauses.join(" OR ")})`, parameters);

    const customers = await query.getMany();

    const uniqueCustomers = customers.filter(
      (customer, index, self) =>
        index ===
        self.findIndex(
          (c) => c.nationalId && customer.nationalId && c.nationalId === customer.nationalId
        )
    );

    return uniqueCustomers;
  };
}
