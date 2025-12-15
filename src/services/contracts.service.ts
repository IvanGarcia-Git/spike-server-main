import { Contract } from "../models/contract.entity";
import { ContractHistoryService } from "./contract-history.service";
import { ContractHistoryStatus } from "../models/contract-history.entity";
import { ContractLogs } from "../enums/contract-logs.enum";
import { ContractLogsService } from "./contract-logs.service";
import { ContractState } from "../models/contract-state.entity";
import { ContractStatesService } from "./contract-states.service";
import { dataSource } from "../../app-data-source";
import { FindOptionsRelations, FindOptionsWhere, In } from "typeorm";
import { UsersService } from "./users.service";
import { RatesService } from "./rates.service";
import { UserContractPreferencesService } from "./user-contract-preferences.service";
import { NotificationsService } from "./notifications.service";
import { EventType } from "../models/notification.entity";
import { NotificationContents } from "../enums/notification-contents.enum";
import { NotificationPreference } from "../models/user.entity";
import { TelephonyData } from "../models/telephony-data.entity";
import { TelephonyDataService } from "./telephony-data.service";
import { ContractType } from "../models/contract.entity";
import { Customer } from "../models/customer.entity";
import { ValidationService } from "./validation.service";
import {
  NotFoundError,
  ValidationError,
  BusinessRuleError,
} from "../errors/app-errors";
import { ErrorMessages } from "../errors/error-messages";

export module ContractsService {
  export const count = async (): Promise<number> => {
    const contractRepository = dataSource.getRepository(Contract);
    return await contractRepository.count();
  };

  /**
   * Valida los datos de un contrato antes de crear/actualizar
   */
  const validateContractData = async (
    contractData: Partial<Contract>,
    isCreate: boolean = true
  ): Promise<void> => {
    // Validar tipo de contrato
    if (isCreate || contractData.type !== undefined) {
      ValidationService.required(contractData.type, "type", "Tipo de contrato");
      if (contractData.type) {
        ValidationService.oneOf(
          contractData.type,
          [ContractType.LUZ, ContractType.GAS, ContractType.TELEFONIA],
          "type",
          "Tipo de contrato"
        );
      }
    }

    // Validar CUPS para contratos de Luz o Gas
    if (contractData.type && contractData.type !== ContractType.TELEFONIA) {
      if (isCreate && !contractData.isDraft) {
        ValidationService.required(contractData.cups, "cups", "CUPS");
      }
      if (contractData.cups) {
        ValidationService.cups(contractData.cups, "cups", "CUPS");
      }
    }

    // Validar datos de telefonía para contratos de Telefonía
    if (contractData.type === ContractType.TELEFONIA && isCreate && !contractData.isDraft) {
      if (!contractData.telephonyData) {
        throw new ValidationError(ErrorMessages.Contract.TELEPHONY_DATA_REQUIRED, {
          field: "telephonyData",
        });
      }
    }

    // Validar que el usuario exista
    if (contractData.userId) {
      await ValidationService.userExists(contractData.userId, "Contrato");
    }

    // Validar que el cliente exista (obligatorio para contratos no borrador)
    if (isCreate && !contractData.isDraft && !contractData.customerId) {
      throw new ValidationError(ErrorMessages.Contract.CUSTOMER_REQUIRED, {
        field: "customerId",
      });
    }
    if (contractData.customerId) {
      await ValidationService.customerExists(contractData.customerId, "Contrato");
    }

    // Validar que la tarifa exista
    if (contractData.rateId) {
      await ValidationService.rateExists(contractData.rateId, "Contrato");
    }

    // Validar que la compañía exista
    if (contractData.companyId) {
      await ValidationService.companyExists(contractData.companyId, "Contrato");
    }

    // Validar que el canal exista
    if (contractData.channelId) {
      await ValidationService.channelExists(contractData.channelId, "Contrato");
    }
  };

  export const create = async (contractData: Partial<Contract>): Promise<Contract> => {
    const contractRepository = dataSource.getRepository(Contract);

    // Validar datos del contrato
    await validateContractData(contractData, true);

    if (!contractData?.contractStateId && !contractData?.isDraft) {
      const { id: contractStateId } = await ContractStatesService.get({
        default: true,
      });
      contractData.contractStateId = contractStateId;
    }

    if (contractData?.rateId) {
      const rate = await RatesService.get({ id: contractData.rateId });

      if (rate.renewable) {
        await NotificationsService.create(
          {
            eventType: EventType.OTHER,
            content: NotificationContents.ContractRenew(contractData.cups),
            userId: contractData.userId,
            startDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          },
          NotificationPreference.RENEW_PAYMENT
        );
      }
    }

    let newContract;

    if (contractData.type === ContractType.TELEFONIA) {
      const telephonyDataRepository = dataSource.getRepository(TelephonyData);
      const { telephonyData } = contractData;

      const telephonyDataId = await TelephonyDataService.create(telephonyData);
      const telephonyDataEntity = telephonyDataRepository.create({
        ...telephonyData,
        id: telephonyDataId,
      });

      await telephonyDataRepository.save(telephonyDataEntity);

      newContract = contractRepository.create({
        ...contractData,
        telephonyData: telephonyDataEntity,
      });
    } else {
      newContract = contractRepository.create(contractData);
    }

    const savedContract = await contractRepository.save(newContract);

    if (savedContract.isDraft) {
      ContractLogsService.create({
        log: ContractLogs.DraftCreated,
        contractId: savedContract.id,
      });
    } else {
      ContractLogsService.create({
        log: ContractLogs.NoDraftCreated,
        contractId: savedContract.id,
      });
    }
    return savedContract;
  };

  export const getOne = async (
    where: FindOptionsWhere<Contract>,
    relations: FindOptionsRelations<Contract> = {}
  ): Promise<Contract | null> => {
    const contractRepository = dataSource.getRepository(Contract);

    const contractFound = await contractRepository.findOne({
      where,
      relations,
    });

    if (!contractFound) {
      const identifier = where.uuid || where.id;
      throw new NotFoundError("Contrato", identifier?.toString());
    }

    return contractFound;
  };

  export const getMany = async (
    where: FindOptionsWhere<Contract>,
    relations: FindOptionsRelations<Contract> = {}
  ): Promise<Contract[]> => {
    const contractRepository = dataSource.getRepository(Contract);

    return await contractRepository.find({
      where,
      relations,
    });
  };

  export const getVisibleContracts = async (
    userId: number,
    isManager: boolean,
    groupId: number,
    pagination: { page: number; limit: number },
    relations: FindOptionsRelations<Contract> = {}
  ): Promise<{
    contracts: Contract[];
    columnsOrder: string[];
    total: number;
    page: number;
    lastPage: number;
  }> => {
    const contractRepository = dataSource.getRepository(Contract);

    const visibleUsersIds = await UsersService.getVisibleUserIds(userId, isManager, groupId);

    const { columnsOrder } =
      await UserContractPreferencesService.getUserColumnsPreferences(userId);

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [contracts, total] = await contractRepository.findAndCount({
      where: { userId: In(visibleUsersIds) },
      order: { createdAt: "DESC" },
      relations,
      skip,
      take: limit,
    });

    const lastPage = Math.ceil(total / limit);

    return {
      contracts,
      columnsOrder,
      total,
      page,
      lastPage,
    };
  };

  export const update = async (
    contractUuid: string,
    contractData: Partial<Contract>,
    updatedByUserId: number
  ): Promise<Contract> => {
    const contractRepository = dataSource.getRepository(Contract);
    const contractToUpdate = await contractRepository.findOne({
      where: { uuid: contractUuid },
      relations: { user: true, rate: true, customer: true, telephonyData: { rates: true } },
    });

    if (!contractToUpdate) {
      throw new NotFoundError("Contrato", contractUuid);
    }

    // Validar datos del contrato (excepto campos que no se pueden cambiar)
    await validateContractData(contractData, false);

    if (contractData.telephonyData) {
      Object.assign(contractToUpdate.telephonyData, contractData.telephonyData);
      await dataSource.getRepository(TelephonyData).save(contractToUpdate.telephonyData);
      delete contractData.telephonyData;
    }

    if (contractData?.isDraft === false && !contractToUpdate?.contractStateId) {
      const { id: contractStateId } = await ContractStatesService.get({
        default: true,
      });
      contractData.contractStateId = contractStateId;
    } else if (contractData.isDraft === true && contractToUpdate.isDraft === false) {
      contractData.contractStateId = null;
    }

    // Log contract state change
    const oldContractStateId = contractToUpdate.contractStateId;
    const newContractStateId = contractData?.contractStateId;

    if (newContractStateId !== undefined && newContractStateId !== null) {
      // Notify "Activo" contract
      if (newContractStateId === 5) {
        const renewDays = getRenewDaysForContract(contractToUpdate);

        const today = new Date();
        today.setDate(today.getDate() + renewDays);
        contractData.expiresAt = today;

        const contractUrl = `${process.env.API_URL_CONTRACT}/contratos/${contractToUpdate?.customer?.uuid}/${contractToUpdate.uuid}`;

        await NotificationsService.create(
          {
            sourceUrl: contractUrl,
            eventType: EventType.OTHER,
            content: NotificationContents.ContractExpired(contractToUpdate.cups),
            userId: contractToUpdate.userId,
            startDate: today,
          },
          NotificationPreference.CONTRACT_EXPIRATION
        );

        await NotificationsService.create(
          {
            sourceUrl: contractUrl,
            eventType: EventType.OTHER,
            content: NotificationContents.ContractActivated(contractToUpdate.cups),
            userId: contractToUpdate.userId,
          },
          NotificationPreference.CONTRACT_ACTIVATED
        );
      }

      const contractStates: ContractState[] = await ContractStatesService.getAll();

      const oldState = oldContractStateId
        ? contractStates.find((state) => state.id === oldContractStateId)
        : null;

      const newState = contractStates.find((state) => state.id === newContractStateId);

      if (newState) {
        const updatedByUser = await UsersService.getOne({ id: updatedByUserId });

        const logContent = ContractLogs.ContractStateChanged(
          `${updatedByUser.name} ${updatedByUser.firstSurname}`,
          contractToUpdate?.cups || "",
          oldState?.name || "Sin estado",
          newState.name
        );

        await ContractLogsService.create({
          log: logContent,
          contractId: contractToUpdate.id,
        });

        const contractUrl = `${process.env.API_URL_CONTRACT}/contratos/${contractToUpdate?.customer?.uuid}/${contractToUpdate.uuid}`;

        await NotificationsService.createStateChangeNotification(
          contractToUpdate.userId,
          contractToUpdate?.cups || "",
          contractUrl,
          oldState?.name || "Sin estado",
          newState.name,
          updatedByUser
        );
      }
    }

    Object.assign(contractToUpdate, contractData);
    delete contractToUpdate.rate;

    const updatedContract = await contractRepository.save(contractToUpdate);

    return updatedContract;
  };

  const getRenewDaysForContract = (contract: Contract): number => {
    if (contract.type === ContractType.TELEFONIA) {
      const telephonyRates = contract.telephonyData?.rates;
      if (!telephonyRates || telephonyRates.length === 0) {
        throw new BusinessRuleError(
          ErrorMessages.Contract.NO_TELEPHONY_RATES,
          "CONTRACT_NO_TELEPHONY_RATES",
          { contractId: contract.id, contractType: contract.type }
        );
      }
      return telephonyRates[0].renewDays;
    } else {
      if (!contract.rate) {
        throw new BusinessRuleError(
          ErrorMessages.Contract.NO_RATE_FOR_RENEW,
          "CONTRACT_NO_RATE",
          { contractId: contract.id }
        );
      }
      return contract.rate.renewDays;
    }
  };

  export const renew = async (contractUuid: string, rateId: number): Promise<Contract> => {
    const contractRepository = dataSource.getRepository(Contract);
    const contractToUpdate = await contractRepository.findOne({
      where: { uuid: contractUuid },
    });

    if (!contractToUpdate) {
      throw new NotFoundError("Contrato", contractUuid);
    }

    // Validar que la tarifa exista
    await ValidationService.rateExists(rateId, "Contrato");

    const rate = await RatesService.get({ id: rateId }, { company: true });

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + rate.renewDays);

    const updatedContract = await contractRepository.save({
      ...contractToUpdate,
      rateId,
      companyId: rate.companyId,
      expiresAt: expirationDate,
    });

    await ContractHistoryService.create({
      rateName: rate.name,
      companyName: rate.company.name,
      status: ContractHistoryStatus.RENOVADO,
      contractId: contractToUpdate.id,
    });

    await NotificationsService.create(
      {
        eventType: EventType.OTHER,
        content: NotificationContents.ContractExpired(contractToUpdate.cups),
        userId: contractToUpdate.userId,
        startDate: expirationDate,
      },
      NotificationPreference.CONTRACT_EXPIRATION
    );

    return updatedContract;
  };

  export const remove = async (contractUuid: string): Promise<boolean> => {
    const contractRepository = dataSource.getRepository(Contract);
    const deleteResult = await contractRepository.delete({
      uuid: contractUuid,
    });

    if (deleteResult.affected === 0) {
      throw new NotFoundError("Contrato", contractUuid);
    }

    return true;
  };

  export const renewContract = async (
    contractUuid: string
  ): Promise<Contract> => {
    const contractRepository = dataSource.getRepository(Contract);

    const originalContract = await contractRepository.findOne({
      where: { uuid: contractUuid },
      relations: { customer: true, user: true },
    });

    if (!originalContract) {
      throw new NotFoundError("Contrato", contractUuid);
    }

    if (originalContract.isRenewed) {
      throw new BusinessRuleError(
        "Este contrato ya ha sido renovado",
        "CONTRACT_ALREADY_RENEWED",
        { contractId: originalContract.id }
      );
    }

    // Crear el nuevo contrato (copia) manteniendo el mismo cliente
    const { id, uuid, createdAt, updatedAt, customer, user, renewedTo, renewedFrom, ...contractData } = originalContract;

    const newContract = contractRepository.create({
      ...contractData,
      isRenewed: false,
      renewedToId: null,
      renewedFromId: originalContract.id,
    });

    const savedNewContract = await contractRepository.save(newContract);

    // Marcar el contrato original como renovado y enlazar al nuevo
    originalContract.isRenewed = true;
    originalContract.renewedToId = savedNewContract.id;
    await contractRepository.save(originalContract);

    // Crear log de renovación
    await ContractLogsService.create({
      log: `Contrato renovado. Nuevo contrato creado con ID: ${savedNewContract.uuid}`,
      contractId: originalContract.id,
    });

    await ContractLogsService.create({
      log: `Contrato creado por renovación del contrato anterior: ${originalContract.uuid}`,
      contractId: savedNewContract.id,
    });

    return savedNewContract;
  };

  export const cloneContract = async (
    contractUuid: string,
    newUserId: number
  ): Promise<Contract> => {
    const contractRepository = dataSource.getRepository(Contract);
    const customerRepository = dataSource.getRepository(Customer);

    // Validar que el nuevo usuario exista
    await ValidationService.userExists(newUserId, "Contrato clonado");

    const originalContract = await contractRepository.findOne({
      where: { uuid: contractUuid },
      relations: { customer: true },
    });

    if (!originalContract) {
      throw new NotFoundError("Contrato", contractUuid);
    }

    let newCustomerId: number | null = originalContract?.customerId;

    const originalCustomer = originalContract.customer;

    if (originalCustomer) {
      const { id, uuid, ...customerData } = originalCustomer;

      const newCustomer = customerRepository.create({
        ...customerData,
      });

      const savedNewCustomer = await customerRepository.save(newCustomer);
      newCustomerId = savedNewCustomer.id;
    }
    const { id, uuid, createdAt, updatedAt, customer, ...contractData } = originalContract;

    const newContract = contractRepository.create({
      ...contractData,
      userId: newUserId,
      customerId: newCustomerId,
      isDraft: true,
      contractStateId: null,
      expiresAt: null,
    });

    return await contractRepository.save(newContract);
  };
}
