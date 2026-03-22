export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { base64, reportMonth } = req.body;
    if (!base64) return res.status(400).json({ error: "No PDF data provided" });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64 }
            },
            {
              type: "text",
              text: `You are extracting financial data from a bookkeeper monthly report for ${reportMonth}. Extract ONLY these specific numbers from the ACCRUAL BASIS section. Return ONLY valid JSON, no explanation, no markdown:

{
  "accrual_revenue_mtd": <number or null>,
  "accrual_gp_mtd": <number or null>,
  "accrual_gm_pct_mtd": <number or null>,
  "accrual_net_income": <number or null>,
  "cash_revenue_mtd": <number or null>,
  "cash_gp_mtd": <number or null>,
  "cash_gm_pct_mtd": <number or null>,
  "cash_net_income": <number or null>,
  "cash_balance_total": <number or null>,
  "ar_total_open": <number or null>,
  "ar_past_due": <number or null>,
  "ap_total": <number or null>,
  "owner_comp_ytd": <number or null>,
  "distributions_ytd": <number or null>,
  "overhead_monthly": <number or null>,
  "payroll_monthly": <number or null>,
  "confidence": "high|medium|low",
  "notes": "<any caveats>"
}

If a value is not found, use null. All monetary values as plain numbers without $ or commas.`
            }
          ]
        }]
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
