

```
root@code-server:/var/code/inventory# yarn dev
yarn run v1.22.22
$ rm -rf .next && next dev -H 0.0.0.0 -p 3000
   ▲ Next.js 15.3.3
   - Local:        http://localhost:3000
   - Network:      http://0.0.0.0:3000
   - Environments: .env

 ✓ Starting...
 ✓ Ready in 2.3s
 ○ Compiling /middleware ...
 ✓ Compiled /middleware in 664ms (174 modules)
 ○ Compiling /login ...
 ✓ Compiled /login in 2.1s (454 modules)
 GET /login 200 in 2464ms
 ⚠ Cross origin request detected from 10.20.31.107 to /_next/* resource. In a future major version of Next.js, you will need to explicitly configure "allowedDevOrigins" in next.config to allow this.
Read more: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
 ✓ Compiled /api/auth/me in 152ms (168 modules)
 GET /api/auth/me 401 in 256ms
 ✓ Compiled /api/auth/login in 81ms (173 modules)
 POST /api/auth/login 200 in 244ms
 ○ Compiling / ...
 ✓ Compiled / in 542ms (609 modules)
 GET /_next/data/development/index.json 200 in 852ms
 ✓ Compiled /api/father-spaces/list in 43ms (231 modules)
 ✓ Compiled (235 modules)
 GET /api/actives/list 304 in 123ms
 GET /api/categories/list 304 in 125ms
 GET /api/father-spaces/list 304 in 118ms
 GET /api/actives/list 304 in 8ms
 GET /api/categories/list 304 in 12ms
 GET /api/father-spaces/list 304 in 11ms
 GET /api/categories/list 304 in 12ms
 GET /api/categories/list 304 in 10ms
 ✓ Compiled /api/actives/create in 169ms (238 modules)
 POST /api/actives/create 400 in 180ms
 POST /api/actives/create 400 in 2ms
 POST /api/actives/create 400 in 2ms
 POST /api/actives/create 400 in 5ms
 POST /api/actives/create 400 in 2ms
 POST /api/actives/create 400 in 2ms
 POST /api/actives/create 400 in 1ms
 POST /api/actives/create 400 in 2ms
 POST /api/actives/create 400 in 2ms
 POST /api/actives/create 400 in 3ms
 POST /api/actives/create 400 in 2ms
 POST /api/actives/create 400 in 2ms
 POST /api/actives/create 400 in 2ms
 POST /api/actives/create 400 in 2ms
 POST /api/actives/create 400 in 2ms
 POST /api/actives/create 400 in 3ms
 POST /api/actives/create 400 in 2ms
 POST /api/actives/create 400 in 1ms
 ✓ Compiled in 174ms (380 modules)
 ✓ Compiled in 136ms (380 modules)
 ✓ Compiled in 165ms (380 modules)
 ✓ Compiled in 180ms (380 modules)
 ✓ Compiled in 150ms (380 modules)
```