import { dataSource } from "../../app-data-source";
import { UserContractPreference } from "../models/user-contract-preference.entity";

export module UserContractPreferencesController {
  export const setUserContractPreferences = async (req, res, next) => {
    try {
      const { userId, columns } = req.body;

      if (!Array.isArray(columns) || columns.length === 0) {
        return res
          .status(400)
          .json({ error: "Columns must be a non-empty array" });
      }

      const userContractPreferencesRepository = dataSource.getRepository(
        UserContractPreference
      );

      let preferences = await userContractPreferencesRepository.findOne({
        where: { userId },
      });

      if (!preferences) {
        preferences = userContractPreferencesRepository.create({
          userId,
          columns,
        });
      } else {
        preferences.columns = columns;
      }

      await userContractPreferencesRepository.save(preferences);

      res.status(200).json({ message: "Preferences updated successfully" });
    } catch (error) {
      next(error);
    }
  };

  export const getUserContractPreferences = async (req, res, next) => {
    try {
      const { userId } = req.params;

      const userContractPreferencesRepository = dataSource.getRepository(
        UserContractPreference
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

      const preferences = await userContractPreferencesRepository.findOne({
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
