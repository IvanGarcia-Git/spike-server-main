import * as AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { LocalStorageHelper } from "./local-storage.helper";

export module AwsHelper {
  const isS3Configured = (): boolean => {
    return !!(
      process.env.AWS_S3_BUCKET &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_REGION
    );
  };
  export const uploadImageToS3 = async (
    bucketPath: "company" | "channel" | "user",
    image: Express.Multer.File
  ): Promise<string> => {
    const imageUuid: string = uuidv4();
    const imageName = `${imageUuid}_${image.originalname.replace(/\s/g, "")}`;
    const keyPath = `${bucketPath}/${imageName}`;

    if (!isS3Configured()) {
      return await LocalStorageHelper.uploadFile(keyPath, image);
    }

    const s3 = new AWS.S3();
    const bucketName = process.env.AWS_S3_BUCKET;

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
    const documentUuid: string = uuidv4();
    const documentOriginalName = contractDocument.originalname.replace(
      /\s/g,
      ""
    );
    const documentNameToSave = `${documentUuid}_${documentOriginalName}`;
    const keyPath = `contracts/${contractUuid}/${documentNameToSave}`;

    if (!isS3Configured()) {
      await LocalStorageHelper.uploadFile(keyPath, contractDocument);
      return { documentUri: keyPath, documentOriginalName };
    }

    const s3 = new AWS.S3();
    const bucketName = process.env.AWS_S3_BUCKET;

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
    if (!isS3Configured()) {
      return await LocalStorageHelper.deleteFile(documentUri);
    }

    const s3 = new AWS.S3();
    const bucketName = process.env.AWS_S3_BUCKET;

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
    const documentUuid: string = uuidv4();
    const documentOriginalName = taskCommentDocument.originalname.replace(
      /\s/g,
      ""
    );
    const documentNameToSave = `${documentUuid}_${documentOriginalName}`;
    const keyPath = `tasks/${taskUuid}/${documentNameToSave}`;

    if (!isS3Configured()) {
      await LocalStorageHelper.uploadFile(keyPath, taskCommentDocument);
      const presignedUrl = getPresignedUrl(keyPath);
      return { documentUri: keyPath, documentOriginalName, presignedUrl };
    }

    const s3 = new AWS.S3();
    const bucketName = process.env.AWS_S3_BUCKET;

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
    const documentUuid: string = uuidv4();
    const documentOriginalName = contractCommentDocument.originalname.replace(
      /\s/g,
      ""
    );
    const documentNameToSave = `${documentUuid}_${documentOriginalName}`;
    const keyPath = `contracts/${contractUuid}/${documentNameToSave}`;

    if (!isS3Configured()) {
      await LocalStorageHelper.uploadFile(keyPath, contractCommentDocument);
      const presignedUrl = getPresignedUrl(keyPath);
      return { documentUri: keyPath, documentOriginalName, presignedUrl };
    }

    const s3 = new AWS.S3();
    const bucketName = process.env.AWS_S3_BUCKET;

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
    const documentUuid: string = uuidv4();
    const documentOriginalName = document.originalname.replace(/\s/g, "");
    const documentNameToSave = `${documentUuid}_${documentOriginalName}`;
    const keyPath = `${documentType}/${documentNameToSave}`;

    if (!isS3Configured()) {
      return await LocalStorageHelper.uploadFile(keyPath, document);
    }

    const s3 = new AWS.S3();
    const bucketName = process.env.AWS_S3_BUCKET;

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
    if (!isS3Configured()) {
      return await LocalStorageHelper.uploadFile(documentPath, document);
    }

    const s3 = new AWS.S3();
    const bucketName = process.env.AWS_S3_BUCKET;

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
    if (!isS3Configured()) {
      return await LocalStorageHelper.deleteFile(fileUri);
    }

    const s3 = new AWS.S3();
    const bucketName = process.env.AWS_S3_BUCKET;

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
    if (!isS3Configured()) {
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      return `${baseUrl}/files/uploads/${keyPath}`;
    }

    const s3 = new AWS.S3();
    const bucketName = process.env.AWS_S3_BUCKET;

    const params = {
      Bucket: bucketName,
      Key: keyPath,
      Expires: expirationTime,
    };

    return s3.getSignedUrl("getObject", params);
  };

  /**
   * Process an array of items and convert their URI fields to presigned URLs
   * @param items Array of items with potential URI fields
   * @param uriField The field name containing the URI (default: 'billUri')
   * @param excludePatterns URL patterns to exclude from conversion
   */
  export const processPresignedUrls = <T extends Record<string, any>>(
    items: T[],
    uriField: keyof T = 'billUri' as keyof T,
    excludePatterns: string[] = ['https://bajatufactura', 'https://crm']
  ): void => {
    for (const item of items) {
      const uri = item[uriField];
      if (uri && typeof uri === 'string') {
        const shouldExclude = excludePatterns.some(pattern => uri.startsWith(pattern));
        if (!shouldExclude) {
          try {
            (item as any)[uriField] = getPresignedUrl(uri);
          } catch (error) {
            console.error(`Error generating presigned URL for item ID: ${(item as any).id}`, error);
          }
        }
      }
    }
  };
}
