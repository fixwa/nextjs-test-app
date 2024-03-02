import pool from '../db';
import {InvoiceForm, LatestInvoice} from '../definitions';
import {unstable_noStore as noStore} from "next/dist/server/web/spec-extension/unstable-no-store";

export const fetchLatestInvoices = async (): Promise<LatestInvoice[]> => {
    const {rows} = await pool.query(`
    SELECT 
        invoices.amount, 
        customers.name, 
        customers.image_url, 
        customers.email, invoices.id
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    ORDER BY invoices.date DESC
    LIMIT 5
  `);

    return rows.map((row: any): LatestInvoice => ({
        id: row.id,
        name: row.name,
        image_url: row.image_url,
        email: row.email,
        amount: `$${parseFloat(row.amount)}`,
    }));
};

export async function fetchFilteredInvoices(query: string, currentPage: number) {
    const ITEMS_PER_PAGE = 6;
    noStore();
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    try {
        const queryParams = `%${query}%`;
        const result = await pool.query(`
          SELECT
            invoices.id,
            invoices.amount,
            invoices.date,
            invoices.status,
            customers.name,
            customers.email,
            customers.image_url
          FROM invoices
          JOIN customers ON invoices.customer_id = customers.id
          WHERE
            customers.name ILIKE $1 OR
            customers.email ILIKE $1 OR
            invoices.amount::text ILIKE $1 OR
            invoices.date::text ILIKE $1 OR
            invoices.status ILIKE $1
          ORDER BY invoices.date DESC
          LIMIT $2 OFFSET $3
        `, [queryParams, ITEMS_PER_PAGE, offset]);
        return result.rows;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch invoices.');
    }
}

export async function fetchNumberOfInvoicesPages(query: string) {
    const ITEMS_PER_PAGE = 6;
    try {
        const queryParams = `%${query}%`;
        const result = await pool.query(`
          SELECT COUNT(*)
          FROM invoices
          JOIN customers ON invoices.customer_id = customers.id
          WHERE
            customers.name ILIKE $1 OR
            customers.email ILIKE $1 OR
            invoices.amount::text ILIKE $1 OR
            invoices.date::text ILIKE $1 OR
            invoices.status ILIKE $1
        `, [queryParams]);

        const totalPages = Math.ceil(Number(result.rows[0].count) / ITEMS_PER_PAGE);
        return totalPages;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch total number of invoices.');
    }
}

export async function fetchInvoiceById(id: string): Promise<InvoiceForm | null> {
    noStore();
    try {
        const queryText = `
      SELECT
        id,
        customer_id,
        amount,
        status
      FROM invoices
      WHERE id = $1;
    `;
        const {rows} = await pool.query(queryText, [id]);

        if (rows.length === 0) {
            return null;
        }

        const invoice: InvoiceForm = {
            id: rows[0].id,
            customer_id: rows[0].customer_id,
            amount: rows[0].amount / 100,
            status: rows[0].status,
        };

        return invoice;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch invoice.');
    }
}
