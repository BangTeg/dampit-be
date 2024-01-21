require('dotenv').config();

const multer = require('multer');
const { Storage } = require('@google-cloud/storage');

const {
    GCLOUD_PROJECT_ID,
    GCLOUD_KEY_FILE,
    GCLOUD_STORAGE,
    GCLOUD_STORAGE_AVATAR_FOLDER,
    GCLOUD_STORAGE_KTP_FOLDER,
} = process.env;

// Multer configuration
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Maximum file size is 5MB
    },
});

// Google Cloud Storage configuration
const storageConfig = {
    projectId: GCLOUD_PROJECT_ID,
    keyFilename: GCLOUD_KEY_FILE,
};

const storageName = GCLOUD_STORAGE;
const avatarFolderName = GCLOUD_STORAGE_AVATAR_FOLDER;
const ktpFolderName = GCLOUD_STORAGE_KTP_FOLDER;
const avatarFolder = `${storageName}/${avatarFolderName}`;
const ktpFolder = `${storageName}/${ktpFolderName}`;

const avatarStorageBucket = new Storage({
    ...storageConfig,
    bucket: avatarFolder,
});

const ktpStorageBucket = new Storage({
    ...storageConfig,
    bucket: ktpFolder,
});

const uploadToStorage = (file, bucket) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file'));
        }

        const newFileName = `${Date.now()}_${file.originalname}`;
        const fileUpload = bucket.file(newFileName);

        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        });

        blobStream.on('error', (error) => {
            reject(error);
        });

        blobStream.on('finish', () => {
            const url = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
            resolve(url);
        });

        blobStream.end(file.buffer);
    });
};

module.exports = {
    upload,
    uploadToStorage,
    avatarBucket: avatarStorageBucket,
    ktpBucket: ktpStorageBucket,
};
