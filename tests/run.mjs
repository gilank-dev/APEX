import { run } from 'node:test'
import { spec } from 'node:test/reporters'
import path from 'node:path'

const testFile = path.resolve(import.meta.dirname, 'brutal.test.mjs')

run({ files: [testFile] })
  .on('test:fail', () => {
    process.exitCode = 1
  })
  .compose(new spec())
  .pipe(process.stdout)
