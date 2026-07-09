import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File | Blob): Promise<string> => {
  try {
    let fileToCompress: File;
    if (file instanceof Blob && !(file instanceof File)) {
      fileToCompress = new File([file], 'image.jpg', { type: file.type || 'image/jpeg' });
    } else {
      fileToCompress = file as File;
    }

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      initialQuality: 0.8
    };

    const compressedFile = await imageCompression(fileToCompress, options);
    return blobToBase64(compressedFile);
  } catch (error) {
    console.error('Error compressing image:', error);
    return blobToBase64(file);
  }
};

export const compressImageFile = async (file: File | Blob): Promise<File | Blob> => {
  try {
    let fileToCompress: File;
    if (file instanceof Blob && !(file instanceof File)) {
      fileToCompress = new File([file], 'image.jpg', { type: file.type || 'image/jpeg' });
    } else {
      fileToCompress = file as File;
    }

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      initialQuality: 0.8
    };

    const compressedFile = await imageCompression(fileToCompress, options);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    return file;
  }
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject(new Error("Blob conversion failed"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};