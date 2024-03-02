import { fetchLatestInvoices } from '../Invoice';
import pool from '../../db';
import {Invoice} from "@/app/lib/definitions";
jest.mock('../../db', () => ({
    query: jest.fn(),
}));

describe('Invoice model', () => {
    it('fetches latest invoices correctly', async () => {
        (pool.query as jest.Mock).mockResolvedValueOnce({
            rows: [
                { id: '1', customer_id: '1', amount: 1000, status: 'paid', date: '2022-01-01' },
            ],
        });

        const invoices:Invoice[] = await fetchLatestInvoices();
        expect(invoices).toHaveLength(1);
        expect(invoices[0].id).toEqual('1');
        //expect(pool.query).toHaveBeenCalledWith(expect.any(String));
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("SELECT"));
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("LIMIT 5"));
    });
});
