import { upload } from './services/cloudinaryService.js';

export const uploadSingleImage = upload.single('image');
export const uploadMultipleImages = upload.array('images', 5);
