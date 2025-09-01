import express from 'express';
import { Liquid } from 'liquidjs';

const app = express();
const port = 3000;

const engine = new Liquid({ cache: false, extname: '.liquid', root: process.cwd() });

engine.registerFilter('money', (value) =>
    isNaN(value) ? '$0.00' : `$${Number(value).toFixed(2)}`
);

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


app.get('/subscriptionrenewal', async (req, res) => {
    try {
        const tpl = engine.parse(renewalTemplate);
        const output = await engine.render(tpl, renewalContext);
        res.type('text/plain').send(output);
    } catch (err) {
        console.error("LiquidJS rendering error:", err);
        res.status(500).send("Error rendering subscription renewal.");
    }
});

app.listen(port, () => {
    console.log(`Server running: http://localhost:${port}/subscriptionrenewal`);
});