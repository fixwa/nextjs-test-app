const {Client} = require("pg");
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  User,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';
import { unstable_noStore as noStore } from 'next/cache';

export async function fetchRevenue() {
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

export async function fetchLatestInvoices() {
  noStore();
  const client = new Client();
  try {
    await new Promise((resolve) => setTimeout(resolve, 6000));
    await client.connect();
    const result = await client.query(`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`);
    const data: LatestInvoiceRaw[] = result.rows as LatestInvoiceRaw[];

    const latestInvoices = data.map((invoice: LatestInvoiceRaw) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  } finally {
    await client.end();
  }
}

export async function fetchCardData() {
  noStore();
  const client = new Client();
  try {
    await client.connect();
    // Initialize multiple queries in parallel
    const invoiceCountPromise = client.query(`SELECT COUNT(*) FROM invoices`);
    const customerCountPromise = client.query(`SELECT COUNT(*) FROM customers`);
    const invoiceStatusPromise = client.query(`
      SELECT
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
      FROM invoices
    `);

    // Wait for all promises to resolve
    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    // Extract and convert data from the query results
    const numberOfInvoices = Number(data[0].rows[0].count ?? '0');
    const numberOfCustomers = Number(data[1].rows[0].count ?? '0');
    // Assuming formatCurrency is a function to format numbers as currency strings
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

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(query: string, currentPage: number) {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const client = new Client();

  try {
    await client.connect();
    const queryParams = `%${query}%`;
    const result = await client.query(`
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
  } finally {
    await client.end();
  }
}

export async function fetchInvoicesPages(query: string) {
  const client = new Client();
  try {
    await client.connect();
    const queryParams = `%${query}%`;
    const result = await client.query(`
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
  } finally {
    await client.end();
  }
}

export async function fetchInvoiceById(id: string): Promise<InvoiceForm | null> {
  noStore();
  const client = new Client();

  try {
    await client.connect(); // Establish connection to the database
    const queryText = `
      SELECT
        id,
        customer_id,
        amount,
        status
      FROM invoices
      WHERE id = $1;
    `;
    const { rows } = await client.query(queryText, [id]);

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
  } finally {
    await client.end();
  }
}

export async function fetchCustomers() {
  const client = new Client();
  try {
    await client.connect();
    const result = await client.query(`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `);

    const customers: CustomerField[] = result.rows as CustomerField[];
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  } finally {
    await client.end();
  }
}

export async function fetchFilteredCustomers(query: string) {
  noStore();
  try {
    const data = await sql<CustomersTableType>`
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
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function getUser(email: string) {
  try {
    const user = await sql`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0] as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
