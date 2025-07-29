import { ContractCommentService } from "../services/contract-comment.service";

export module ContractCommentsController {
  export const create = async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { contractUuid } = req.params;

      const contractCommentData = req.body;
      contractCommentData.userId = userId;

      const commentFile: Express.Multer.File = req.file;

      const newContractComment = await ContractCommentService.create(
        contractCommentData,
        contractUuid,
        commentFile
      );

      res.status(201).json(newContractComment);
    } catch (error) {
      next(error);
    }
  };
}
