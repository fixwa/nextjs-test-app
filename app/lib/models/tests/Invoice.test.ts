import {fetchFilteredInvoices, fetchInvoiceById, fetchLatestInvoices, fetchNumberOfInvoicesPages} from '../Invoice';
import pool from '../../db';
import {LatestInvoice} from "@/app/lib/definitions";

jest.mock('../../db', () => ({
    query: jest.fn(),
}));

describe('Invoice model', () => {
    it('fetches latest invoices correctly', async () => {
        (pool.query as jest.Mock).mockResolvedValueOnce({
            rows: [
                {id: '1', customer_id: '1', amount: 1000, status: 'paid', date: '2022-01-01'},
            ],
        });

        const invoices: LatestInvoice[] = await fetchLatestInvoices();
        expect(invoices).toHaveLength(1);
        expect(invoices[0].id).toEqual('1');
        //expect(pool.query).toHaveBeenCalledWith(expect.any(String));
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("SELECT"));
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("LIMIT 5"));
    });

    it('fetches filtered invoices correctly', async () => {
        const currentPage = 1;
        (pool.query as jest.Mock).mockResolvedValueOnce({
            rows: [
                {id: '1', customer_id: '1', amount: 1000, status: 'paid', date: '2022-01-01'},
            ],
        });

        const invoices = await fetchFilteredInvoices('something', currentPage);
        expect(invoices).toHaveLength(1);
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("SELECT"),
            expect.arrayContaining([`%something%`, 6, 0])
        );
    });

    it('fetches number of invoice pages correctly', async () => {
        (pool.query as jest.Mock).mockResolvedValueOnce({
            rows: [{count: 12}],
        });

        const totalPages = await fetchNumberOfInvoicesPages('something');
        expect(totalPages).toEqual(2); // 12 results with 6 items per page
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("SELECT COUNT(*)"),
            [`%something%`]
        );
    });

    it('fetches an invoice by ID correctly', async () => {
        const mockId = '1';
        (pool.query as jest.Mock).mockResolvedValueOnce({
            rows: [
                {id: mockId, customer_id: '1', amount: 1000, status: 'paid'},
            ],
        });

        const invoice = await fetchInvoiceById(mockId);
        expect(invoice).not.toBeNull();
        expect(invoice?.id).toEqual(mockId);
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("SELECT"),
            [mockId]
        );
    });
});
