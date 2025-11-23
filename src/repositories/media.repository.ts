import { Media } from '@prisma/client';

import { logger } from '../config';
import { CreateMediaDto } from '../dtos/request/country-code.request.dto';
import prisma from '../utils/prisma.client';

export class MediaRepository {
    /**
     * Create a new media entry
     * @param mediaData Media data
     * @returns Created media
     */
    async createMedia(mediaData: CreateMediaDto): Promise<Media> {
        try {
            return await prisma.media.create({
                data: {
                    url: mediaData.url,
                    type: mediaData.type || 'IMAGE',
                    context: mediaData.context,
                    meta: mediaData.meta,
                    uploadedBy: mediaData.uploadedBy,
                },
            });
        } catch (error) {
            logger.error('Error creating media:', error);
            throw error;
        }
    }

    /**
     * Find media by ID
     * @param id Media ID
     * @returns Media if found, null otherwise
     */
    async findById(id: string): Promise<Media | null> {
        try {
            return await prisma.media.findUnique({
                where: { id },
            });
        } catch (error) {
            logger.error('Error finding media by id:', error);
            throw error;
        }
    }

    /**
     * Update a media entry
     * @param id Media ID
     * @param mediaData Media data
     * @returns Updated media
     */
    async updateMedia(id: string, mediaData: Partial<CreateMediaDto>): Promise<Media> {
        try {
            return await prisma.media.update({
                where: { id },
                data: mediaData,
            });
        } catch (error) {
            logger.error('Error updating media:', error);
            throw error;
        }
    }

    /**
     * Delete a media entry
     * @param id Media ID
     * @returns Deleted media
     */
    async deleteMedia(id: string): Promise<Media> {
        try {
            return await prisma.media.delete({
                where: { id },
            });
        } catch (error) {
            logger.error('Error deleting media:', error);
            throw error;
        }
    }
}
