import pool from '../db';
import { Invoice } from '../definitions';

export const fetchLatestInvoices = async (): Promise<Invoice[]> => {
    const { rows } = await pool.query(`
    SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    ORDER BY invoices.date DESC
    LIMIT 5
  `);

    return rows.map((row: any): Invoice => ({
        id: row.id,
        customer_id: row.customer_id,
        amount: parseFloat(row.amount),
        status: row.status,
        date: row.date,
    }));
};
