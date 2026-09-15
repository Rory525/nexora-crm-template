import { prisma } from "@/lib/prisma";

export default async function Home() {
  const leads = await prisma.lead.findMany({
    include: { contact: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Nexora CRM</h1>
      <h2>Leads</h2>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #444" }}>
            <th style={{ padding: "0.5rem" }}>Name</th>
            <th style={{ padding: "0.5rem" }}>Company</th>
            <th style={{ padding: "0.5rem" }}>Email</th>
            <th style={{ padding: "0.5rem" }}>Stage</th>
            <th style={{ padding: "0.5rem" }}>Source</th>
          </tr>
        </thead>
        <tbody>
        {leads.map((lead) => (
  <tr key={lead.id} style={{ borderBottom: "1px solid #222" }}>
    <td style={{ padding: "0.5rem" }}>
      <a href={`/leads/${lead.id}`} style={{ color: "inherit" }}>{lead.contact.name}</a>
    </td>
    <td style={{ padding: "0.5rem" }}>{lead.contact.company}</td>
    <td style={{ padding: "0.5rem" }}>{lead.contact.email}</td>
    <td style={{ padding: "0.5rem" }}>{lead.stage}</td>
    <td style={{ padding: "0.5rem" }}>{lead.source}</td>
  </tr>
))}
        </tbody>
      </table>
    </main>
  );
}