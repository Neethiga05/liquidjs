import express from 'express';
import { Liquid } from 'liquidjs';

const app = express();
const port = 3000;

const engine = new Liquid({ cache: false, extname: '.liquid', root: process.cwd() });

engine.registerFilter('money', (value) =>
    isNaN(value) ? '$0.00' : `$${Number(value).toFixed(2)}`
);

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

app.listen(port, () => {
    console.log(`Server running: http://localhost:${port}/subscription_status`);
});