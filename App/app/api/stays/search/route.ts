export async function GET() {
  return Response.json({
    ok: true,
    results: [
      {
        id: "mock-stay-1",
        city: "Paris",
        name: "Hotel Mock",
        nights: 3,
        total: 450,
        currency: "EUR",
        provider: "mock"
      }
    ]
  });
}