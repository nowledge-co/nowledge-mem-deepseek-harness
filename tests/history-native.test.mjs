import assert from 'node:assert/strict'
import test from 'node:test'
import { historyCommand } from '../src/history.js'

test('native 0.2.2-rc.2 command registry and replay-validated query drive preview/apply', { skip: process.env.DSH_HISTORY_NATIVE_TEST !== 'true' ? 'qualified in the explicit latest-host CI lane' : false }, async () => {
  const { Context, Service } = await import('@deepseek-ai/cordis')
  const { default: SessionStore } = await import('@deepseek-ai/dsh-session')
  const { default: CommandRuntime } = await import('@deepseek-ai/dsh-commands')
  const { default: SessionQuery } = await import('@deepseek-ai/dsh-session-query')
  const { createUserMessage } = await import('@deepseek-ai/dsh-llm')
  const ctx = new Context()
  const fibers = []
  const mount = async plugin => { const fiber = ctx.plugin(plugin); fibers.push(fiber); await fiber }
  try {
    await mount(SessionStore)
    await mount(CommandRuntime)
    const owner = ctx.sessions.create('current-qa', { meta: { cwd: '/synthetic' } })
    const history = ctx.sessions.create('old-qa', { meta: { cwd: '/synthetic' } })
    history.append('user/message', createUserMessage({ content: [{ type: 'text', text: 'Synthetic history question' }], source: { kind: 'user' } }), { surfaceOp: 'append' })
    class FixturePersistence extends Service {
      constructor(inner) { super(inner, 'sessionPersistence') }
      async list() { return ctx.sessions.list().map(session => ({ header: session.header, revision: 'synthetic' })) }
    }
    await mount(FixturePersistence)
    await mount(SessionQuery)
    let writes = 0
    const definition = historyCommand(ctx, { sourceApp: 'deepseek-harness', maxThreadMessageChars: 1000 },
      async () => ({ url: 'http://127.0.0.1:1', env: {} }),
      async (_ctx, _config, session) => { writes++; assert.equal(session.header.id, 'old-qa'); return { count: 1 } },
    )
    ctx.commands.register(definition)
    const agent = { id: owner.id, session: owner }
    const run = text => ctx.commands.execute(agent, `/mem-backfill ${text}`, [], new AbortController().signal)
    assert.match((await run('list')).result.text, /old-qa/u)
    const preview = (await run('preview exact-space old-qa')).result
    assert.equal(preview.kind, 'success', preview.text)
    assert.equal(writes, 0)
    const token = preview.text.match(/apply ([a-f0-9]{32})/u)[1]
    assert.equal((await run(`apply ${token}`)).result.kind, 'success')
    assert.equal(writes, 1)
    const commandRuns = owner.snapshotEvents().filter(event => event.type === 'command/run')
    assert.ok(commandRuns.length > 0)
    assert.ok(commandRuns.every(event => event.data.args === undefined))
  } finally { for (const fiber of fibers.reverse()) await fiber.dispose() }
})
