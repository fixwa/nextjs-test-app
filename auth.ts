import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
import {Client, QueryResult} from "pg";

async function getUserFromDb(email: string): Promise<User | undefined> {
    try {
        const client: Client = new Client();
        await client.connect();
        const user:QueryResult<User> = await client.query<User>(`SELECT * FROM users WHERE email=$1`, [email]);
        await client.end();
        console.log(user);
        return user.rows[0];
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

async function getUser(email: string, password: string): Promise<User | null> {
    try {
        const hardcodedEmail = 'admin@admin.com';
        const hardcodedPassword = 'admin123456';

        // Check if the provided credentials match the hardcoded ones
        if (email === hardcodedEmail && password === hardcodedPassword) {
            return { id: '002020202', email: hardcodedEmail, name: "Admin", password: hardcodedPassword} as User;
        }
        return null;
    } catch (error) {
        console.error('Failed to authenticate user:', error);
        throw new Error('Failed to authenticate user.');
    }
}
export const { auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email, password);
                    if (user) {
                        return user;
                    }
                }
                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
});
