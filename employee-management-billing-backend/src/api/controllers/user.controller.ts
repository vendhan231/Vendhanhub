import { Request, Response } from 'express';
import { z } from 'zod';
import { userService } from '../services/user.service';
import { createUserSchema, updateUserSchema } from '../validators/user.validators';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    try {
        const user = await userService.getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const validatedData = createUserSchema.parse(req.body);
        const newUser = await userService.createUser(validatedData);
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ message: 'Error creating user', error });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    try {
        const validatedData = updateUserSchema.parse(req.body);
        const updatedUser = await userService.updateUser(userId, validatedData);
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(400).json({ message: 'Error updating user', error });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    try {
        const deletedUser = await userService.deleteUser(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
};

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../../uploads/profile-pictures');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const userId = req.params.userId;
        const extension = path.extname(file.originalname);
        cb(null, `${userId}-profile${extension}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

export const uploadProfilePicture = [
    upload.single('profilePicture'),
    async (req: Request, res: Response) => {
        const userId = req.params.userId;
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            const profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`;

            const updatedUser = await userService.updateUser(userId, {
                profilePictureUrl
            });

            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json({
                message: 'Profile picture uploaded successfully',
                profilePictureUrl
            });
        } catch (error) {
            res.status(500).json({ message: 'Error uploading profile picture', error });
        }
    }
];