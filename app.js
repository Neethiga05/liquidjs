import express from 'express';
import { Liquid } from 'liquidjs';

const app = express();
const port = 5000;

// Initialize LiquidJS
const engine = new Liquid({ cache: false, extname: '.liquid', root: process.cwd() });

// ------------------ Filters ------------------
engine.registerFilter('money', (value) =>
    isNaN(value) ? '$0.00' : `$${Number(value).toFixed(2)}`
);

engine.registerFilter('sum', (arr) => {
    if (!Array.isArray(arr)) return 0;
    return arr.reduce((acc, val) => acc + Number(val || 0), 0);
});

// ------------------ SUBSCRIPTION RENEWAL ------------------

const renewalTemplate = `
Subscription Renewal Notice for {{ Customer.FirstName | upcase }}

Your '{{ Subscription.Name }}' plan, which renews on {{ Subscription.TermEndDate | date: "%B %d, %Y" }}, includes the following features:

{% for feature in Subscription.Features %}
- {{ feature }}
{% endfor %}

Please ensure your payment method is up to date.
`;

const renewalContext = {
    Customer: {
        FirstName: "Alex",
        LastName: "Rivera",
        Email: "alex.r@example.com"
    },
    Subscription: {
        Id: "8ad09be48a22193c018a38a7295064ac",
        Name: "Ford Connected Charge Station",
        Status: "Past Due",
        TermEndDate: new Date("2025-09-30"),  // <-- convert to Date
        RenewalPrice: 15.00,
        Currency: "USD",
        Features: [
            "Remote Power Management",
            "Usage Analytics",
            "Scheduled Charging"
        ]
    }
};


app.get('/subscription_renewal', async (req, res) => {
    try {
        const tpl = engine.parse(renewalTemplate);
        const output = await engine.render(tpl, renewalContext);
        res.type('text/plain').send(output);
    } catch (err) {
        console.error("LiquidJS rendering error:", err);
        res.status(500).send("Error rendering subscription renewal.");
    }
});

//=== SUBSCRIPTION STATUS ===
const statusTemplate = `
Hello {{ Customer.FirstName }},

{% if Subscription.Status == 'Active' %}
Your subscription is active and everything looks good for your upcoming renewal.
{% elsif Subscription.Status == 'Past Due' %}
Our records show your account is past due. Please update your payment information to ensure uninterrupted service.
{% else %}
There is an issue with your subscription. Please contact support.
{% endif %}

Subscription ID: {{ Subscription.Id }}
`;

const statusContext = {
    "Customer": {
        "FirstName": "Alex",
        "LastName": "Rivera",
        "Email": "alex.r@example.com"
    },
    "Subscription": {
        "Id": "8ad09be48a22193c018a38a7295064ac",
        "Name": "Ford Connected Charge Station",
        "Status": "Past Due",
        "TermEndDate": "2025-09-30",
        "RenewalPrice": 15.00,
        "Currency": "USD",
        "Features": [
            "Remote Power Management",
            "Usage Analytics",
            "Scheduled Charging"
        ]
    }
}

app.get('/subscription_status', async (req, res) => {
    try {
        const tpl = engine.parse(statusTemplate);
        const output = await engine.render(tpl, statusContext);
        res.type('text/plain').send(output);
    } catch (err) {
        console.error("LiquidJS rendering error:", err);
        res.status(500).send("Error rendering subscription status.");
    }
});


// ------------------ ORDER RECEIPT ------------------
const receiptTemplate = `
Order Receipt for {{ Customer.FirstName }} {{ Customer.LastName }}

---
Order Details

Order ID: {{ Order.Id }}
Order Date: {{ Order.Date }}
Payment Status: {{ Order.Status }}

Items:
{% for item in Order.Items %}
- {{ item.Name }} (x{{ item.Quantity }}) — {{ Order.Currency }} {{ item.Price | money }}
{% endfor %}

Subtotal: {{ Order.Currency }} {{ Order.Subtotal | money }}
Tax: {{ Order.Currency }} {{ Order.Tax | money }}
Total: {{ Order.Currency }} {{ Order.Total | money }}

---
Shipping To:
{{ Customer.FirstName }} {{ Customer.LastName }}
{{ Customer.Address.Street }}
{{ Customer.Address.City }}, {{ Customer.Address.State }} {{ Customer.Address.Zip }}
`;

const receiptContext = {
    Customer: {
        FirstName: "Jordan",
        LastName: "Taylor",
        Email: "jordan.t@example.com",
        Address: {
            Street: "123 Main St",
            City: "Austin",
            State: "TX",
            Zip: "73301"
        }
    },
    Order: {
        Id: "ORD-1001",
        Date: "2025-09-01",
        Status: "Paid",
        Currency: "USD",
        Items: [
            { Name: "Wireless Headphones", Quantity: 1, Price: 99.99 },
            { Name: "USB-C Cable", Quantity: 2, Price: 9.99 }
        ],
        Subtotal: 119.97,
        Tax: 9.60,
        Total: 129.57
    }
};

app.get('/orderreceipt', async (req, res) => {
    try {
        const tpl = engine.parse(receiptTemplate);
        const output = await engine.render(tpl, receiptContext);
        res.type('text/plain').send(output);
    } catch (err) {
        console.error("LiquidJS rendering error:", err);
        res.status(500).send("Error rendering order receipt.");
    }
});

// ------------------ INVOICE ------------------
const invoiceTemplate = `
{% assign customer_name = Account.FirstName %}
{% assign due_date_formatted = Invoice.DueDate | date: "%B %d, %Y" %}
Hello {{ customer_name }},

Here is your invoice {{ Invoice.InvoiceNumber }} from Ford Connected Services, generated on {{ "now" | date: "%B %d, %Y" }}.

============================================================
INVOICE SUMMARY
============================================================

Billed To:
{{ Account.Company }}
{{ Account.BillingAddress }}

Status:     {{ Invoice.Status }}
Due Date:   {{ due_date_formatted }}

{% assign balance_due = Invoice.Total | minus: Invoice.AmountPaid %}
Amount Due: $ {{ balance_due | money}}

{% if balance_due > 0 %}
Please make your payment by the due date to ensure your services remain active.
{% else %}
Thank you, this invoice has been fully paid.
{% endif %}

============================================================
INVOICE DETAILS
============================================================

Description                          Qty    Price
------------------------------------ --- ----------
{% for item in Invoice.LineItems %}
{{ item.Description }}   {{ item.Quantity }}    {% if item.Price < 0 %}($ {{ item.Price | times: -1 | money }}){% else %}$ {{ item.Price | money }}{% endif %}
{% endfor %}
------------------------------------ --- ----------
                              Subtotal:   $ {{ Invoice.Subtotal | money }}
                                   Tax:   $ {{ Invoice.Tax | money }}
                                 Total:   $ {{ Invoice.Total | money }}
                           Amount Paid:   ($ {{ Invoice.AmountPaid | money }})
                           -----------
                           Balance Due:   $  {{ balance_due | money }}

{% assign recurring_items = Invoice.LineItems | where: "Type", "Recurring" %}
Your recurring subscription charges for this period total $ {{ recurring_items | map: "Price" | sum | money }}.

Thank you for your business.
If you need assistance, please call our support team at {{ constants.supportPhone.US }}.

Sincerely,
{{ constants.companyName }}
`;

const invoiceContext = {
    Account: {
        FirstName: "Alex",
        Company: "Rivera Auto Group",
        BillingAddress: "123 Innovation Drive, Dearborn, MI 48120"
    },
    constants: {
        companyName: "Ford Connected Services",
        websiteURL: "https://connect.ford.com",
        supportPhone: {
            US: "1-800-555-1234",
            UK: "+44-800-555-1234"
        }
    },
    Invoice: {
        InvoiceNumber: "INV00098765",
        IssueDate: "2025-08-26",
        DueDate: "2025-09-10",
        Currency: "USD",
        Status: "Posted",
        Tax: 12.00,
        Subtotal: 200.00,
        Total: 212.00,
        AmountPaid: 0.00,
        LineItems: [
            { SKU: "FP-PRO-Y", Description: "FordPass Pro - Annual Subscription", Type: "Recurring", Quantity: 1, Price: 150.00 },
            { SKU: "FS-SEC-M", Description: "Ford Secure Add-on", Type: "Recurring", Quantity: 1, Price: 50.00 },
            { SKU: "SETUP-01", Description: "One-Time Setup Fee", Type: "OneTime", Quantity: 1, Price: 25.00 },
            { SKU: "ADJ-CRED", Description: "Loyalty Credit", Type: "Credit", Quantity: 1, Price: -25.00 }
        ]
    }
};

app.get('/invoice', async (req, res) => {
    try {
        const tpl = engine.parse(invoiceTemplate);
        const output = await engine.render(tpl, invoiceContext);
        res.type('text/plain').send(output);
    } catch (err) {
        console.error("LiquidJS rendering error:", err);
        res.status(500).send("Error rendering invoice.");
    }
});


// ------------------ START SERVER ------------------
app.listen(port, () => {
    console.log(`Subscription Renewal: http://localhost:${port}/subscription_renewal`);
    console.log(`Subscription Status: http://localhost:${port}/subscription_status`);
    console.log(`Order Receipt: http://localhost:${port}/orderreceipt`);
    console.log(`Invoice: http://localhost:${port}/invoice`);
});
