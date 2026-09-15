import { prisma } from "../lib/prisma";

async function main() {
  const contact = await prisma.contact.create({
    data: {
      name: "Jordan Rivera",
      email: "jordan@example.com",
      phone: "555-0142",
      company: "Rivera Consulting",
      leads: {
        create: {
          stage: "NEW",
          source: "Website contact form",
          notes: {
            create: {
              body: "Reached out asking about CRM options for a small recruiting team.",
            },
          },
        },
      },
    },
  });

  console.log("Created test contact:", contact);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });