'use server';
import {z} from 'zod';
import {Client} from "pg";
import { revalidatePath } from 'next/cache';
import {redirect} from "next/navigation";

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});
const CreateInvoice = FormSchema.omit({ id: true, date: true });
export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    const client = new Client();
    try {
        await client.connect();
        const result = await client.query(`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES ($1, $2, $3, $4)
        `, [customerId, amountInCents, status, date]);
    } catch (err) {
        console.error('Database Error:', err);
        throw new Error('Failed to create a new Invoice.');
    } finally {
        await client.end();
        revalidatePath('/dashboard/invoices');
        redirect('/dashboard/invoices');
    }
}


const UpdateInvoice = FormSchema.omit({ id: true, date: true });
export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100;
    const client = new Client();
    try {
        await client.connect();
        const result = await client.query(`
            UPDATE invoices
            SET customer_id = $1, 
            amount = $2, 
            status = $3
            WHERE id = $4
        `, [customerId, amountInCents, status, id]);
    } catch (err) {
        console.error('Database Error:', err);
        throw new Error('Failed to create a new Invoice.');
    } finally {
        await client.end();
        revalidatePath('/dashboard/invoices');
        redirect('/dashboard/invoices');
    }
}