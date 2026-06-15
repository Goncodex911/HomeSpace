import cloudinary from "../configs/cloudinary.js";

export const uploadImage =
  async (buffer) => {
    return new Promise(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder:
                "homespace",
            },
            (
              error,
              result
            ) => {
              if (error)
                reject(error);

              resolve(result);
            }
          )
          .end(buffer);
      }
    );
  };