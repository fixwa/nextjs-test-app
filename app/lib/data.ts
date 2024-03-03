const {Client} = require("pg");
import {Revenue, User,} from './definitions';
import {formatCurrency} from './utils';
import {unstable_noStore as noStore} from 'next/cache';

export async function fetchRevenue(): Promise<Revenue[]> {
    // Add noStore() here to prevent the response from being cached.
    // This is equivalent to in fetch(..., {cache: 'no-store'}).
    noStore();
    const client = new Client();
    try {
        await client.connect();
        console.log('Fetching revenue data...');
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const result = await client.query('SELECT * FROM revenue');
        const data: Revenue[] = result.rows as Revenue[];
        console.log('Data fetch completed after X seconds.', data);
        return data;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch revenue data.');
    } finally {
        await client.end();
    }
}

export async function fetchCardData() {
    noStore();
    const client = new Client();
    try {
        await client.connect();

        const invoiceCountPromise = client.query(`SELECT COUNT(*) FROM invoices`);
        const customerCountPromise = client.query(`SELECT COUNT(*) FROM customers`);
        const invoiceStatusPromise = client.query(`
      SELECT
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
      FROM invoices
    `);
        const data = await Promise.all([
            invoiceCountPromise,
            customerCountPromise,
            invoiceStatusPromise,
        ]);

        const numberOfInvoices = Number(data[0].rows[0].count ?? '0');
        const numberOfCustomers = Number(data[1].rows[0].count ?? '0');
        const totalPaidInvoices = formatCurrency(Number(data[2].rows[0].paid ?? '0'));
        const totalPendingInvoices = formatCurrency(Number(data[2].rows[0].pending ?? '0'));

        return {
            numberOfCustomers,
            numberOfInvoices,
            totalPaidInvoices,
            totalPendingInvoices,
        };
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch card data.');
    } finally {
        await client.end();
    }
}


export async function getUser(email: string) {

    const client = new Client();
    try {
        await client.connect();
        const user = await client.query(`SELECT * FROM users WHERE email=${email}`);
        return user.rows[0] as User;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    } finally {
        await client.end();
    }
}
