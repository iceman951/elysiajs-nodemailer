import env from "env-var";

export const config = {
	NODE_ENV: env
		.get("NODE_ENV")
		.default("development")
		.asEnum(["production", "test", "development"]),
	// disable ssl for login iauthen
	APP_PORT: env.get("APP_PORT").default(3000).asPortNumber(),

	EMAIL_HOST: env.get("EMAIL_HOST").required().asString(),
	EMAIL_PORT: env.get("EMAIL_PORT").required().asPortNumber(),
	EMAIL: env.get("EMAIL").required().asString(),
	EMAIL_PASSWORD: env.get("EMAIL_PASSWORD").required().asString(),
};
