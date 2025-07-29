import { dataSource } from "../../app-data-source";
import { UserLiquidationPreference } from "../models/user-liquidation-preference.entity";

export module UserLiquidationPreferencesController {
  export const setUserLiquidationPreferences = async (req, res, next) => {
    try {
      const { userId, columns } = req.body;

      if (!Array.isArray(columns) || columns.length === 0) {
        return res
          .status(400)
          .json({ error: "Columns must be a non-empty array" });
      }

      const userLiquidationPreferencesRepository = dataSource.getRepository(
        UserLiquidationPreference
      );

      let preferences = await userLiquidationPreferencesRepository.findOne({
        where: { userId },
      });

      if (!preferences) {
        preferences = userLiquidationPreferencesRepository.create({
          userId,
          columns,
        });
      } else {
        preferences.columns = columns;
      }

      await userLiquidationPreferencesRepository.save(preferences);

      res.status(200).json({ message: "Preferences updated successfully" });
    } catch (error) {
      next(error);
    }
  };

  export const getUserLiquidationPreferences = async (req, res, next) => {
    try {
      const { userId } = req.params;

      const userLiquidationPreferencesRepository = dataSource.getRepository(
        UserLiquidationPreference
      );

      let columns = [
        "userName",
        "updatedAt",
        "customerFullName",
        "extraInfo",
        "contractStateName",
        "payed",
        "channelName",
      ];

      const preferences = await userLiquidationPreferencesRepository.findOne({
        where: { userId },
      });

      if (preferences) {
        columns = preferences.columns;
      }

      res.status(200).json({ columns });
    } catch (error) {
      next(error);
    }
  };
}
