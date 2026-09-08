/**
 * ESLint rule to enforce test file naming conventions
 *
 * Requires test files to follow the pattern: something.type.test.ts/tsx
 * Where type is one of: unit, component, integration, e2e
 */

import { ESLintUtils } from "@typescript-eslint/utils"
import path from "path"

const VALID_TEST_TYPES = ["unit", "component", "integration", "e2e"] as const

type MessageIds = "invalidTestFileName" | "missingTestType"

const createRule = ESLintUtils.RuleCreator(
	(name) => `https://github.com/Mearman/BibGraph/blob/main/eslint-rules/${name}.ts`
)

export const testFileNamingRule = createRule<[], MessageIds>({
	name: "test-file-naming",
	meta: {
		type: "problem",
		docs: {
			description: "enforce test file naming conventions (something.type.test.ts/tsx)",
		},
		fixable: undefined,
		schema: [],
		messages: {
			invalidTestFileName:
				'Test file "{{fileName}}" must follow the naming pattern: something.type.test.ts/tsx where type is one of: {{validTypes}}',
			missingTestType:
				'Test file "{{fileName}}" is missing a valid test type. Use one of: {{validTypes}}',
		},
	},
	defaultOptions: [],
	create(context) {
		const fileName = path.basename(context.filename)

		return {
			Program(node) {
				// Only check files that are test files
				if (!fileName.includes(".test.") && !fileName.includes(".spec.")) {
					return
				}

				// Check if file follows the expected pattern
				const testFileRegex = /^(.+)\.(unit|component|integration|e2e)\.test\.(ts|tsx|js|jsx)$/
				const match = fileName.match(testFileRegex)

				if (!match) {
					// It's a test file but doesn't match the pattern
					context.report({
						node,
						messageId: "invalidTestFileName",
						data: {
							fileName,
							validTypes: VALID_TEST_TYPES.join(", "),
						},
					})
				}
			},
		}
	},
})

export default {
	rules: {
		"test-file-naming": testFileNamingRule,
	},
}
