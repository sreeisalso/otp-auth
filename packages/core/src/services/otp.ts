// Core OTP generation and verification logic.
import { eq } from "drizzle-orm";
import { DbClient } from "../db/init";
import { mobiles, otps } from "../db/schema";
import { AuthResponse, MobileNumberSchema, OtpCodeSchema } from "../utils/z";

/**
 * Interface for the custom SMS sender function.
 * Users must provide their own implementation of this function.
 */
export type CustomSmsSender = (
	mobileNumber: string,
	otpCode: string
) => Promise<void>;

/**
 * Generates a random OTP code.
 * @param {number} length - The desired length of the OTP code.
 * @returns {string} The generated OTP code.
 */
function generateOtpCode(length: number = 6): string {
	let otp = "";
	for (let i = 0; i < length; i++) {
		otp += Math.floor(Math.random() * 10);
	}
	return otp;
}

/**
 * Finds or creates a mobile entry in the database.
 * @param {DbClient} db - The Drizzle database client.
 * @param {string} mobileNumber - The mobile number.
 * @returns {Promise<string>} The ID of the mobile entry.
 */
export async function getOrCreateMobile(
	db: DbClient,
	mobileNumber: string
): Promise<string> {
	MobileNumberSchema.parse(mobileNumber); // Validate mobile number

	const existingMobile = await db.query.mobiles.findFirst({
		where: eq(mobiles.mobileNumber, mobileNumber),
	});

	if (existingMobile) {
		return existingMobile.id;
	} else {
		const newMobile = await db
			.insert(mobiles)
			.values({ mobileNumber })
			.returning({ id: mobiles.id });
		if (!newMobile[0]) {
			throw new Error("Failed to create mobile entry.");
		}
		return newMobile[0].id;
	}
}

/**
 * Sends an OTP to the given mobile number.
 * This function handles OTP generation, storage, and delegates SMS sending to a custom provider.
 * @param {DbClient} db - The Drizzle database client.
 * @param {string} mobileNumber - The mobile number to send OTP to.
 * @param {CustomSmsSender} smsSender - The user-provided function to send the SMS.
 * @param {number} otpExpiresInMinutes - How long the OTP is valid for in minutes.
 * @returns {Promise<AuthResponse>} A response indicating success or failure.
 */
export async function sendOtp(
	db: DbClient,
	mobileNumber: string,
	smsSender: CustomSmsSender,
	otpExpiresInMinutes: number = 5
): Promise<AuthResponse> {
	try {
		MobileNumberSchema.parse(mobileNumber);

		const mobileId = await getOrCreateMobile(db, mobileNumber);
		const otpCode = generateOtpCode();
		const expiresAt = new Date(Date.now() + otpExpiresInMinutes * 60 * 1000);

		// Invalidate any existing unverified OTPs for this mobile number
		await db
			.update(otps)
			.set({ verifiedAt: new Date().toISOString() }) // Mark as verified to invalidate
			.where(eq(otps.mobileId, mobileId));

		// Store the new OTP
		await db.insert(otps).values({
			mobileId,
			code: otpCode,
			expiresAt,
		});

		// Send the OTP using the custom SMS sender
		await smsSender(mobileNumber, otpCode);

		return { success: true, message: "OTP sent successfully." };
	} catch (error: any) {
		console.error("Error sending OTP:", error);
		return {
			success: false,
			message: "Failed to send OTP.",
			error: error.message,
		};
	}
}

/**
 * Verifies the provided OTP code for a given mobile number.
 * @param {DbClient} db - The Drizzle database client.
 * @param {string} mobileNumber - The mobile number.
 * @param {string} otpCode - The OTP code to verify.
 * @returns {Promise<AuthResponse>} A response indicating success or failure.
 */
export async function verifyOtp(
	db: DbClient,
	mobileNumber: string,
	otpCode: string
): Promise<AuthResponse> {
	try {
		MobileNumberSchema.parse(mobileNumber);
		OtpCodeSchema.parse(otpCode);

		const mobile = await db.query.mobiles.findFirst({
			where: eq(mobiles.mobileNumber, mobileNumber),
		});

		if (!mobile) {
			return { success: false, message: "Mobile number not found." };
		}

		const latestOtp = await db.query.otps.findFirst({
			where: eq(otps.mobileId, mobile.id),
			orderBy: (otps, { desc }) => desc(otps.createdAt), // Get the latest OTP
		});

		if (!latestOtp || latestOtp.code !== otpCode) {
			return { success: false, message: "Invalid OTP." };
		}

		if (latestOtp.expiresAt.getTime() < Date.now()) {
			return { success: false, message: "OTP expired." };
		}

		if (latestOtp.verifiedAt) {
			return { success: false, message: "OTP already used." };
		}

		// Mark OTP as verified
		await db
			.update(otps)
			.set({ verifiedAt: new Date().toISOString() })
			.where(eq(otps.id, latestOtp.id));

		// In a real application, you would generate a JWT or session token here.
		// For this example, we'll just return success and the mobileId.
		const sessionToken = `session_${mobile.id}_${Date.now()}`; // Placeholder token

		return {
			success: true,
			message: "OTP verified successfully.",
			mobileId: mobile.id,
			token: sessionToken,
		};
	} catch (error: any) {
		console.error("Error verifying OTP:", error);
		return {
			success: false,
			message: "Failed to verify OTP.",
			error: error.message,
		};
	}
}
