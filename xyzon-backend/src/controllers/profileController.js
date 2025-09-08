const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs').promises;

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profiles/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

class ProfileController {
    // Get user profile
    static async getProfile(req, res) {
        try {
            const user = await User.findById(req.user.id).select('-passwordHash -refreshTokens -resetToken');
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Update user profile
    static async updateProfile(req, res) {
        try {
            const {
                name,
                phone,
                dateOfBirth,
                collegeName,
                department,
                yearOfStudy,
                address,
                bio,
                socialLinks
            } = req.body;

            const updateData = {
                name,
                phone,
                dateOfBirth,
                collegeName,
                department,
                yearOfStudy,
                address,
                bio,
                socialLinks
            };

            // Remove undefined fields
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined || updateData[key] === null || updateData[key] === '') {
                    delete updateData[key];
                }
            });

            const user = await User.findByIdAndUpdate(
                req.user.id,
                updateData,
                { new: true, runValidators: true }
            ).select('-passwordHash -refreshTokens -resetToken');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: user
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Upload profile picture
    static async uploadProfilePicture(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const inputPath = req.file.path;
            const outputPath = inputPath.replace(path.extname(inputPath), '_optimized.jpg');

            // Optimize image using sharp
            await sharp(inputPath)
                .resize(400, 400, { fit: 'cover' })
                .jpeg({ quality: 85 })
                .toFile(outputPath);

            // Delete original file
            await fs.unlink(inputPath);

            // Update user profile picture URL
            const profilePictureUrl = `/uploads/profiles/${path.basename(outputPath)}`;

            const user = await User.findByIdAndUpdate(
                req.user.id,
                { profilePicture: profilePictureUrl },
                { new: true }
            ).select('-passwordHash -refreshTokens -resetToken');

            // Delete old profile picture if exists
            if (user.profilePicture && user.profilePicture !== profilePictureUrl) {
                const oldPath = path.join('uploads/profiles', path.basename(user.profilePicture));
                try {
                    await fs.unlink(oldPath);
                } catch (error) {
                    console.log('Could not delete old profile picture:', error.message);
                }
            }

            res.json({
                success: true,
                message: 'Profile picture updated successfully',
                data: {
                    profilePicture: profilePictureUrl
                }
            });
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Delete profile picture
    static async deleteProfilePicture(req, res) {
        try {
            const user = await User.findById(req.user.id);

            if (user.profilePicture) {
                const filePath = path.join('uploads/profiles', path.basename(user.profilePicture));
                try {
                    await fs.unlink(filePath);
                } catch (error) {
                    console.log('Could not delete profile picture file:', error.message);
                }
            }

            await User.findByIdAndUpdate(
                req.user.id,
                { $unset: { profilePicture: 1 } }
            );

            res.json({
                success: true,
                message: 'Profile picture deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

// Export the upload middleware along with the controller
ProfileController.uploadMiddleware = upload.single('profilePicture');

module.exports = ProfileController;
