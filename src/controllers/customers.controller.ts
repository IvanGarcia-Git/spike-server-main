import { CustomersService } from "../services/customers.service";

export module CustomersController {
  export const create = async (req, res, next) => {
    try {
      const customerData = req.body;

      const newCustomer = await CustomersService.create(customerData);

      res.status(201).json(newCustomer);
    } catch (error) {
      next(error);
    }
  };

  //TODO: Ensure user permission to see
  export const get = async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const customer = await CustomersService.getOne(
        { uuid },
        {
          contracts: {
            company: true,
            rate: true,
            user: true,
            telephonyData: {
              rates: true,
            },
          },
        }
      );

      res.json(customer);
    } catch (error) {
      next(error);
    }
  };

  export const getAllCustomers = async (req, res, next) => {
    try {
      const customers = await CustomersService.getAll();
      res.json(customers);
    } catch (error) {
      next(error);
    }
  };

  export const simpleGet = async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const customer = await CustomersService.getOne({ uuid });

      res.json(customer);
    } catch (error) {
      next(error);
    }
  };

  //TODO: Ensure user permission to update
  export const update = async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const customerData = req.body;

      // const contract = await CustomersService.getOne({ uuid });

      // if (!contract.isDraft && !isManager) {
      //   res
      //     .status(403)
      //     .send("Only Admin can update a contract that is not in draft mode.");
      //   return;
      // }

      const updatedCustomer = await CustomersService.update(uuid, customerData);
      res.json(updatedCustomer);
    } catch (error) {
      next(error);
    }
  };

  export const checkDuplicity = async (req, res, next) => {
    try {
      const { phoneNumber, email, iban, cups } = req.query;

      const customersDuplicated = await CustomersService.getDuplicated({
        phoneNumber,
        email,
        iban,
        cups,
      });

      res.json(customersDuplicated);
    } catch (error) {
      next(error);
    }
  };
}
