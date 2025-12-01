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

export module ContractsService {
  export const count = async (): Promise<number> => {
    const contractRepository = dataSource.getRepository(Contract);
    return await contractRepository.count();
  };

  export const create = async (contractData: Partial<Contract>): Promise<Contract> => {
    try {
      const contractRepository = dataSource.getRepository(Contract);

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

      if (contractData.type === "Telefonía") {
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
    } catch (error) {
      throw error;
    }
  };

  export const getOne = async (
    where: FindOptionsWhere<Contract>,
    relations: FindOptionsRelations<Contract> = {}
  ): Promise<Contract | null> => {
    try {
      const contractRepository = dataSource.getRepository(Contract);

      const contractFound = await contractRepository.findOne({
        where,
        relations,
      });

      if (!contractFound) {
        throw new Error("contract-not-found");
      }

      return contractFound;
    } catch (error) {
      throw error;
    }
  };

  export const getMany = async (
    where: FindOptionsWhere<Contract>,
    relations: FindOptionsRelations<Contract> = {}
  ): Promise<Contract[]> => {
    try {
      const contractRepository = dataSource.getRepository(Contract);

      return await contractRepository.find({
        where,
        relations,
      });
    } catch (error) {
      throw error;
    }
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
    try {
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
    } catch (error) {
      throw error;
    }
  };

  export const update = async (
    contractUuid: string,
    contractData: Partial<Contract>,
    updatedByUserId: number
  ): Promise<Contract> => {
    try {
      const contractRepository = dataSource.getRepository(Contract);
      const contractToUpdate = await contractRepository.findOne({
        where: { uuid: contractUuid },
        relations: { user: true, rate: true, customer: true, telephonyData: { rates: true } },
      });

      if (contractData.telephonyData) {
        Object.assign(contractToUpdate.telephonyData, contractData.telephonyData);
        await dataSource.getRepository(TelephonyData).save(contractToUpdate.telephonyData);
        delete contractData.telephonyData;
      }

      if (!contractToUpdate) {
        throw new Error(`Contract with UUID ${contractUuid} not found`);
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
    } catch (error) {
      throw error;
    }
  };

  const getRenewDaysForContract = (contract: Contract): number => {
    if (contract.type === ContractType.TELEFONIA) {
      const telephonyRates = contract.telephonyData?.rates;
      if (!telephonyRates || telephonyRates.length === 0) {
        throw new Error("Contrato de telefonía sin tarifas asociadas.");
      }
      return telephonyRates[0].renewDays;
    } else {
      if (!contract.rate) {
        throw new Error("Contrato sin tarifa asignada.");
      }
      return contract.rate.renewDays;
    }
  };

  export const renew = async (contractUuid: string, rateId: number): Promise<Contract> => {
    try {
      const contractRepository = dataSource.getRepository(Contract);
      const contractToUpdate = await contractRepository.findOne({
        where: { uuid: contractUuid },
      });

      if (!contractToUpdate) {
        throw new Error(`Contract with UUID ${contractUuid} not found`);
      }

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
    } catch (error) {
      throw error;
    }
  };

  export const remove = async (contractUuid: string): Promise<boolean> => {
    try {
      const contractRepository = dataSource.getRepository(Contract);
      const deleteResult = await contractRepository.delete({
        uuid: contractUuid,
      });

      if (deleteResult.affected === 0) {
        throw new Error(`Contract with UUID ${contractUuid} not found`);
      }

      return true;
    } catch (error) {
      throw error;
    }
  };

  export const cloneContract = async (
    contractUuid: string,
    newUserId: number
  ): Promise<Contract> => {
    const contractRepository = dataSource.getRepository(Contract);
    const customerRepository = dataSource.getRepository(Customer);

    const originalContract = await contractRepository.findOne({
      where: { uuid: contractUuid },
      relations: { customer: true },
    });

    if (!originalContract) {
      throw new Error("contract-not-found");
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
