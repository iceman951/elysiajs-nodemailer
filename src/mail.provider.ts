import nodemailer from "nodemailer";
import { config } from "./config";

export const transporter = nodemailer.createTransport({
	pool: true,
	host: config.EMAIL_HOST,
	port: Number(config.EMAIL_PORT),
	secure: false, // use TLS
	auth: {
		user: config.EMAIL,
		pass: config.EMAIL_PASSWORD,
	},
	tls: {
		// do not fail on invalid certs
		rejectUnauthorized: false,
	},
});
