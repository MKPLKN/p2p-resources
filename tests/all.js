// This runner is auto-generated by Brittle

runTests()

async function runTests () {
  const test = (await import('brittle')).default

  test.pause()

  await import('./feature/resource-workflow.test.js')

  test.resume()
}