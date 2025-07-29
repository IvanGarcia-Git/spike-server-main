import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

export module AwsHelper {
  export const uploadImageToS3 = async (
    bucketPath: "company" | "channel" | "user",
    image: Express.Multer.File
  ): Promise<string> => {
    const s3 = new AWS.S3();
    const bucketName = process.env.AWS_BUCKET_NAME

    const imageUuid: string = uuidv4();
    const imageName = `${imageUuid}_${image.originalname.replace(/\s/g, "")}`;

    const keyPath = `${bucketPath}/${imageName}`;

    const params = {
      Bucket: bucketName,
      Key: keyPath,
      Body: image.buffer,
      ContentType: image.mimetype,
      ContentEncoding: "binary",
    };

    try {
      await s3.putObject(params).promise();
      return keyPath;
    } catch (err) {
      console.error("Error uploading to S3:", err);
      throw new Error("error-uploading-S3");
    }
  };

  export const uploadContractDocumentToS3 = async (
    contractUuid: string,
    contractDocument: Express.Multer.File
  ): Promise<{ documentUri: string; documentOriginalName: string }> => {
    const s3 = new AWS.S3();
    const bucketName = process.env.AWS_BUCKET_NAME

    const documentUuid: string = uuidv4();
    const documentOriginalName = contractDocument.originalname.replace(
      /\s/g,
      ""
    );
    const documentNameToSave = `${documentUuid}_${documentOriginalName}`;

    const keyPath = `contracts/${contractUuid}/${documentNameToSave}`;

    const params = {
      Bucket: bucketName,
      Key: keyPath,
      Body: contractDocument.buffer,
      ContentType: contractDocument.mimetype,
      ContentEncoding: "binary",
    };

    try {
      await s3.putObject(params).promise();
      return { documentUri: keyPath, documentOriginalName };
    } catch (err) {
      console.error("Error uploading to S3:", err);
      throw new Error("error-uploading-S3");
    }
  };

  export const deleteContractDocumentFromS3 = async (
    documentUri: string
  ): Promise<void> => {
    const s3 = new AWS.S3();
    const bucketName = process.env.AWS_BUCKET_NAME

    const params = {
      Bucket: bucketName,
      Key: documentUri,
    };

    try {
      await s3.deleteObject(params).promise();
      console.log(`Document ${documentUri} deleted successfully from S3`);
    } catch (err) {
      console.error("Error deleting document from S3:", err);
      throw new Error("error-deleting-document-S3");
    }
  };

  export const uploadTaskCommentDocumentToS3 = async (
    taskUuid: string,
    taskCommentDocument: Express.Multer.File
  ): Promise<{
    documentUri: string;
    documentOriginalName: string;
    presignedUrl: string;
  }> => {
    const s3 = new AWS.S3();
    const bucketName = process.env.AWS_BUCKET_NAME

    const documentUuid: string = uuidv4();
    const documentOriginalName = taskCommentDocument.originalname.replace(
      /\s/g,
      ""
    );
    const documentNameToSave = `${documentUuid}_${documentOriginalName}`;

    const keyPath = `tasks/${taskUuid}/${documentNameToSave}`;

    const params = {
      Bucket: bucketName,
      Key: keyPath,
      Body: taskCommentDocument.buffer,
      ContentType: taskCommentDocument.mimetype,
      ContentEncoding: "binary",
    };

    try {
      await s3.putObject(params).promise();

      const presignedUrl = getPresignedUrl(keyPath);

      return { documentUri: keyPath, documentOriginalName, presignedUrl };
    } catch (err) {
      console.error("Error uploading to S3:", err);
      throw new Error("error-uploading-task-document-S3");
    }
  };

  export const uploadContractCommentDocumentToS3 = async (
    contractUuid: string,
    contractCommentDocument: Express.Multer.File
  ): Promise<{
    documentUri: string;
    documentOriginalName: string;
    presignedUrl: string;
  }> => {
    const s3 = new AWS.S3();
    const bucketName = process.env.AWS_BUCKET_NAME

    const documentUuid: string = uuidv4();
    const documentOriginalName = contractCommentDocument.originalname.replace(
      /\s/g,
      ""
    );
    const documentNameToSave = `${documentUuid}_${documentOriginalName}`;

    const keyPath = `contracts/${contractUuid}/${documentNameToSave}`;

    const params = {
      Bucket: bucketName,
      Key: keyPath,
      Body: contractCommentDocument.buffer,
      ContentType: contractCommentDocument.mimetype,
      ContentEncoding: "binary",
    };

    try {
      await s3.putObject(params).promise();

      const presignedUrl = getPresignedUrl(keyPath);

      return { documentUri: keyPath, documentOriginalName, presignedUrl };
    } catch (err) {
      console.error("Error uploading to S3:", err);
      throw new Error("error-uploading-contract-document-S3");
    }
  };

  export const uploadGenericCommentDocumentToS3 = async (
    documentType: "reminders" | "lead" |"leadCalls" | "leadBill" | "notifications" | "users",
    document: Express.Multer.File
  ): Promise<string> => {
    const s3 = new AWS.S3();
    const bucketName = process.env.AWS_BUCKET_NAME

    const documentUuid: string = uuidv4();
    const documentOriginalName = document.originalname.replace(/\s/g, "");
    const documentNameToSave = `${documentUuid}_${documentOriginalName}`;

    const keyPath = `${documentType}/${documentNameToSave}`;

    const params = {
      Bucket: bucketName,
      Key: keyPath,
      Body: document.buffer,
      ContentType: document.mimetype,
      ContentEncoding: "binary",
    };

    try {
      await s3.putObject(params).promise();
      return keyPath;
    } catch (err) {
      console.error("Error uploading to S3:", err);
      throw new Error("error-uploading-generic-document-S3");
    }
  };

  export const uploadFileToS3 = async (
    documentPath: string,
    document: Express.Multer.File
  ): Promise<string> => {
    const s3 = new AWS.S3();
    const bucketName = process.env.AWS_BUCKET_NAME

    const keyPath = documentPath;

    const params = {
      Bucket: bucketName,
      Key: keyPath,
      Body: document.buffer,
      ContentType: document.mimetype,
      ContentEncoding: "binary",
    };

    try {
      await s3.putObject(params).promise();
      return keyPath;
    } catch (err) {
      console.error("Error uploading to S3:", err);
      throw new Error("error-uploading-file-S3");
    }
  };

  export const deleteFileFromS3 = async (
    fileUri: string
  ): Promise<void> => {
    const s3 = new AWS.S3();
    const bucketName = process.env.AWS_BUCKET_NAME

    const params = {
      Bucket: bucketName,
      Key: fileUri,
    };

    try {
      await s3.deleteObject(params).promise();
      console.log(`File ${fileUri} deleted successfully from S3`);
    } catch (err) {
      console.error("Error deleting document from S3:", err);
      throw new Error("error-deleting-document-S3");
    }
  };

  export const getPresignedUrl = (keyPath: string, expirationTime = 3600) => {
    const s3 = new AWS.S3();
    const bucketName = process.env.AWS_BUCKET_NAME

    const params = {
      Bucket: bucketName,
      Key: keyPath,
      Expires: expirationTime,
    };

    return s3.getSignedUrl("getObject", params);
  };
}
