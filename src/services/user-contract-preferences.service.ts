import { dataSource } from "../../app-data-source";
import { UserContractPreference } from "../models/user-contract-preference.entity";

export module UserContractPreferencesService {
  export const getUserColumnsPreferences = async (
    userId: number
  ): Promise<{ columnsOrder: string[] }> => {
    try {
      const userContractPreferenceRepository = dataSource.getRepository(
        UserContractPreference
      );

      const userContractPreferences =
        await userContractPreferenceRepository.findOne({ where: { userId } });

      const selectedColumns = userContractPreferences?.columns || [
        "userName",
        "updatedAt",
        "customerFullName",
        "extraInfo",
        "contractStateName",
        "payed",
        "channelName",
      ];

      return {
        columnsOrder: selectedColumns,
      };
    } catch (error) {
      throw error;
    }
  };
}
