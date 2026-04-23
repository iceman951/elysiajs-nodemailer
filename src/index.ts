import { Elysia, t } from "elysia";
import cors from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { transporter } from "./mail.provider";
import { config } from "./config";

const allowedOrigins = Bun.env.CORS_ORIGINS?.split(",") || [];

const app = new Elysia({
	prefix: "sendmail",
	name: "sendmail",
})
	.use(
		cors({
			origin: allowedOrigins,
		}),
	)
	.use(openapi())
	.get(
		"/mail-server-health",
		async () => {
			try {
				await transporter.verify(); // This tests connection + authentication

				return {
					response_status: "pass",
					response_message: "✅ Email server is ready to send messages",
				};
			} catch (err: any) {
				console.error("Email server check failed:", err);

				return {
					response_status: "fail",
					response_message: "Cannot connect to email server",
					error: err.message || "Unknown connection error",
				};
			}
		},
		{
			detail: {
				summary: "check mail server connection",
				description: "เช็คสถานะการเชื่อมต่อกับ mail server",
			},
		},
	)
	.post(
		"/sendmail",
		async ({ body }) => {
			try {
				const fileArray: File[] = Array.isArray(body.attachments)
					? body.attachments
					: body.attachments
						? [body.attachments]
						: [];

				// Convert each File → Nodemailer attachment format
				const attachments = await Promise.all(
					fileArray.map(async (file: File) => {
						const arrayBuffer = await file.arrayBuffer();
						return {
							filename: file.name,
							content: Buffer.from(arrayBuffer), // Important: convert to Buffer
							contentType: file.type || "application/octet-stream",
						};
					}),
				);

				const mailOptions: any = {
					from: body.from,
					to: body.to,
					subject: body.subject,
					html: body.content, // use body.content as HTML if provided
					cc: body.cc || undefined,
					bcc: body.bcc
				};

				if (attachments.length > 0 && attachments[0].filename) {
					mailOptions.attachments = attachments;
				}

				await transporter.sendMail(mailOptions);

				return {
					response_status: "pass",
					response_message: `Email sent successfully with ${attachments.length} attachment(s)`,
				};
			} catch (err: any) {
				console.error("Send email error:", err);

				return {
					response_status: "fail",
					response_message: "Failed to send email",
					error: err.message || "Unknown error",
				};
			}
		},
		{
			detail: {
				summary: "sendmail",
			},
			body: t.Object(
				{
					subject: t.String({
						minLength: 1,
						error: "subject ต้องเป็น string และมีความยาวอย่างน้อย 1 ตัวอักษร",
						description: "หัวข้อ email",
					}),
					from: t.String({
						minLength: 1,
						error: "from ต้องเป็น string และมีความยาวอย่างน้อย 1 ตัวอักษร",
						description: "email ต้นทาง",
					}),
					to: t.String({
						minLength: 1,
						error: "to ต้องเป็น string และมีความยาวอย่างน้อย 1 ตัวอักษร",
						description: "email ปลายทาง ที่ะส่งไปหา",
					}),
					cc: t.String({
						minLength: 0,
						error: "cc ต้องเป็น string และมีความยาวอย่างน้อย 1 ตัวอักษร",
						description: "cc email ปลายทาง ที่ะส่งไปหา",
					}),
					bcc: t.String({
						minLength: 1,
						error: "bcc ต้องเป็น string และมีความยาวอย่างน้อย 1 ตัวอักษร",
						description: "bcc email ใส่เหมือนกับ from email เพื่อเก็บ sent mail ",
					}),
					content: t.String({
						minLength: 1,
						error: "content ต้องเป็น string และมีความยาวอย่างน้อย 1 ตัวอักษร",
						description: "เนื้อข้อความอีเมล (html format)",
					}),
					attachments: t.Optional(t.Files()),
				},
				{
					examples: [
						{
							subject: "mysubject",
							from: "test@email.com",
							to: "test@email.com",
							cc: "test@email.com",
							bcc: "test@email.com",
							content: "test@email.com",
						},
					],
				},
			),
		},
	)
	.listen(config.APP_PORT | 3000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
