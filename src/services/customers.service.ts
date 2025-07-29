import { Customer } from "../models/customer.entity";
import { dataSource } from "../../app-data-source";
import { FindOptionsRelations, FindOptionsWhere } from "typeorm";

export module CustomersService {
  export const create = async (customerData: Partial<Customer>): Promise<Customer> => {
    try {
      const customerRepository = dataSource.getRepository(Customer);

      const newCustomer = customerRepository.create(customerData);

      return await customerRepository.save(newCustomer);
    } catch (error) {
      throw error;
    }
  };

  export const getOne = async (
    where: FindOptionsWhere<Customer>,
    relations: FindOptionsRelations<Customer> = {}
  ): Promise<Customer | null> => {
    try {
      const customerRepository = dataSource.getRepository(Customer);

      return await customerRepository.findOne({ where, relations });
    } catch (error) {
      throw error;
    }
  };

  export const getAll = async (): Promise<Customer[]> => {
    try {
      const customerRepository = dataSource.getRepository(Customer);
      return await customerRepository.find();
    } catch (error) {
      throw error;
    }
  };

  export const update = async (
    uuid: string,
    customerData: Partial<Customer>
  ): Promise<Customer> => {
    try {
      const customerRepository = dataSource.getRepository(Customer);
      const customerToUpdate = await customerRepository.findOne({
        where: { uuid },
      });

      if (!customerToUpdate) {
        throw new Error("Customer not found");
      }

      Object.assign(customerToUpdate, customerData);
      return await customerRepository.save(customerToUpdate);
    } catch (error) {
      throw error;
    }
  };

  export const remove = async (uuid: string): Promise<boolean> => {
    try {
      const customerRepository = dataSource.getRepository(Customer);
      const deleteResult = await customerRepository.delete({ uuid });

      if (deleteResult.affected === 0) {
        throw new Error("Customer not found");
      }

      return true;
    } catch (error) {
      throw error;
    }
  };

  export const getDuplicated = async (
    conditions: Partial<Customer> & { cups?: string }
  ): Promise<Customer[]> => {
    try {
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
    } catch (error) {
      console.error("Error checking for duplicate customers:", error);
      throw error;
    }
  };
}
