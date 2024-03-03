'use server';
import {z} from 'zod';
import {Client} from "pg";
import {revalidatePath} from 'next/cache';
import {redirect} from "next/navigation";

const FormSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
});
const CreateCustomer = FormSchema.omit({id: true, date: true});
export type State = {
    errors?: {
        name?: string[];
        email?: string[];
    };
    message?: string | null;
};

export async function createCustomer(prevState: State, formData: FormData) {
    const validatedFields = CreateCustomer.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
    });
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }
    const {name, email} = validatedFields.data;
    const client = new Client();
    try {
        await client.connect();
        const result = await client.query(`
            INSERT INTO customers (name, email, image_url)
            VALUES ($1, $2, $3)
        `, [name, email, '/customers/emil-kowalski.png']);
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Database Error: Failed to Create Invoice.',
        };
    } finally {
        await client.end();
        revalidatePath('/dashboard/customers');
        redirect('/dashboard/customers');
    }
}


const UpdateCustomer = FormSchema.omit({id: true, image_url: true});

export async function updateCustomer(
    id: string,
    prevState: State,
    formData: FormData,
) {
    const validatedFields = UpdateCustomer.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
    });
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }
    const {name, email} = validatedFields.data;
    const client = new Client();
    try {
        await client.connect();
        const result = await client.query(`
            UPDATE customers
            SET name = $1, 
            email = $2 
            WHERE id = $3
        `, [name, email, id]);
    } catch (error) {
        console.error('Database Error:', error);
        return {message: 'Database Error: Failed to Update Customer.'};
    } finally {
        await client.end();
        revalidatePath('/dashboard/customers');
        redirect('/dashboard/customers');
    }
}

export async function deleteCustomer(id: string) {
    const client = new Client();
    try {
        await client.connect();
        const result = await client.query(`
            DELETE FROM customers
            WHERE id = $1
        `, [id]);
    } catch (error) {
        console.error('Database Error:', error);
        return {message: 'Database Error: Failed to Delete Customer.'};
    } finally {
        await client.end();
        revalidatePath('/dashboard/customers');
    }
}
