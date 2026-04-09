[{
	"resource": "/var/code/inventory/pages/index.tsx",
	"owner": "typescript",
	"code": "2741",
	"severity": 8,
	"message": "A propriedade 'searchCategory' está ausente no tipo '{ query: string; manufacturer: string; model: string; category: string; tag: string; }', mas é obrigatória no tipo 'SearchFilters'.",
	"source": "ts",
	"startLineNumber": 60,
	"startColumn": 24,
	"endLineNumber": 60,
	"endColumn": 31,
	"relatedInformation": [
		{
			"startLineNumber": 7,
			"startColumn": 3,
			"endLineNumber": 7,
			"endColumn": 17,
			"message": "'searchCategory' é declarado aqui.",
			"resource": "/var/code/inventory/components/SearchSection.tsx"
		},
		{
			"startLineNumber": 15,
			"startColumn": 3,
			"endLineNumber": 15,
			"endColumn": 10,
			"message": "O tipo esperado vem da propriedade 'filters', que é declarada aqui no tipo 'IntrinsicAttributes & SearchSectionProps'",
			"resource": "/var/code/inventory/components/SearchSection.tsx"
		}
	]
},{
	"resource": "/var/code/inventory/pages/index.tsx",
	"owner": "typescript",
	"code": "2322",
	"severity": 8,
	"message": "O tipo 'Dispatch<SetStateAction<{ query: string; manufacturer: string; model: string; category: string; tag: string; }>>' não pode ser atribuído ao tipo 'Dispatch<SetStateAction<SearchFilters>>'.\n  O tipo 'SetStateAction<SearchFilters>' não pode ser atribuído ao tipo 'SetStateAction<{ query: string; manufacturer: string; model: string; category: string; tag: string; }>'.\n    O tipo '(prevState: SearchFilters) => SearchFilters' não pode ser atribuído ao tipo 'SetStateAction<{ query: string; manufacturer: string; model: string; category: string; tag: string; }>'.\n      O tipo '(prevState: SearchFilters) => SearchFilters' não pode ser atribuído ao tipo '(prevState: { query: string; manufacturer: string; model: string; category: string; tag: string; }) => { query: string; manufacturer: string; model: string; category: string; tag: string; }'.\n        Os tipos de parâmetros 'prevState' e 'prevState' são incompatíveis.\n          O tipo '{ query: string; manufacturer: string; model: string; category: string; tag: string; }' não pode ser atribuído ao tipo 'SearchFilters'.",
	"source": "ts",
	"startLineNumber": 60,
	"startColumn": 42,
	"endLineNumber": 60,
	"endColumn": 52,
	"relatedInformation": [
		{
			"startLineNumber": 16,
			"startColumn": 3,
			"endLineNumber": 16,
			"endColumn": 13,
			"message": "O tipo esperado vem da propriedade 'setFilters', que é declarada aqui no tipo 'IntrinsicAttributes & SearchSectionProps'",
			"resource": "/var/code/inventory/components/SearchSection.tsx"
		}
	]
}]