Using `bun`
```bash
nwiryawa@XAPTRAVEL30:~/work/oss-data-analyst-vercel$ docker build --no-cache -f Dockerfile.bun -t app .
[+] Building 6.6s (10/18)                                                   docker:default
 => [internal] load build definition from Dockerfile.bun                              0.0s
 => => transferring dockerfile: 1.79kB                                                0.0s
 => [internal] load metadata for docker.io/oven/bun:1                                 3.2s
 => [auth] oven/bun:pull token for registry-1.docker.io                               0.0s
 => [internal] load .dockerignore                                                     0.0s
 => => transferring context: 113B                                                     0.0s
 => [base 1/2] FROM docker.io/oven/bun:1@sha256:e90cdbaf9ccdb3d4bd693aa335c3310a6004  0.0s
 => => resolve docker.io/oven/bun:1@sha256:e90cdbaf9ccdb3d4bd693aa335c3310a6004286a8  0.0s
 => [internal] load build context                                                     0.0s
 => => transferring context: 13.43kB                                                  0.0s
 => CACHED [base 2/2] WORKDIR /app                                                    0.0s
 => CACHED [builder 1/4] WORKDIR /app                                                 0.0s
 => [runner 2/5] RUN groupadd --system --gid 1001 nodejs &&     useradd --system --u  0.4s
 => ERROR [deps 1/3] RUN apt-get update && apt-get install -y --no-install-recommend  3.3s
------                                                                                     
 > [deps 1/3] RUN apt-get update && apt-get install -y --no-install-recommends     python3 make g++  && rm -rf /var/lib/apt/lists/*:                                                  
0.496 Get:1 http://deb.debian.org/debian trixie InRelease [140 kB]                         
0.549 Get:2 http://deb.debian.org/debian trixie-updates InRelease [47.3 kB]                
0.590 Get:3 http://deb.debian.org/debian-security trixie-security InRelease [43.4 kB]      
1.835 Get:4 http://deb.debian.org/debian trixie/main amd64 Packages [9670 kB]
2.371 Ign:5 http://deb.debian.org/debian trixie-updates/main amd64 Packages
2.386 Ign:6 http://deb.debian.org/debian-security trixie-security/main amd64 Packages
2.400 Ign:5 http://deb.debian.org/debian trixie-updates/main amd64 Packages
2.412 Ign:6 http://deb.debian.org/debian-security trixie-security/main amd64 Packages
2.426 Ign:5 http://deb.debian.org/debian trixie-updates/main amd64 Packages
2.440 Ign:6 http://deb.debian.org/debian-security trixie-security/main amd64 Packages
2.451 Err:5 http://deb.debian.org/debian trixie-updates/main amd64 Packages
2.451   403  authenticationrequired [IP: 146.75.46.132 80]
2.466 Err:6 http://deb.debian.org/debian-security trixie-security/main amd64 Packages
2.466   403  authenticationrequired [IP: 146.75.46.132 80]
2.879 Fetched 9901 kB in 3s (3863 kB/s)
2.879 Reading package lists...
3.282 E: Failed to fetch http://deb.debian.org/debian/dists/trixie-updates/main/binary-amd64/Packages  403  authenticationrequired [IP: 146.75.46.132 80]
3.282 E: Failed to fetch http://deb.debian.org/debian-security/dists/trixie-security/main/binary-amd64/Packages  403  authenticationrequired [IP: 146.75.46.132 80]
3.282 E: Some index files failed to download. They have been ignored, or old ones used instead.
------
Dockerfile.bun:13
--------------------
  12 |     FROM base AS deps
  13 | >>> RUN apt-get update && apt-get install -y --no-install-recommends \
  14 | >>>     python3 make g++ \
  15 | >>>  && rm -rf /var/lib/apt/lists/*
  16 |     COPY package.json bun.lock* ./
--------------------
ERROR: failed to build: failed to solve: process "/bin/sh -c apt-get update && apt-get install -y --no-install-recommends     python3 make g++  && rm -rf /var/lib/apt/lists/*" did not complete successfully: exit code: 100
```


Using alpine distribution
```bash
nwiryawa@XAPTRAVEL30:~/work/oss-data-analyst-vercel$ docker build --no-cache -f Dockerfile -t app .                                                                               
[+] Building 3.3s (10/20)                                                   docker:default 
 => [internal] load build definition from Dockerfile                                  0.0s 
 => => transferring dockerfile: 2.19kB                                                0.0s 
 => [internal] load metadata for docker.io/library/node:23-alpine                     1.7s
 => [internal] load .dockerignore                                                     0.0s
 => => transferring context: 113B                                                     0.0s
 => [internal] load build context                                                     0.0s
 => => transferring context: 15.77kB                                                  0.0s
 => CACHED [base 1/1] FROM docker.io/library/node:23-alpine@sha256:a34e14ef1df25b582  0.0s
 => => resolve docker.io/library/node:23-alpine@sha256:a34e14ef1df25b58258956049ab5a  0.0s
 => CACHED [builder 1/4] WORKDIR /app                                                 0.0s
 => [deps 1/5] RUN cat /etc/apk/repositories                                          0.4s
 => [runner 2/7] RUN addgroup --system --gid 1001 nodejs                              0.4s
 => ERROR [deps 2/5] RUN apk add --no-cache --allow-untrusted libc6-compat            1.0s
 => [runner 3/7] RUN adduser --system --uid 1001 nextjs                               0.6s
------                                                                                     
 > [deps 2/5] RUN apk add --no-cache --allow-untrusted libc6-compat:                       
0.567 fetch https://dl-cdn.alpinelinux.org/alpine/v3.22/main/x86_64/APKINDEX.tar.gz        
0.842 283BEF3D12790000:error:0A000086:SSL routines:tls_post_process_server_certificate:certificate verify failed:ssl/statem/statem_clnt.c:2106:                                       
0.845 WARNING: fetching https://dl-cdn.alpinelinux.org/alpine/v3.22/main: Permission denied
0.845 fetch https://dl-cdn.alpinelinux.org/alpine/v3.22/community/x86_64/APKINDEX.tar.gz
0.992 283BEF3D12790000:error:0A000086:SSL routines:tls_post_process_server_certificate:certificate verify failed:ssl/statem/statem_clnt.c:2106:
0.994 WARNING: fetching https://dl-cdn.alpinelinux.org/alpine/v3.22/community: Permission denied
0.994 ERROR: unable to select packages:
0.994   libc6-compat (no such package):
0.994     required by: world[libc6-compat]
------
Dockerfile:18
--------------------
  16 |     #     && rm -rf /tmp/apk
  17 |     
  18 | >>> RUN apk add --no-cache --allow-untrusted libc6-compat
  19 |     # If you still run into build issue, go to "Problem #3: Making /app is read only.
  20 |     # in case you have permission issues.
--------------------
ERROR: failed to build: failed to solve: process "/bin/sh -c apk add --no-cache --allow-untrusted libc6-compat" did not complete successfully: exit code: 1
```

This issue resolved by using `airflow-dev` server that has less restrictive permissions, but now is facing different error
```bash
[mesmgr_prd@xsjvairfapd01 bes-oss-data-analyst-vercel]$ docker build -f Dockerfile -t oss-data-analyst .
[+] Building 25.5s (13/20)                                                                                                                                                              docker:default
 => [internal] load build definition from Dockerfile                                                                                                                                              0.0s
 => => transferring dockerfile: 2.19kB                                                                                                                                                            0.0s
 => [internal] load metadata for docker.io/library/node:23-alpine                                                                                                                                 1.1s
 => [internal] load .dockerignore                                                                                                                                                                 0.0s
 => => transferring context: 113B                                                                                                                                                                 0.0s
 => [internal] load build context                                                                                                                                                                 0.1s
 => => transferring context: 3.34MB                                                                                                                                                               0.1s
 => [base 1/1] FROM docker.io/library/node:23-alpine@sha256:a34e14ef1df25b58258956049ab5a71ea7f0d498e41d0b514f4b8de09af09456                                                                      3.6s
 => => resolve docker.io/library/node:23-alpine@sha256:a34e14ef1df25b58258956049ab5a71ea7f0d498e41d0b514f4b8de09af09456                                                                           0.0s
 => => sha256:dfb92eddc1a1cc8909288d09ef3781f8be90d926b68c536be670c2ae59adc0f4 51.77MB / 51.77MB                                                                                                  1.5s
 => => sha256:1b67613f0a721f5e91ffb2f49054a3c73c4c840bf8d7f882c9b2c08f85e0893f 1.26MB / 1.26MB                                                                                                    0.4s
 => => sha256:a34e14ef1df25b58258956049ab5a71ea7f0d498e41d0b514f4b8de09af09456 6.41kB / 6.41kB                                                                                                    0.0s
 => => sha256:b9d38d589853406ff0d4364f21969840c3e0397087643aef8eede40edbb6c7cd 1.72kB / 1.72kB                                                                                                    0.0s
 => => sha256:4920d009efd57b07b1ee410c55df2a51eb205e0c47ef97b13b693849a152ad06 6.21kB / 6.21kB                                                                                                    0.0s
 => => sha256:fe07684b16b82247c3539ed86a65ff37a76138ec25d380bd80c869a1a4c73236 3.80MB / 3.80MB                                                                                                    0.2s
 => => extracting sha256:fe07684b16b82247c3539ed86a65ff37a76138ec25d380bd80c869a1a4c73236                                                                                                         0.2s
 => => sha256:c9ddb8507f841fcb28003ed1a2f32d68d43e79296cab55b37f19e7f0f61982dd 446B / 446B                                                                                                        0.5s
 => => extracting sha256:dfb92eddc1a1cc8909288d09ef3781f8be90d926b68c536be670c2ae59adc0f4                                                                                                         1.6s
 => => extracting sha256:1b67613f0a721f5e91ffb2f49054a3c73c4c840bf8d7f882c9b2c08f85e0893f                                                                                                         0.1s
 => => extracting sha256:c9ddb8507f841fcb28003ed1a2f32d68d43e79296cab55b37f19e7f0f61982dd                                                                                                         0.0s
 => [deps 1/5] RUN cat /etc/apk/repositories                                                                                                                                                      1.0s
 => [builder 1/4] WORKDIR /app                                                                                                                                                                    0.2s
 => [runner 2/7] RUN addgroup --system --gid 1001 nodejs                                                                                                                                          1.2s
 => [deps 2/5] RUN apk add --no-cache --allow-untrusted libc6-compat                                                                                                                              1.5s 
 => [runner 3/7] RUN adduser --system --uid 1001 nextjs                                                                                                                                           1.0s 
 => [deps 3/5] WORKDIR /app                                                                                                                                                                       0.2s
 => [deps 4/5] COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./                                                                                                         0.7s 
 => ERROR [deps 5/5] RUN   if [ -f yarn.lock ]; then yarn --frozen-lockfile;   elif [ -f package-lock.json ]; then npm ci;   elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --  17.2s 
------                                                                                                                                                                                                 
 > [deps 5/5] RUN   if [ -f yarn.lock ]; then yarn --frozen-lockfile;   elif [ -f package-lock.json ]; then npm ci;   elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile;   else echo "Lockfile not found." && exit 1;   fi:                                                                                                                                                   
0.714 ! Corepack is about to download https://registry.npmjs.org/pnpm/-/pnpm-8.15.0.tgz                                                                                                                
1.906 Lockfile is up to date, resolution step is skipped                                                                                                                                               
1.990 Progress: resolved 1, reused 0, downloaded 0, added 0                                                                                                                                            
2.273 Packages: +1419
2.273 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
2.991 
2.991    ╭───────────────────────────────────────────────────────────────────╮
2.991    │                                                                   │
2.991    │                Update available! 8.15.0 → 10.27.0.                │
2.991    │   Changelog: https://github.com/pnpm/pnpm/releases/tag/v10.27.0   │
2.991    │     Run "corepack prepare pnpm@10.27.0 --activate" to update.     │
2.991    │                                                                   │
2.991    │      Follow @pnpmjs for updates: https://twitter.com/pnpmjs       │
2.991    │                                                                   │
2.991    ╰───────────────────────────────────────────────────────────────────╯
2.991 
2.997 Progress: resolved 1419, reused 0, downloaded 20, added 14
4.006 Progress: resolved 1419, reused 0, downloaded 228, added 228
5.077 Progress: resolved 1419, reused 0, downloaded 326, added 322
6.077 Progress: resolved 1419, reused 0, downloaded 361, added 349
7.086 Progress: resolved 1419, reused 0, downloaded 473, added 464
8.099 Progress: resolved 1419, reused 0, downloaded 647, added 643
9.099 Progress: resolved 1419, reused 0, downloaded 826, added 825
10.11 Progress: resolved 1419, reused 0, downloaded 984, added 974
11.10 Progress: resolved 1419, reused 0, downloaded 1241, added 1235
12.10 Progress: resolved 1419, reused 0, downloaded 1418, added 1417
13.10 Progress: resolved 1419, reused 0, downloaded 1418, added 1418
14.13 Progress: resolved 1419, reused 0, downloaded 1419, added 1418
14.51 Progress: resolved 1419, reused 0, downloaded 1419, added 1419, done
14.79 .../node_modules/better-sqlite3 install$ prebuild-install || node-gyp rebuild --release
14.81 .../node_modules/better-sqlite3 install$ prebuild-install || node-gyp rebuild --release
14.84 .../canvas@3.2.0/node_modules/canvas install$ prebuild-install -r napi || node-gyp rebuild
15.21 .../canvas@3.2.0/node_modules/canvas install: prebuild-install warn install No prebuilt binaries found (target=7 runtime=napi arch=x64 libc=musl platform=linux)
15.28 .../canvas@3.2.0/node_modules/canvas install: gyp info it worked if it ends with ok
15.28 .../canvas@3.2.0/node_modules/canvas install: gyp info using node-gyp@9.4.1
15.28 .../canvas@3.2.0/node_modules/canvas install: gyp info using node@23.11.1 | linux | x64
15.32 .../canvas@3.2.0/node_modules/canvas install: (node:86) [DEP0060] DeprecationWarning: The `util._extend` API is deprecated. Please use Object.assign() instead.
15.32 .../canvas@3.2.0/node_modules/canvas install: (Use `node --trace-deprecation ...` to show where the warning was created)
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python 
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python Python is not set from command line or npm configuration
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python Python is not set from environment variable PYTHON
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python checking if "python3" can be used
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python - "python3" is not in PATH or produced an error
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python checking if "python" can be used
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python - "python" is not in PATH or produced an error
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python 
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python **********************************************************
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python You need to install the latest version of Python.
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python Node-gyp should be able to find and use Python. If not,
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python you can try one of the following options:
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python - Use the switch --python="/path/to/pythonexecutable"
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python   (accepted by both node-gyp and npm)
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python - Set the environment variable PYTHON
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python - Set the npm configuration variable python:
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python   npm config set python "/path/to/pythonexecutable"
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python For more information consult the documentation at:
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python https://github.com/nodejs/node-gyp#installation
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python **********************************************************
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! find Python 
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! configure error 
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! stack Error: Could not find any Python installation to use
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! stack     at PythonFinder.fail (/root/.cache/node/corepack/v1/pnpm/8.15.0/dist/node_modules/node-gyp/lib/find-python.js:330:47)
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! stack     at PythonFinder.runChecks (/root/.cache/node/corepack/v1/pnpm/8.15.0/dist/node_modules/node-gyp/lib/find-python.js:159:21)
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! stack     at PythonFinder.<anonymous> (/root/.cache/node/corepack/v1/pnpm/8.15.0/dist/node_modules/node-gyp/lib/find-python.js:202:16)
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! stack     at PythonFinder.execFileCallback (/root/.cache/node/corepack/v1/pnpm/8.15.0/dist/node_modules/node-gyp/lib/find-python.js:294:16)
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! stack     at exithandler (node:child_process:421:5)
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! stack     at ChildProcess.errorhandler (node:child_process:433:5)
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! stack     at ChildProcess.emit (node:events:507:28)
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! stack     at ChildProcess._handle.onexit (node:internal/child_process:292:12)
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! stack     at onErrorNT (node:internal/child_process:484:16)
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! stack     at process.processTicksAndRejections (node:internal/process/task_queues:90:21)
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! System Linux 4.18.0-553.el8_10.x86_64
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! command "/usr/local/bin/node" "/root/.cache/node/corepack/v1/pnpm/8.15.0/dist/node_modules/node-gyp/bin/node-gyp.js" "rebuild"
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! cwd /app/node_modules/.pnpm/canvas@3.2.0/node_modules/canvas
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! node -v v23.11.1
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! node-gyp -v v9.4.1
15.33 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! not ok 
15.34 .../canvas@3.2.0/node_modules/canvas install: Failed
15.34  ELIFECYCLE  Command failed with exit code 1.
------
Dockerfile:24
--------------------
  23 |     COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
  24 | >>> RUN \
  25 | >>>   if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  26 | >>>   elif [ -f package-lock.json ]; then npm ci; \
  27 | >>>   elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  28 | >>>   else echo "Lockfile not found." && exit 1; \
  29 | >>>   fi
  30 |     
--------------------
ERROR: failed to build: failed to solve: process "/bin/sh -c if [ -f yarn.lock ]; then yarn --frozen-lockfile;   elif [ -f package-lock.json ]; then npm ci;   elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile;   else echo \"Lockfile not found.\" && exit 1;   fi" did not complete successfully: exit code: 1
```