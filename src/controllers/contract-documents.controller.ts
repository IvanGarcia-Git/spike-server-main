import { Contract } from "../models/contract.entity";
import { ContractsService } from "../services/contracts.service";
import { ContractDocumentsService } from "../services/contract-documents.service";

export module ContractDocumentsController {
  export const create = async (req, res, next) => {
    const { contractUuid } = req.body;

    try {
      const contractDocumentFile: Express.Multer.File = req.file;

      const newContractDocument = await ContractDocumentsService.create(
        contractUuid,
        contractDocumentFile
      );

      res.json(newContractDocument);
    } catch (error) {
      next(error);
    }
  };

  export const createBatch = async (req, res, next) => {
    const { contractUuid } = req.body;

    try {
      const contractDocumentFiles: Express.Multer.File[] =
        req.files as Express.Multer.File[];

      if (!contractDocumentFiles || contractDocumentFiles.length === 0) {
        return res.status(400).json({ message: "No files were uploaded." });
      }

      const results = await Promise.all(
        contractDocumentFiles.map(async (file) => {
          try {
            const newContractDocument = await ContractDocumentsService.create(
              contractUuid,
              file
            );
            return {
              fileName: file.originalname,
              success: true,
              data: newContractDocument,
            };
          } catch (error) {
            console.error(`Error processing file ${file.originalname}:`, error);
            return {
              fileName: file.originalname,
              success: false,
              error: error.message,
            };
          }
        })
      );

      res.status(201).json({
        message: "Batch upload processed",
        results,
      });
    } catch (error) {
      next(error);
    }
  };

  export const get = async (req, res, next) => {
    const { contractDocumentUuid } = req.params;

    try {
      const contractDocumentFound = await ContractDocumentsService.get({
        uuid: contractDocumentUuid,
      });

      res.json(contractDocumentFound);
    } catch (error) {
      next(error);
    }
  };

  export const getContractDocuments = async (req, res, next) => {
    const { contractUuid } = req.params;

    try {
      const contractFound: Contract = await ContractsService.getOne({
        uuid: contractUuid,
      });

      const contractDocuments = await ContractDocumentsService.getMany(
        { contractId: contractFound.id },
        {}
      );

      res.json(contractDocuments);
    } catch (error) {
      next(error);
    }
  };

  export const deleteContactDocument = async (req, res, next) => {
    try {
      const { isManager } = req.user;
      if (!isManager) {
        res.status(403).send("unauthorized");
        return;
      }

      const { contractDocumentUuid } = req.body;

      const deleted = await ContractDocumentsService.deleteContractDocument(
        contractDocumentUuid
      );
      res.json({ deleted });
    } catch (error) {
      next(error);
    }
  };
}
