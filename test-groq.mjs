import 'dotenv/config';

const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY;

async function test() {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama3-70b-8192',
            messages: [{ role: 'system', content: 'test' }, { role: 'user', content: 'hello' }],
            temperature: 0.7,
            stream: false
        })
    });

    console.log(response.status);
    const data = await response.json();
    console.log(data);
}

test();
