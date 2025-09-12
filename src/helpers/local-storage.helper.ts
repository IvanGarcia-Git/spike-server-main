import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

export module LocalStorageHelper {
  const UPLOADS_DIR = path.join(process.cwd(), "uploads");

  const ensureDirectoryExists = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  };

  export const uploadFile = async (
    filePath: string,
    file: Express.Multer.File
  ): Promise<string> => {
    try {
      const fullPath = path.join(UPLOADS_DIR, filePath);
      const directory = path.dirname(fullPath);
      
      ensureDirectoryExists(directory);
      
      fs.writeFileSync(fullPath, file.buffer);
      
      return filePath;
    } catch (err) {
      console.error("Error saving file locally:", err);
      throw new Error("error-uploading-file-locally");
    }
  };

  export const deleteFile = async (filePath: string): Promise<void> => {
    try {
      const fullPath = path.join(UPLOADS_DIR, filePath);
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`File ${filePath} deleted successfully from local storage`);
      }
    } catch (err) {
      console.error("Error deleting file from local storage:", err);
      throw new Error("error-deleting-file-locally");
    }
  };

  export const getFileUrl = (filePath: string): string => {
    return `/files/uploads/${filePath}`;
  };

  export const getFilePath = (filePath: string): string => {
    return path.join(UPLOADS_DIR, filePath);
  };
}