import { CompaniesService } from "../services/companies.service";
import { Roles } from "../enums/roles.enum";

export module CompaniesController {
  export const create = async (req, res, next) => {
    try {
      const { groupId } = req.user;

      if (groupId != Roles.SuperAdmin) {
        res.status(403).send("unauthorized");
        return;
      }
      const companyImage: Express.Multer.File = req.file;
      const companyData = req.body;

      const newCompany = await CompaniesService.create(
        companyData,
        companyImage
      );

      res.status(201).json(newCompany);
    } catch (error) {
      next(error);
    }
  };

  export const get = async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const company = await CompaniesService.get({ uuid });

      res.json(company);
    } catch (error) {
      next(error);
    }
  };

  export const getAll = async (req, res, next) => {
    try {
      const companies = await CompaniesService.getAll();
      res.json(companies);
    } catch (error) {
      next(error);
    }
  };

  export const update = async (req, res, next) => {
    try {
      const { groupId } = req.user;

      if (groupId != Roles.SuperAdmin) {
        res.status(403).send("unauthorized");
        return;
      }

      const { uuid } = req.params;
      const companyImage: Express.Multer.File = req.file;
      const companyData = req.body;

      const updatedCompany = await CompaniesService.update(
        uuid,
        companyData,
        companyImage
      );

      res.json(updatedCompany);
    } catch (error) {
      next(error);
    }
  };

  export const deleteCompany = async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await CompaniesService.deleteCompany(id);

      res.json({ deleted });
    } catch (error) {
      next(error);
    }
  };
}
