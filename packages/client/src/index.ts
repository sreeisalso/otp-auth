import {
	AuthRequestSchema,
	VerifyOtpRequestSchema,
	AuthSuccessResponseSchema,
	AuthErrorResponseSchema,
	AuthResponse,
} from "@otp-auth/core"; // Reusing schemas from core

/**
 * Configuration options for the OTP-Auth Client.
 */
export interface OtpAuthClientConfig {
	/**
	 * The base URL of your Core SDK API endpoints.
	 * E.g., 'https://your-api.com/auth' or 'http://localhost:3000/api/otp-auth'
	 */
	baseUrl: string;
}

/**
 * Represents the OTP-Auth Client, providing methods for mobile-based authentication.
 */
export class OtpAuthClient {
	private config: OtpAuthClientConfig;

	/**
	 * Creates an instance of OtpAuthClient.
	 * @param {OtpAuthClientConfig} config - Configuration for the client.
	 */
	constructor(config: OtpAuthClientConfig) {
		this.config = config;
		if (!this.config.baseUrl) {
			throw new Error(
				"OtpAuthClient: 'baseUrl' is required in the configuration."
			);
		}
	}

	/**
	 * Helper function to make a POST request using WHATWG fetch.
	 * @param {string} endpoint - The API endpoint relative to the base URL.
	 * @param {any} data - The data to send in the request body.
	 * @returns {Promise<AuthResponse>} The parsed JSON response.
	 * @throws {Error} If the network request fails or the response is not JSON.
	 */
	private async post<T>(endpoint: string, data: any): Promise<T> {
		const url = `${this.config.baseUrl}${endpoint}`;
		try {
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify(data),
			});

			const jsonResponse = await response.json();

			if (!response.ok) {
				// Attempt to parse as AuthErrorResponseSchema for structured error
				const errorResult = AuthErrorResponseSchema.safeParse(jsonResponse);
				if (errorResult.success) {
					throw new Error(errorResult.data.message || "API error occurred.");
				} else {
					// Fallback for unexpected error response structure
					throw new Error(
						jsonResponse.message || `HTTP error! Status: ${response.status}`
					);
				}
			}

			// Validate successful response against AuthSuccessResponseSchema
			const successResult = AuthSuccessResponseSchema.safeParse(jsonResponse);
			if (!successResult.success) {
				console.error(
					"Client: Received unexpected successful response format:",
					jsonResponse,
					successResult.error
				);
				throw new Error("Received unexpected response format from server.");
			}
			return successResult.data as T;
		} catch (error: any) {
			console.error(`Client: Error during POST to ${url}:`, error);
			// Re-throw the error to be handled by the caller
			throw new Error(`Network or API error: ${error.message}`);
		}
	}

	/**
	 * Initiates the sign-up process by sending an OTP to the provided mobile number.
	 * Terminology: sign-up, mobile, otp.
	 * @param {string} mobileNumber - The mobile number for sign-up.
	 * @returns {Promise<AuthResponse>} A response indicating if the OTP was sent successfully.
	 */
	public async signUpMobile(mobileNumber: string): Promise<AuthResponse> {
		const parsed = AuthRequestSchema.safeParse({ mobileNumber });
		if (!parsed.success) {
			return {
				success: false,
				message: "Invalid mobile number format for sign-up.",
				error: parsed.error.message,
			};
		}
		return this.post<AuthResponse>("/sign-up-otp", {
			mobileNumber: parsed.data.mobileNumber,
		});
	}

	/**
	 * Initiates the sign-in process by sending an OTP to the provided mobile number.
	 * Terminology: sign-in, mobile, otp.
	 * @param {string} mobileNumber - The mobile number for sign-in.
	 * @returns {Promise<AuthResponse>} A response indicating if the OTP was sent successfully.
	 */
	public async signInMobile(mobileNumber: string): Promise<AuthResponse> {
		const parsed = AuthRequestSchema.safeParse({ mobileNumber });
		if (!parsed.success) {
			return {
				success: false,
				message: "Invalid mobile number format for sign-in.",
				error: parsed.error.message,
			};
		}
		return this.post<AuthResponse>("/sign-in-otp", {
			mobileNumber: parsed.data.mobileNumber,
		});
	}

	/**
	 * Verifies the OTP code received for a specific mobile number.
	 * Terminology: mobile, otp.
	 * @param {string} mobileNumber - The mobile number associated with the OTP.
	 * @param {string} otpCode - The OTP code to verify.
	 * @returns {Promise<AuthResponse>} A response indicating verification success, including a session token if successful.
	 */
	public async verifyOtp(
		mobileNumber: string,
		otpCode: string
	): Promise<AuthResponse> {
		const parsed = VerifyOtpRequestSchema.safeParse({ mobileNumber, otpCode });
		if (!parsed.success) {
			return {
				success: false,
				message: "Invalid mobile number or OTP code format for verification.",
				error: parsed.error.message,
			};
		}
		return this.post<AuthResponse>("/verify-otp", parsed.data);
	}

	/**
	 * Handles the sign-out process.
	 * Terminology: sign-out.
	 * Note: For a truly stateless API (like JWTs), sign-out might involve client-side token removal.
	 * For session-based systems, this would hit an API endpoint to invalidate the session.
	 * @returns {Promise<AuthResponse>} A response indicating sign-out success.
	 */
	public async signOut(): Promise<AuthResponse> {
		// In a real application, you might send a request to the server to invalidate a session/token.
		// For a JWT-based system, this is primarily a client-side action (deleting the token).
		// If your Core SDK manages server-side sessions, uncomment and adapt the following:
		/*
    try {
      const response = await fetch(`${this.config.baseUrl}/sign-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include authorization header if needed, e.g., 'Authorization': `Bearer ${yourSessionToken}`
        },
      });
      const jsonResponse = await response.json();
      if (!response.ok) {
        throw new Error(jsonResponse.message || 'Failed to sign out on server.');
      }
      return { success: true, message: 'Signed out successfully.' };
    } catch (error: any) {
      console.error('Client: Error during sign out:', error);
      return { success: false, message: 'Failed to sign out.', error: error.message };
    }
    */
		return {
			success: true,
			message: "Signed out successfully (client-side action).",
		};
	}
}
