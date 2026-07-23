// Scaffold smoke test: verifies the engine module resolution path is working
// A real engine function will be tested here once Stage 1 is complete.
// For now, confirm that test globals (describe/it/expect) and the jsdom
// environment are wired correctly by testing Array.from, which is used
// throughout the engine's graph traversal utilities.
describe('scaffold smoke — engine path', () => {
  it('converts a Set to an Array (used by graph traversal)', () => {
    const input = new Set(['A', 'B', 'C'])
    const result = Array.from(input)
    expect(result).toHaveLength(3)
    expect(result).toContain('A')
  })
})
