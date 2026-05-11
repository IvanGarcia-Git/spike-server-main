import { AwsHelper } from "../helpers/aws.helper";
import { Company } from "../models/company.entity";
import { dataSource } from "../../app-data-source";
import { FindOptionsWhere } from "typeorm";

export module CompaniesService {
  export const create = async (
    companyData: Partial<Company>,
    companyImage?: Express.Multer.File
  ): Promise<Company> => {
    try {
      const companyRepository = dataSource.getRepository(Company);

      if (companyImage) {
        companyData.imageUri = await AwsHelper.uploadImageToS3(
          "company",
          companyImage
        );
      } else {
        // El body de la petición no debe poder fijar la clave del logo.
        delete companyData.imageUri;
      }

      const newCompany = companyRepository.create(companyData);

      const savedCompany = await companyRepository.save(newCompany);

      if (savedCompany?.imageUri) {
        savedCompany.imageUri = AwsHelper.getPresignedUrl(savedCompany.imageUri);
      }

      return savedCompany;
    } catch (error) {
      throw error;
    }
  };

  export const get = async (
    where: FindOptionsWhere<Company>
  ): Promise<Company> => {
    try {
      const companyRepository = dataSource.getRepository(Company);

      const companyFound = await companyRepository.findOne({
        where,
        relations: { rates: true },
      });

      if (!companyFound) {
        throw new Error("company-not-found");
      }

      if (companyFound?.imageUri) {
        companyFound.imageUri = AwsHelper.getPresignedUrl(
          companyFound.imageUri
        );
      }

      return companyFound;
    } catch (error) {
      throw error;
    }
  };

  export const getAll = async (): Promise<Company[]> => {
    try {
      const companyRepository = dataSource.getRepository(Company);

      const companiesFound: Company[] = await companyRepository.find();

      for (const companyFound of companiesFound) {
        if (companyFound?.imageUri) {
          companyFound.imageUri = AwsHelper.getPresignedUrl(
            companyFound.imageUri
          );
        }
      }

      return companiesFound;
    } catch (error) {
      throw error;
    }
  };

  export const update = async (
    uuid: string,
    companyData: Partial<Company>,
    companyImage?: Express.Multer.File
  ): Promise<Company> => {
    try {
      const companyRepository = dataSource.getRepository(Company);

      const company = await companyRepository.findOne({ where: { uuid } });

      if (!company) {
        throw new Error("company-not-found");
      }

      if (companyImage) {
        companyData.imageUri = await AwsHelper.uploadImageToS3(
          "company",
          companyImage
        );
      } else {
        // Sin imagen nueva: no permitir que el body pise el logo ya guardado.
        delete companyData.imageUri;
      }

      Object.assign(company, companyData);

      const updatedCompany = await companyRepository.save(company);

      if (updatedCompany?.imageUri) {
        updatedCompany.imageUri = AwsHelper.getPresignedUrl(
          updatedCompany.imageUri
        );
      }

      return updatedCompany;
    } catch (error) {
      throw error;
    }
  };

  export const deleteCompany = async (id: number): Promise<boolean> => {
    try {
      const companyRepository = dataSource.getRepository(Company);

      const company = await companyRepository.findOne({ where: { id } });

      if (!company) {
        throw new Error("company-not-found");
      }

      await companyRepository.remove(company);

      return true;
    } catch (error) {
      throw error;
    }
  };
}
