import { dataSource } from "../../app-data-source";
import { Contract } from "../models/contract.entity";
import { ContractSearchDTO } from "../dto/contract-search.dto";
import { Customer } from "../models/customer.entity";
import {
  Between,
  FindOptionsOrder,
  FindOptionsWhere,
  In,
  IsNull,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Repository,
} from "typeorm";
import { LeadCall } from "../models/lead-call.entity";
import { LeadCallsService } from "./lead-calls.service";
import { Reminder } from "../models/reminder.entity";
import { RemindersService } from "./reminders.service";
import { Task } from "../models/task.entity";
import { TasksService } from "./tasks.service";
import { UsersService } from "./users.service";
import { Rate } from "../models/rate.entity";
import { AgentUserVisibleUserService } from "./user-agent-visible-user.service";
import { Liquidation } from "../models/liquidation.entity";
import { LiquidationContract } from "../models/liquidation-contract.entity";

export module GlobalSearchService {
  export const search = async (
    searchText: string,
    contractSearchParams: ContractSearchDTO,
    userData: { userId: number; groupId: number; isManager: boolean },
    page: number = 1,
    limit: number = 10,
    liquidacionUuid?: string
  ): Promise<{
    contracts: Contract[];
    total: number;
    page: number;
    lastPage: number;
  }> => {
    let customerIds: number[] = [];

    if (searchText) {
      const customers = await searchCustomers(searchText);
      customerIds = customers.map((customer) => customer.id);
    }

    const contractSearchConditions: ContractSearchDTO = {
      ...contractSearchParams,
      customerIds,
    };

    const visibleUsersIds: number[] = await UsersService.getVisibleUserIds(
      userData.userId,
      userData.isManager,
      userData.groupId
    );

    return await searchContracts(
      contractSearchConditions,
      searchText,
      visibleUsersIds,
      page,
      limit,
      liquidacionUuid
    );
  };

  export const searchCalendarData = async (
    userIds: number[],
    startDate: Date,
    endDate: Date
  ): Promise<{
    tasks: Task[];
    reminders: Reminder[];
    leadCalls: LeadCall[];
  }> => {
    try {
      const tasksFound = await TasksService.getMany(
        {
          assigneeUserId: In(userIds),
          startDate: Between(startDate, endDate),
        },
        { assigneeUser: true }
      );

      const remindersFound = await RemindersService.getMany(
        {
          userId: In(userIds),
          startDate: Between(startDate, endDate),
        },
        { user: true }
      );

      const leadCallsFound = await LeadCallsService.getMany(
        {
          userId: In(userIds),
          startDate: Between(startDate, endDate),
        },
        { user: true }
      );

      return {
        tasks: tasksFound,
        reminders: remindersFound,
        leadCalls: leadCallsFound,
      };
    } catch (error) {
      throw new Error(`Error fetching calendar data: ${error.message}`);
    }
  };

  export const getVisibleUserIdsForCalendar = async (
    userId: number,
    isManager: boolean,
    groupId: number
  ): Promise<number[]> => {
    try {
      // Always include current user
      const visibleUserIds = new Set<number>([userId]);

      if (isManager) {
        // Managers can see their team
        const teamUserIds = await UsersService.getVisibleUserIds(userId, isManager, groupId);
        teamUserIds.forEach((id) => visibleUserIds.add(id));
      } else {
        // Non-managers can see users configured in agent visibility
        const agentVisibleUsers = await AgentUserVisibleUserService.getMany(
          { agentId: userId },
          { visibleUser: true }
        );
        agentVisibleUsers.forEach((relation) => {
          if (relation.visibleUser) {
            visibleUserIds.add(relation.visibleUser.id);
          }
        });
      }

      return Array.from(visibleUserIds);
    } catch (error) {
      throw new Error(`Error getting visible user IDs: ${error.message}`);
    }
  };

  //Private functions
  const searchCustomers = async (searchText: string): Promise<Customer[]> => {
    const customerRepository = dataSource.getRepository(Customer);

    const normalizedSearchText = searchText.trim().replace(/\s+/g, " ");

    return await customerRepository
      .createQueryBuilder("customer")
      .where("CONCAT(TRIM(customer.name), ' ', TRIM(customer.surnames)) LIKE :searchText", {
        searchText: `%${normalizedSearchText}%`,
      })
      .orWhere("customer.name LIKE :searchText", { searchText: `%${normalizedSearchText}%` })
      .orWhere("customer.surnames LIKE :searchText", { searchText: `%${normalizedSearchText}%` })
      .orWhere("customer.nationalId LIKE :searchText", { searchText: `%${normalizedSearchText}%` })
      .orWhere("customer.email LIKE :searchText", { searchText: `%${normalizedSearchText}%` })
      .orWhere("customer.address LIKE :searchText", { searchText: `%${normalizedSearchText}%` })
      .orWhere("customer.phoneNumber LIKE :searchText", { searchText: `%${normalizedSearchText}%` })
      .orWhere("customer.iban LIKE :searchText", { searchText: `%${normalizedSearchText}%` })
      .orWhere("customer.cif LIKE :searchText", { searchText: `%${normalizedSearchText}%` })
      .orWhere("customer.tradeName LIKE :searchText", { searchText: `%${normalizedSearchText}%` })
      .getMany();
  };

  export const searchContracts = async (
    searchParams: ContractSearchDTO,
    searchText: string,
    visibleUsersIds: number[],
    page: number,
    limit: number,
    liquidacionUuid?: string
  ): Promise<{
    contracts: Contract[];
    total: number;
    page: number;
    lastPage: number;
  }> => {
    const contractRepository: Repository<Contract> = dataSource.getRepository(Contract);

    // Si hay filtro por liquidación, primero obtener el ID de la liquidación
    let liquidationId: number | null = null;
    if (liquidacionUuid) {
      const liquidationRepository = dataSource.getRepository(Liquidation);
      const liquidation = await liquidationRepository.findOne({
        where: { uuid: liquidacionUuid },
      });
      if (!liquidation) {
        return { contracts: [], total: 0, page, lastPage: 1 };
      }
      liquidationId = liquidation.id;
    }

    let whereCondition: FindOptionsWhere<Contract> = {};

    if (searchText) {
      if (searchParams.customerIds.length > 0) {
        whereCondition.customerId = In(searchParams.customerIds);
      } else {
        whereCondition.cups = Like(`%${searchText}%`);
      }
    }

    if (typeof searchParams.payed !== "undefined") {
      whereCondition.payed = searchParams.payed;
    }

    if (searchParams.type) {
      whereCondition.type = searchParams.type;
    }

    if (searchParams.product) {
      whereCondition.product = searchParams.product;
    }

    if (searchParams.solarPlates) {
      whereCondition.solarPlates = searchParams.solarPlates;
    }

    if (searchParams.from && searchParams.to) {
      const fromDate = new Date(searchParams.from);
      const toDate = new Date(searchParams.to);
      toDate.setUTCHours(23, 59, 59, 999);
      const dateField = searchParams.order === "createdAt" ? "createdAt" : "updatedAt";
      whereCondition[dateField] = Between(fromDate, toDate);
    } else if (searchParams.from) {
      const fromDate = new Date(searchParams.from);
      const dateField = searchParams.order === "createdAt" ? "createdAt" : "updatedAt";
      whereCondition[dateField] = MoreThanOrEqual(fromDate);
    } else if (searchParams.to) {
      const toDate = new Date(searchParams.to);
      toDate.setUTCHours(23, 59, 59, 999);
      const dateField = searchParams.order === "createdAt" ? "createdAt" : "updatedAt";
      whereCondition[dateField] = LessThanOrEqual(toDate);
    }

    //Apply external entities filters
    let customerCondition: FindOptionsWhere<Customer> = {};

    if (searchParams.customerType) {
      customerCondition.type = searchParams.customerType;
    }

    if (searchParams.customerProvince) {
      customerCondition.province = searchParams.customerProvince;
    }

    if (
      searchParams.originIds &&
      Array.isArray(searchParams.originIds) &&
      searchParams.originIds.length > 0
    ) {
      customerCondition.originId = In(searchParams.originIds);
    }

    if (Object.keys(customerCondition).length > 0) {
      whereCondition.customer = customerCondition;
    }

    let rateCondition: FindOptionsWhere<Rate> = {};

    if (searchParams.rateType) {
      rateCondition.type = searchParams.rateType;
    }
    if (Object.keys(rateCondition).length > 0) {
      whereCondition.rate = rateCondition;
    }

    const query = contractRepository
      .createQueryBuilder("contract")
      .leftJoinAndSelect("contract.rate", "rate")
      .leftJoinAndSelect("rate.channel", "rateChannel")
      .leftJoinAndSelect("contract.customer", "customer")
      .leftJoinAndSelect("contract.user", "user")
      .leftJoinAndSelect("contract.company", "company")
      .leftJoinAndSelect("contract.channel", "channel")
      .leftJoinAndSelect("contract.contractState", "contractState")
      .leftJoinAndSelect("contract.telephonyData", "telephonyData")
      .leftJoinAndSelect("telephonyData.rates", "allRates")
      .leftJoin("telephonyData.rates", "rates")
      .where(whereCondition);

    // Si hay filtro por liquidación, añadir INNER JOIN para filtrar solo contratos de esa liquidación
    if (liquidationId) {
      query.innerJoin(
        LiquidationContract,
        "lc",
        "lc.contractId = contract.id AND lc.liquidationId = :liquidationId",
        { liquidationId }
      );
    }

    const powerSubQuery =
      "(SELECT MAX(CAST(power_values.val AS DECIMAL(10, 3))) FROM JSON_TABLE(contract.contractedPowers, '$[*]' COLUMNS (val DECIMAL(10, 3) PATH '$')) as power_values)";

    if (searchParams.contractPowerFrom && searchParams.contractPowerTo) {
      query
        .andWhere("JSON_LENGTH(contract.contractedPowers) > 0")
        .andWhere(`${powerSubQuery} BETWEEN :powerFrom AND :powerTo`, {
          powerFrom: searchParams.contractPowerFrom,
          powerTo: searchParams.contractPowerTo,
        });
    } else if (searchParams.contractPowerFrom) {
      query
        .andWhere("JSON_LENGTH(contract.contractedPowers) > 0")
        .andWhere(`${powerSubQuery} >= :powerFrom`, {
          powerFrom: searchParams.contractPowerFrom,
        });
    } else if (searchParams.contractPowerTo) {
      query
        .andWhere("JSON_LENGTH(contract.contractedPowers) > 0")
        .andWhere(`${powerSubQuery} <= :powerTo`, {
          powerTo: searchParams.contractPowerTo,
        });
    }

    if (searchParams.rateId) {
      query.andWhere(`(contract.rateId = :rateId OR rates.id = :rateId)`, {
        rateId: searchParams.rateId,
      });
    }

    const stateConditions = [];
    const hasStateIds =
      searchParams.contractStateIds &&
      Array.isArray(searchParams.contractStateIds) &&
      searchParams.contractStateIds.length > 0;

    if (hasStateIds) {
      stateConditions.push("contract.contractStateId IN (:...contractStateIds)");
    }
    if (searchParams.includeDrafts) {
      stateConditions.push("contract.isDraft = TRUE");
    }

    if (stateConditions.length > 0) {
      query.andWhere(`(${stateConditions.join(" OR ")})`, {
        contractStateIds: searchParams.contractStateIds,
      });
    }

    if (
      searchParams.contractUserIds &&
      Array.isArray(searchParams.contractUserIds) &&
      searchParams.contractUserIds.length > 0
    ) {
      query.andWhere("contract.userId IN (:...contractUserIds)", {
        contractUserIds: searchParams.contractUserIds.filter((userId) =>
          visibleUsersIds.includes(userId)
        ),
      });
    } else if (Array.isArray(visibleUsersIds) && visibleUsersIds.length > 0) {
      query.andWhere("contract.userId IN (:...visibleUsersIds)", {
        visibleUsersIds,
      });
    }

    if (
      searchParams.companyIds &&
      Array.isArray(searchParams.companyIds) &&
      searchParams.companyIds.length > 0
    ) {
      query.andWhere("contract.companyId IN (:...companyIds)", {
        companyIds: searchParams.companyIds,
      });
    }

    //OR condition for channelId
    if ("channelId" in searchParams) {
      if (searchParams.channelId !== null) {
        query.andWhere(
          "(contract.channelId = :channelId OR (contract.channelId IS NULL AND rate.channelId = :channelId))",
          { channelId: searchParams.channelId }
        );
      } else {
        query.andWhere("contract.channelId IS NULL AND rate.channelId IS NULL");
      }
    }

    const total = await query.getCount();

    if (total === 0) {
      return { contracts: [], total: 0, page, lastPage: 1 };
    }

    const paginatedQuery = query.clone();

    const skip = (page - 1) * limit;

    const orderBy =
      searchParams?.order === "createdAt" ? "contract.createdAt" : "contract.updatedAt";

    const contractIdsResult = await paginatedQuery
      .select("contract.id", "id")
      .orderBy(orderBy, "DESC")
      .skip(skip)
      .take(limit)
      .getRawMany<{ id: number }>();

    const contractIds = contractIdsResult.map((c) => c.id);

    if (contractIds.length === 0) {
      return { contracts: [], total, page, lastPage: Math.ceil(total / limit) };
    }

    const contracts = await contractRepository
      .createQueryBuilder("contract")
      .leftJoinAndSelect("contract.rate", "rate")
      .leftJoinAndSelect("rate.channel", "rateChannel")
      .leftJoinAndSelect("contract.customer", "customer")
      .leftJoinAndSelect("contract.user", "user")
      .leftJoinAndSelect("contract.company", "company")
      .leftJoinAndSelect("contract.channel", "channel")
      .leftJoinAndSelect("contract.contractState", "contractState")
      .leftJoinAndSelect("contract.telephonyData", "telephonyData")
      .leftJoinAndSelect("telephonyData.rates", "allRates")
      .whereInIds(contractIds)
      .skip(skip)
      .take(limit)
      .orderBy(orderBy, "DESC")
      .getMany();

    const lastPage = Math.ceil(total / limit);

    return {
      contracts,
      total,
      page,
      lastPage,
    };
  };
}
