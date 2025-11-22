import { PrismaClient, InvoiceStatus } from "@prisma/client";

const prisma = new PrismaClient();

const dummyClients = [
  { name: "Acme Corporation", email: "contact@acme.com", address: "123 Business St, New York, NY 10001", phone: "+1-555-0101" },
  { name: "TechStart Inc", email: "hello@techstart.io", address: "456 Innovation Ave, San Francisco, CA 94102", phone: "+1-555-0102" },
  { name: "Global Solutions Ltd", email: "info@globalsolutions.com", address: "789 Commerce Blvd, Chicago, IL 60601", phone: "+1-555-0103" },
  { name: "Digital Ventures", email: "team@digitalventures.com", address: "321 Tech Park, Austin, TX 78701", phone: "+1-555-0104" },
  { name: "Creative Agency", email: "contact@creativeagency.com", address: "654 Design Street, Los Angeles, CA 90001", phone: "+1-555-0105" },
];

const invoiceStatuses: InvoiceStatus[] = ["DRAFT", "SENT", "PAID", "SENT", "DRAFT", "PAID", "SENT", "DRAFT", "SENT", "PAID", "DRAFT"];

async function createTestInvoices() {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: "himanshu.ganpa@gmail.com" },
    });

    if (!user) {
      console.error("User not found with email: himanshu.ganpa@gmail.com");
      process.exit(1);
    }

    console.log(`Found user: ${user.name || user.email} (ID: ${user.id})`);

    // Get or create clients
    const clients = [];
    for (const clientData of dummyClients) {
      let client = await prisma.client.findFirst({
        where: {
          userId: user.id,
          email: clientData.email,
        },
      });

      if (!client) {
        client = await prisma.client.create({
          data: {
            ...clientData,
            userId: user.id,
          },
        });
        console.log(`Created client: ${client.name}`);
      } else {
        console.log(`Using existing client: ${client.name}`);
      }
      clients.push(client);
    }

    // Get current max invoice number
    const existingInvoices = await prisma.invoice.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 1,
    });

    let nextInvoiceNumber = 1;
    if (existingInvoices.length > 0) {
      const lastNumber = existingInvoices[0].number.match(/\d+$/);
      if (lastNumber) {
        nextInvoiceNumber = parseInt(lastNumber[0], 10) + 1;
      }
    }

    // Create 11 invoices
    const invoiceItems = [
      [{ description: "Web Development Services", amount: 5000, quantity: 1 }],
      [{ description: "Consulting Services", amount: 2500, quantity: 1 }, { description: "Project Management", amount: 1500, quantity: 1 }],
      [{ description: "Design Services", amount: 3000, quantity: 1 }, { description: "Branding Package", amount: 2000, quantity: 1 }],
      [{ description: "Software Development", amount: 8000, quantity: 1 }],
      [{ description: "Marketing Services", amount: 4000, quantity: 1 }, { description: "Content Creation", amount: 2000, quantity: 1 }],
      [{ description: "Technical Support", amount: 1200, quantity: 1 }],
      [{ description: "Cloud Infrastructure", amount: 3500, quantity: 1 }],
      [{ description: "Mobile App Development", amount: 6000, quantity: 1 }],
      [{ description: "SEO Services", amount: 1800, quantity: 1 }, { description: "Analytics Setup", amount: 800, quantity: 1 }],
      [{ description: "E-commerce Platform", amount: 7500, quantity: 1 }],
      [{ description: "Data Analytics", amount: 2200, quantity: 1 }, { description: "Reporting Dashboard", amount: 1500, quantity: 1 }],
    ];

    const invoiceAmounts = [5000, 4000, 5000, 8000, 6000, 1200, 3500, 6000, 2600, 7500, 3700];

    for (let i = 0; i < 11; i++) {
      const invoiceNumber = `INV-${String(nextInvoiceNumber + i).padStart(3, "0")}`;
      const status = invoiceStatuses[i];
      const client = clients[i % clients.length];
      const items = invoiceItems[i];
      const subtotal = invoiceAmounts[i];
      const tax = subtotal * 0.1; // 10% tax
      const total = subtotal + tax;
      const date = new Date();
      date.setDate(date.getDate() - (10 - i)); // Spread dates over the last 10 days

      const invoice = await prisma.invoice.create({
        data: {
          number: invoiceNumber,
          date: date,
          dueDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from date
          subtotal: subtotal,
          tax: tax,
          total: total,
          currency: "USD",
          status: status,
          clientId: client.id,
          userId: user.id,
          items: {
            create: items.map((item) => ({
              description: item.description,
              amount: item.amount,
              quantity: item.quantity || 1,
            })),
          },
          // Set sentAt if status is SENT or PAID
          sentAt: status === "SENT" || status === "PAID" ? date : null,
          // Set paidAt if status is PAID
          paidAt: status === "PAID" ? new Date(date.getTime() + 5 * 24 * 60 * 60 * 1000) : null,
        },
      });

      console.log(`Created invoice ${invoiceNumber} (${status}) for ${client.name} - Total: $${total.toFixed(2)}`);
    }

    console.log("\n✅ Successfully created 11 test invoices!");
  } catch (error) {
    console.error("Error creating test invoices:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestInvoices();

