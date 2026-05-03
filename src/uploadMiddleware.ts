import { upload } from './services/cloudinaryService';

export const uploadSingleImage = upload.single('image');
export const uploadMultipleImages = upload.array('images', 5);
