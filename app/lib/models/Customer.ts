import pool from '../db';
import {Customer, CustomerField, FormattedCustomersTable, InvoiceForm} from '../definitions';
import {unstable_noStore as noStore} from "next/dist/server/web/spec-extension/unstable-no-store";
import {formatCurrency} from "@/app/lib/utils";

export async function fetchCustomers(): Promise<CustomerField[]> {
    try {
        const result = await pool.query(`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `);
        return result.rows as CustomerField[];
    } catch (err) {
        console.error('Database Error:', err);
        throw new Error('Failed to fetch all customers.');
    }
}

export async function fetchNumberOfCustomersPages(query: string) {
    const ITEMS_PER_PAGE = 6;
    try {
        const queryParams = `%${query}%`;
        const result = await pool.query(`
            SELECT COUNT(*) AS c
            FROM customers
            WHERE
                customers.name ILIKE $1 OR
                customers.email ILIKE $1
        `, [queryParams]);

        return Math.ceil(Number(result.rows[0].c) / ITEMS_PER_PAGE);
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch total number of customers.');
    }
}

export async function fetchFilteredCustomers(query: string, currentPage: number) {
    const ITEMS_PER_PAGE = 6;
    noStore();
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;
    try {
        const queryParams = `%${query}%`;
        const result = await pool.query(`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE $1 OR
        customers.email ILIKE $1
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
          LIMIT $2 OFFSET $3
        `, [queryParams, ITEMS_PER_PAGE, offset]);

        return result.rows as FormattedCustomersTable[];
    } catch (err) {
        console.error('Database Error:', err);
        throw new Error('Failed to fetch customer table.');
    }
}

export async function fetchCustomerById(id: string): Promise<Customer | null> {
    noStore();
    try {
        const queryText = `
      SELECT
        id,
        name,
        email,
        image_url
      FROM customers
      WHERE id = $1;
    `;
        const result = await pool.query(queryText, [id]);

        if (result.length === 0) {
            return null;
        }
        return result.rows[0] as Customer;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch invoice.');
    }
}
