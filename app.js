import express from 'express';
import { Liquid } from 'liquidjs';

const app = express();
const port = 3000;

const engine = new Liquid({ cache: false, extname: '.liquid', root: process.cwd() });

engine.registerFilter('money', (value) =>
    isNaN(value) ? '$0.00' : `$${Number(value).toFixed(2)}`
);

const receiptTemplate = `
Order Receipt for {{ Customer.FirstName }} {{ Customer.LastName }}

---
Order Details
---
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

app.get('/order-receipt', async (req, res) => {
    try {
        const tpl = engine.parse(receiptTemplate);
        const output = await engine.render(tpl, receiptContext);
        res.type('text/plain').send(output);
    } catch (err) {
        console.error("LiquidJS rendering error:", err);
        res.status(500).send("Error rendering order receipt.");
    }
});

app.listen(port, () => {
    console.log(`Server running: http://localhost:${port}/order-receipt`);
});