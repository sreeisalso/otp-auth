import { DbClient } from "./db/init";
import { CustomSmsSender, sendOtp, verifyOtp } from "./services/otp";
import { AuthRequestSchema, VerifyOtpRequestSchema } from "./utils/z";

// Main entry point for the Core SDK, exporting all public functions and types.
export * from "./db/init";
export * from "./db/schema";
export * from "./services/otp";
export * from "./utils/z";

// Example of how to use the Core SDK in a WHATWG-compliant route handler.
// This is for demonstration purposes and would typically be part of a server framework.

/**
 * Handles a sign-in/sign-up request by sending an OTP.
 * This function is designed to be used within a WHATWG-compliant server environment (e.g., Cloudflare Workers, Node.js with native fetch).
 * @param {Request} request - The incoming WHATWG Request object.
 * @param {DbClient} db - The Drizzle database client.
 * @param {CustomSmsSender} smsSender - The user-provided function to send the SMS.
 * @returns {Promise<Response>} A WHATWG Response object.
 */
export async function handleSendOtpRequest(
	request: Request,
	db: DbClient,
	smsSender: CustomSmsSender
): Promise<Response> {
	try {
		const jsonBody = await request.json();
		const parsedBody = AuthRequestSchema.safeParse(jsonBody);

		if (!parsedBody.success) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Invalid request body.",
					errors: parsedBody.error.errors,
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				}
			);
		}

		const { mobileNumber } = parsedBody.data;
		const result = await sendOtp(db, mobileNumber, smsSender);

		if (result.success) {
			return new Response(JSON.stringify(result), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		} else {
			return new Response(JSON.stringify(result), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}
	} catch (error: any) {
		console.error("Error in handleSendOtpRequest:", error);
		return new Response(
			JSON.stringify({
				success: false,
				message: "Internal server error.",
				error: error.message,
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
}

/**
 * Handles an OTP verification request.
 * This function is designed to be used within a WHATWG-compliant server environment.
 * @param {Request} request - The incoming WHATWG Request object.
 * @param {DbClient} db - The Drizzle database client.
 * @returns {Promise<Response>} A WHATWG Response object.
 */
export async function handleVerifyOtpRequest(
	request: Request,
	db: DbClient
): Promise<Response> {
	try {
		const jsonBody = await request.json();
		const parsedBody = VerifyOtpRequestSchema.safeParse(jsonBody);

		if (!parsedBody.success) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "Invalid request body.",
					errors: parsedBody.error.errors,
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				}
			);
		}

		const { mobileNumber, otpCode } = parsedBody.data;
		const result = await verifyOtp(db, mobileNumber, otpCode);

		if (result.success) {
			return new Response(JSON.stringify(result), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		} else {
			return new Response(JSON.stringify(result), {
				status: 401, // Unauthorized for invalid OTP
				headers: { "Content-Type": "application/json" },
			});
		}
	} catch (error: any) {
		console.error("Error in handleVerifyOtpRequest:", error);
		return new Response(
			JSON.stringify({
				success: false,
				message: "Internal server error.",
				error: error.message,
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
}
