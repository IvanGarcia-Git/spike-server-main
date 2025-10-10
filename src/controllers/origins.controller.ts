import { Roles } from "../enums/roles.enum";
import { OriginsService } from "../services/origins.service";

export module OriginsController {
  export const create = async (req, res, next) => {
    try {
      const { groupId } = req.user;

      if (groupId != Roles.Admin) {
        res.status(403).send("unauthorized");
        return;
      }

      const originData = req.body;

      const origin = await OriginsService.create(originData);
      res.json(origin);
    } catch (error) {
      next(error);
    }
  };

  export const getAll = async (req, res, next) => {
    try {
      const origins = await OriginsService.getAll();

      res.json(origins);
    } catch (error) {
      next(error);
    }
  };

  export const deleteOrigin = async (req, res, next) => {
    try {
      const { groupId } = req.user;

      if (groupId != Roles.Admin) {
        res.status(403).send("unauthorized");
        return;
      }

      const { id } = req.params;

      const deleted = await OriginsService.remove(
        Number(id)
      );
      res.json({ deleted });
    } catch (error) {
      next(error);
    }
  };
}
