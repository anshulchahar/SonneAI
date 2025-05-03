import { createClient } from '@supabase/supabase-js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../src/types/supabase';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.DB_NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.DB_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

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
            const userId = uuidv4();
            
            // Create user in Supabase
            const { error: userError } = await supabase.from('users').upsert({
                id: userId,
                email: user.email,
                name: user.name,
                emailVerified: user.email_verified ? new Date(user.email_verified) : null,
                created_at: new Date(),
                updated_at: new Date()
            });

            if (userError) {
                console.error('Error creating user:', userError);
                continue;
            }

            // Get user's analyses from old database
            const analyses = await oldDb.all(
                'SELECT * FROM document_analysis WHERE user_id = ?',
                user.id
            );

            // Migrate each analysis
            for (const analysis of analyses) {
                const analysisId = uuidv4();
                
                // Create analysis in Supabase
                const { error: analysisError } = await supabase.from('analysis').insert({
                    id: analysisId,
                    userId: userId,
                    filename: analysis.filename,
                    summary: analysis.summary || '',
                    keyPoints: analysis.key_points || '[]',
                    analysis: analysis.analysis_data || '{}',
                    createdAt: new Date(analysis.created_at),
                    updatedAt: new Date()
                });

                if (analysisError) {
                    console.error('Error creating analysis:', analysisError);
                }
            }
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrateData();