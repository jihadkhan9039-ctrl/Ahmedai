// Ahmed AI — Groq API Proxy (Free!)
// Model: llama-3.3-70b-versatile

exports.handler = async (event) => {
  const CORS = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const API_KEY = process.env.GROQ_API_KEY;
  if (!API_KEY) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({
        error: "GROQ_API_KEY not set. Please add it in Netlify → Environment Variables."
      }),
    };
  }

  try {
    const { messages, system } = JSON.parse(event.body);

    // Build messages array with system prompt
    const groqMessages = [
      { role: "system", content: system },
      ...messages,
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model:       "llama-3.3-70b-versatile",
        messages:    groqMessages,
        max_tokens:  1500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: CORS,
        body: JSON.stringify({ error: data.error?.message || "Groq API error" }),
      };
    }

    const reply = data.choices?.[0]?.message?.content || "Sorry Sir, no response received.";

    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: "Server error: " + err.message }),
    };
  }
};
