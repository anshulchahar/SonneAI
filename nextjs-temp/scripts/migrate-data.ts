import { PrismaClient } from '@prisma/client';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const prisma = new PrismaClient();

async function migrateData() {
    try {
        // Open the old SQLite database
        const oldDb = await open({
            filename: '../sonne.db',
            driver: sqlite3.Database
        });

        // Get all users from the old database
        const users = await oldDb.all('SELECT * FROM user');

        // Migrate each user
        for (const user of users) {
            const newUser = await prisma.user.upsert({
                where: { email: user.email },
                update: {},
                create: {
                    email: user.email,
                    name: user.name,
                    emailVerified: user.email_verified ? new Date(user.email_verified) : null,
                },
            });

            // Get user's analyses from old database
            const analyses = await oldDb.all(
                'SELECT * FROM document_analysis WHERE user_id = ?',
                user.id
            );

            // Migrate each analysis
            for (const analysis of analyses) {
                await prisma.analysis.create({
                    data: {
                        userId: newUser.id,
                        filename: analysis.filename,
                        summary: analysis.summary || '',
                        keyPoints: analysis.key_points || '[]',
                        analysis: analysis.analysis_data || '{}',
                        createdAt: new Date(analysis.created_at),
                    },
                });
            }
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrateData();