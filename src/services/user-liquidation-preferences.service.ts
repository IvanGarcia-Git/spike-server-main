import { dataSource } from "../../app-data-source";
import { UserLiquidationPreference } from "../models/user-liquidation-preference.entity";

export module UserLiquidationPreferencesService {
  export const getUserColumnsPreferences = async (
    userId: number
  ): Promise<{ columnsOrder: string[] }> => {
    try {
      const userLiquidationPreferencesRepository = dataSource.getRepository(
        UserLiquidationPreference
      );

      const userLiquidationPreferences =
        await userLiquidationPreferencesRepository.findOne({ where: { userId } });

      const selectedColumns = userLiquidationPreferences?.columns || [
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
