// 临时验证脚本：验证购物车按用户隔离 + 登录合并 + 老 key 迁移 + 库存封顶
import { build } from 'esbuild'
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const dir = mkdtempSync(join(tmpdir(), 'cart-test-'))
const authStub = join(dir, 'auth.ts')
const cartPkg = join(dir, 'cart.pkg.ts')

// mock auth：测试用例可控地切号
writeFileSync(authStub, `
let current: any = null
const subs = new Set<() => void>()
export function subscribe(fn: () => void) { subs.add(fn); return () => subs.delete(fn) }
export function getUser() { return current }
;(globalThis as any).__AUTH = {
  set: (u: any) => { current = u; subs.forEach(f => f()) },
  subs: subs.size,
}
`)

// 把真实 cart.ts 拷过来，./auth 解析到上面的 mock
const real = readFileSync(join(process.cwd(), 'src/cart.ts'), 'utf8')
writeFileSync(cartPkg, real.replace("from './auth'", "from './auth'").replace(
  "import { subscribe, getUser } from './auth'",
  "import { subscribe, getUser } from './auth'",
))

const out = join(dir, 'cart.cjs')
await build({
  entryPoints: [authStub],
  outfile: join(dir, 'auth.cjs'),
  bundle: true, format: 'cjs', platform: 'node', write: false,
}).then(() => {})
await build({
  entryPoints: [cartPkg],
  external: ['./auth'],
  alias: { './auth': join(dir, 'auth.cjs') },
  outfile: out,
  bundle: true, format: 'cjs', platform: 'node',
  plugins: [{ name: 'react', setup(b) {
    b.onResolve({ filter: /^react$/ }, () => ({ path: 'react', namespace: 's' }))
    b.onLoad({ filter: /.*/, namespace: 's' }, () => ({ contents:
      'export function useState(v){ return [typeof v==="function"?v():v, ()=>{}] }\nexport function useEffect(){}\n' }))
  }}],
})

// localStorage shim
const store = new Map()
const localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => { store.delete(k) },
}

const ctx = {
  localStorage, console,
  require: (id) => require(id),
  module: { exports: {} }, exports: {},
}
ctx.globalThis = { ...ctx }
require('vm').runInContext(readFileSync(out, 'utf8'), ctx, { filename: out })
// 我们的 alias 输出的是绝对路径 require；node 能直接解析
const c = require(out)
const A = ctx.__AUTH

const P = { id: 'p1', name: '枸杞', image: 'a.jpg', price: 30, originalPrice: 40, stock: 10 }
const show = (k) => JSON.stringify(store.get(k) ?? '∅')

let fail = 0
const eq = (label, got, want) => {
  const ok = got === want
  if (!ok) fail++
  console.log(`${ok ? '✅' : '❌'} ${label}\n   got : ${got}\n   want: ${want}`)
}

console.log('=== 用例 1：游客与两个登录账号互不串 ===')
store.clear()
eq('初始 legacy key 为空', show('guyibu_cart'), '∅')
c.cartActions.add(P, 2)
eq('游客加购写入 guest key', show('guyibu_cart_guest'), JSON.stringify([{ ...P, quantity: 2 }]))

A.set({ id: 'u1', username: 'a' })
eq('u1 登录：guest 合并进来', show('guyibu_cart_u1'), JSON.stringify([{ ...P, quantity: 2 }]))
eq('u1 登录：guest key 已清空', show('guyibu_cart_guest'), '∅')

c.cartActions.add(P, 1)
eq('u1 再加 1 件 → 3', show('guyibu_cart_u1'), JSON.stringify([{ ...P, quantity: 3 }]))

A.set({ id: 'u2', username: 'b' })
eq('u2 登录：拿到自己的空车（不串 u1）', show('guyibu_cart_u2'), JSON.stringify([]))
c.cartActions.add(P, 5)
eq('u2 加购后 u1 数据未被污染', show('guyibu_cart_u1'), JSON.stringify([{ ...P, quantity: 3 }]))
eq('u2 自己的车有 5 件', show('guyibu_cart_u2'), JSON.stringify([{ ...P, quantity: 5 }]))

A.set(null)
eq('退出登录：回到空 guest 车', show('guyibu_cart_guest'), '∅')

console.log('\n=== 用例 2：旧版全局 key 自动迁移（一次性）===')
store.clear()
store.set('guyibu_cart', JSON.stringify([{ ...P, quantity: 4 }]))
c.cartActions.add(P, 1)
eq('老 key 内容已搬到新 guest key', show('guyibu_cart_guest'), JSON.stringify([{ ...P, quantity: 5 }]))
eq('老 key 已删除', show('guyibu_cart'), '∅')

console.log('\n=== 用例 3：库存封顶 ===')
store.clear()
c.cartActions.add(P, 3)
c.cartActions.setQuantity('p1', 999, 10)
eq('setQuantity 封顶到 stock=10', show('guyibu_cart_guest'), JSON.stringify([{ ...P, quantity: 10 }]))
c.cartActions.setQuantity('p1', 0, 10)
eq('数量为 0 → 从购物车移除', show('guyibu_cart_guest'), JSON.stringify([]))
eq('cartSummary 空车', JSON.stringify(c.cartSummary([])), JSON.stringify({ total: 0, count: 0 }))

rmSync(dir, { recursive: true, force: true })
console.log(fail === 0 ? '\n全部通过 ✅' : `\n${fail} 项失败 ❌`)
process.exit(fail === 0 ? 0 : 1)
