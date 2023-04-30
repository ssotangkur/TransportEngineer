/**
 * Sometimes you want to collect a stack trace at one location and then
 * print it out at another time. Calling this produces a stack trace at the point
 * this is called and return a function that you can call later to print out the
 * that stacktrace.
 * @returns function to print the collected stack trace
 */
export const getTracePrinter = () => {
  const rawTrace = new Error('Trace').stack!
  const trace = rawTrace.split('\n').slice(1).join('\n')
  return () => {
    console.log(trace)
  }
}
