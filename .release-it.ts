import type { Config } from "release-it";

export default {
	git: {
		commit: false,
		tag: true,
		push: false,
	},
	github: {
		release: true,
	},
	npm: {
		publish: false,
	},
} satisfies Config;
