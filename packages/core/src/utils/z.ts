// Zod schemas for request and response validation.
import { z } from "zod/v4";

// Schema for mobile number input.
export const MobileNumberSchema = z
	.string()
	.min(10, "Mobile number must be at least 10 characters long")
	.max(15, "Mobile number must be at most 15 characters long")
	.regex(
		/^\+\d{10,15}$/,
		"Invalid mobile number format. Must start with '+' followed by digits."
	);

// Schema for OTP code input.
export const OtpCodeSchema = z
	.string()
	.min(4, "OTP code must be at least 4 digits")
	.max(8, "OTP code must be at most 8 digits")
	.regex(/^\d+$/, "OTP code must contain only digits.");

// Schema for sign-up/sign-in request.
export const AuthRequestSchema = z.object({
	mobileNumber: MobileNumberSchema,
});

// Schema for OTP verification request.
export const VerifyOtpRequestSchema = z.object({
	mobileNumber: MobileNumberSchema,
	otpCode: OtpCodeSchema,
});

// Schema for successful authentication response.
export const AuthSuccessResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
	mobileId: z.string().optional(),
	token: z.string().optional(), // JWT or opaque session token
});

// Schema for error response.
export const AuthErrorResponseSchema = z.object({
	success: z.boolean(),
	message: z.string(),
	error: z.string().optional(),
});

// Combined type for all possible responses
export type AuthResponse =
	| z.infer<typeof AuthSuccessResponseSchema>
	| z.infer<typeof AuthErrorResponseSchema>;
