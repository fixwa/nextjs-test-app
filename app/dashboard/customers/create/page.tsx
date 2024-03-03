import Form from '@/app/ui/customers/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import {fetchCustomers} from "@/app/lib/models/Customer";
import {CustomerField} from "@/app/lib/definitions";

export default async function Page() {
    const customers:CustomerField[] = await fetchCustomers();

    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Customers', href: '/dashboard/customers' },
                    {
                        label: 'Create Customer',
                        href: '/dashboard/customers/create',
                        active: true,
                    },
                ]}
            />
            <Form customers={customers} />
        </main>
    );
}
