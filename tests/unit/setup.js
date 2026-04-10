import '@testing-library/jest-dom'

// Onderdruk console.log in unit tests (debugLogger output)
vi.spyOn(console, 'log').mockImplementation(() => {})
