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


Tried on home laptop also faced the same problem
```bash
➜  oss-data-analyst-vercel git:(main) ✗ docker build -f Dockerfile -t vercel_data_analyst .
[+] Building 48.0s (15/22)                                                                                  
 => [internal] load build definition from Dockerfile                                                   0.0s
 => => transferring dockerfile: 2.37kB                                                                 0.0s
 => [internal] load .dockerignore                                                                      0.0s
 => => transferring context: 150B                                                                      0.0s
 => [internal] load metadata for docker.io/library/node:20-alpine                                      9.2s
 => [auth] library/node:pull token for registry-1.docker.io                                            0.0s
 => [base 1/1] FROM docker.io/library/node:20-alpine@sha256:658d0f63e501824d6c23e06d4bb95c71e7d704537  3.0s
 => => resolve docker.io/library/node:20-alpine@sha256:658d0f63e501824d6c23e06d4bb95c71e7d704537c9d92  0.0s
 => => sha256:f6b4fb9446345fcad2db26eac181fef6c0a919c8a4fcccd3bea5deb7f6dff67e 4.20MB / 4.20MB         0.8s
 => => sha256:eb9824d7990580162dd96cf3c8e08c9e966ed8d819adbb6e065c3c5ab73d74b4 43.12MB / 43.12MB       1.9s
 => => sha256:bb9f6f8b202047f37f5d51a1f2e731b60925a601fe4c9c1495e6c000ddd25944 1.26MB / 1.26MB         0.6s
 => => sha256:658d0f63e501824d6c23e06d4bb95c71e7d704537c9d9272f488ac03a370d448 7.67kB / 7.67kB         0.0s
 => => sha256:8de97c8d14c9f6a920191993d1f08ae1ac27e476f0a065bae62fbdc8819956e4 1.72kB / 1.72kB         0.0s
 => => sha256:03337a57e3ac1108ce452cf3e2276a52a1c69695b0761d24fae2418045365983 6.54kB / 6.54kB         0.0s
 => => sha256:70268380327fbc2d9c066979d554cdff4c22f752e9be70bde123ec5ccb64c292 443B / 443B             1.3s
 => => extracting sha256:f6b4fb9446345fcad2db26eac181fef6c0a919c8a4fcccd3bea5deb7f6dff67e              0.1s
 => => extracting sha256:eb9824d7990580162dd96cf3c8e08c9e966ed8d819adbb6e065c3c5ab73d74b4              0.9s
 => => extracting sha256:bb9f6f8b202047f37f5d51a1f2e731b60925a601fe4c9c1495e6c000ddd25944              0.0s
 => => extracting sha256:70268380327fbc2d9c066979d554cdff4c22f752e9be70bde123ec5ccb64c292              0.0s
 => [internal] load build context                                                                      0.1s
 => => transferring context: 3.38MB                                                                    0.0s
 => [deps 1/6] RUN cat /etc/apk/repositories                                                           0.3s
 => [builder 1/4] WORKDIR /app                                                                         0.2s
 => [runner 2/7] RUN addgroup --system --gid 1001 nodejs                                               0.2s
 => [deps 2/6] RUN apk add --no-cache   python3   make   g++   cairo-dev   pango-dev   jpeg-dev   gi  18.1s
 => [runner 3/7] RUN adduser --system --uid 1001 nextjs                                                0.4s
 => [deps 3/6] RUN apk add --no-cache --allow-untrusted libc6-compat                                   1.5s
 => [deps 4/6] WORKDIR /app                                                                            0.0s 
 => [deps 5/6] COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./              0.0s 
 => ERROR [deps 6/6] RUN   if [ -f yarn.lock ]; then yarn --frozen-lockfile;   elif [ -f package-loc  15.8s 
------                                                                                                      
 > [deps 6/6] RUN   if [ -f yarn.lock ]; then yarn --frozen-lockfile;   elif [ -f package-lock.json ]; then npm ci;   elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile;   else echo "Lockfile not found." && exit 1;   fi:                                                                         
#0 0.286 ! Corepack is about to download https://registry.npmjs.org/pnpm/-/pnpm-8.15.0.tgz                  
#0 1.546 Lockfile is up to date, resolution step is skipped                                                 
#0 1.635 Progress: resolved 1, reused 0, downloaded 0, added 0
#0 1.790 Packages: +1419
#0 1.790 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
#0 2.044 
#0 2.044    ╭───────────────────────────────────────────────────────────────────╮
#0 2.044    │                                                                   │
#0 2.044    │                Update available! 8.15.0 → 10.28.0.                │
#0 2.044    │   Changelog: https://github.com/pnpm/pnpm/releases/tag/v10.28.0   │
#0 2.044    │     Run "corepack prepare pnpm@10.28.0 --activate" to update.     │
#0 2.044    │                                                                   │
#0 2.044    │      Follow @pnpmjs for updates: https://twitter.com/pnpmjs       │
#0 2.044    │                                                                   │
#0 2.044    ╰───────────────────────────────────────────────────────────────────╯
#0 2.044 
#0 2.637 Progress: resolved 1419, reused 0, downloaded 123, added 123
#0 3.637 Progress: resolved 1419, reused 0, downloaded 309, added 309
#0 4.643 Progress: resolved 1419, reused 0, downloaded 400, added 400
#0 5.644 Progress: resolved 1419, reused 0, downloaded 473, added 473
#0 6.685 Progress: resolved 1419, reused 0, downloaded 515, added 514
#0 7.686 Progress: resolved 1419, reused 0, downloaded 587, added 587
#0 8.688 Progress: resolved 1419, reused 0, downloaded 762, added 762
#0 9.688 Progress: resolved 1419, reused 0, downloaded 965, added 965
#0 10.69 Progress: resolved 1419, reused 0, downloaded 1140, added 1140
#0 11.69 Progress: resolved 1419, reused 0, downloaded 1355, added 1355
#0 12.37 Progress: resolved 1419, reused 0, downloaded 1419, added 1419, done
#0 12.72 .../node_modules/better-sqlite3 install$ prebuild-install || node-gyp rebuild --release
#0 12.74 .../node_modules/better-sqlite3 install$ prebuild-install || node-gyp rebuild --release
#0 12.76 .../canvas@3.2.0/node_modules/canvas install$ prebuild-install -r napi || node-gyp rebuild
#0 13.27 .../canvas@3.2.0/node_modules/canvas install: prebuild-install warn install No prebuilt binaries found (target=7 runtime=napi arch=arm64 libc=musl platform=linux)
#0 13.33 .../canvas@3.2.0/node_modules/canvas install: gyp info it worked if it ends with ok
#0 13.34 .../canvas@3.2.0/node_modules/canvas install: gyp info using node-gyp@9.4.1
#0 13.34 .../canvas@3.2.0/node_modules/canvas install: gyp info using node@20.19.6 | linux | arm64
#0 13.39 .../canvas@3.2.0/node_modules/canvas install: gyp info find Python using Python version 3.12.12 found at "/usr/bin/python3"
#0 13.45 .../canvas@3.2.0/node_modules/canvas install: gyp http GET https://nodejs.org/download/release/v20.19.6/node-v20.19.6-headers.tar.gz
#0 13.55 .../canvas@3.2.0/node_modules/canvas install: gyp http 200 https://nodejs.org/download/release/v20.19.6/node-v20.19.6-headers.tar.gz
#0 14.14 .../node_modules/better-sqlite3 install: Done
#0 14.51 .../canvas@3.2.0/node_modules/canvas install: gyp http GET https://nodejs.org/download/release/v20.19.6/SHASUMS256.txt
#0 14.54 .../canvas@3.2.0/node_modules/canvas install: gyp http 200 https://nodejs.org/download/release/v20.19.6/SHASUMS256.txt
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn /usr/bin/python3
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args [
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   '/root/.cache/node/corepack/v1/pnpm/8.15.0/dist/node_modules/node-gyp/gyp/gyp_main.py',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   'binding.gyp',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   '-f',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   'make',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   '-I',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   '/app/node_modules/.pnpm/canvas@3.2.0/node_modules/canvas/build/config.gypi',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   '-I',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   '/root/.cache/node/corepack/v1/pnpm/8.15.0/dist/node_modules/node-gyp/addon.gypi',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   '-I',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   '/root/.cache/node-gyp/20.19.6/include/node/common.gypi',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   '-Dlibrary=shared_library',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   '-Dvisibility=default',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   '-Dnode_root_dir=/root/.cache/node-gyp/20.19.6',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   '-Dnode_gyp_dir=/root/.cache/node/corepack/v1/pnpm/8.15.0/dist/node_modules/node-gyp',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   '-Dnode_lib_file=/root/.cache/node-gyp/20.19.6/<(target_arch)/node.lib',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   '-Dmodule_root_dir=/app/node_modules/.pnpm/canvas@3.2.0/node_modules/canvas',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   '-Dnode_engine=v8',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   '--depth=.',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   '--no-parallel',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   '--generator-output',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   'build',
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args   '-Goutput_dir=.'
#0 14.55 .../canvas@3.2.0/node_modules/canvas install: gyp info spawn args ]
#0 14.61 .../canvas@3.2.0/node_modules/canvas install: Traceback (most recent call last):
#0 14.61 .../canvas@3.2.0/node_modules/canvas install:   File "/root/.cache/node/corepack/v1/pnpm/8.15.0/dist/node_modules/node-gyp/gyp/gyp_main.py", line 42, in <module>
#0 14.61 .../canvas@3.2.0/node_modules/canvas install:     import gyp  # noqa: E402
#0 14.61 .../canvas@3.2.0/node_modules/canvas install:     ^^^^^^^^^^
#0 14.61 .../canvas@3.2.0/node_modules/canvas install:   File "/root/.cache/node/corepack/v1/pnpm/8.15.0/dist/node_modules/node-gyp/gyp/pylib/gyp/__init__.py", line 9, in <module>
#0 14.61 .../canvas@3.2.0/node_modules/canvas install:     import gyp.input
#0 14.61 .../canvas@3.2.0/node_modules/canvas install:   File "/root/.cache/node/corepack/v1/pnpm/8.15.0/dist/node_modules/node-gyp/gyp/pylib/gyp/input.py", line 19, in <module>
#0 14.61 .../canvas@3.2.0/node_modules/canvas install:     from distutils.version import StrictVersion
#0 14.61 .../canvas@3.2.0/node_modules/canvas install: ModuleNotFoundError: No module named 'distutils'
#0 14.62 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! configure error 
#0 14.62 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! stack Error: `gyp` failed with exit code: 1
#0 14.62 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! stack     at ChildProcess.onCpExit (/root/.cache/node/corepack/v1/pnpm/8.15.0/dist/node_modules/node-gyp/lib/configure.js:325:16)
#0 14.62 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! stack     at ChildProcess.emit (node:events:524:28)
#0 14.62 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! stack     at ChildProcess._handle.onexit (node:internal/child_process:293:12)
#0 14.62 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! System Linux 5.15.49-linuxkit-pr
#0 14.62 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! command "/usr/local/bin/node" "/root/.cache/node/corepack/v1/pnpm/8.15.0/dist/node_modules/node-gyp/bin/node-gyp.js" "rebuild"
#0 14.62 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! cwd /app/node_modules/.pnpm/canvas@3.2.0/node_modules/canvas
#0 14.62 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! node -v v20.19.6
#0 14.62 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! node-gyp -v v9.4.1
#0 14.62 .../canvas@3.2.0/node_modules/canvas install: gyp ERR! not ok 
#0 14.63 .../canvas@3.2.0/node_modules/canvas install: Failed
#0 14.63  ELIFECYCLE  Command failed with exit code 1.
------
Dockerfile:35
--------------------
  34 |     COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
  35 | >>> RUN \
  36 | >>>   if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  37 | >>>   elif [ -f package-lock.json ]; then npm ci; \
  38 | >>>   elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  39 | >>>   else echo "Lockfile not found." && exit 1; \
  40 | >>>   fi
  41 |     
--------------------
ERROR: failed to solve: process "/bin/sh -c if [ -f yarn.lock ]; then yarn --frozen-lockfile;   elif [ -f package-lock.json ]; then npm ci;   elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile;   else echo \"Lockfile not found.\" && exit 1;   fi" did not complete successfully: exit code: 1
```

the bun on my local computer also hanging here
```bash

➜  oss-data-analyst-vercel git:(temp/openai-provider-non-gateway) ✗ docker build -f Dockerfile.bun -t vercel_data_analyst .
[+] Building 386.0s (11/18)                                                                                 
 => [internal] load build definition from Dockerfile.bun                                               0.2s
 => => transferring dockerfile: 1.82kB                                                                 0.0s
 => [internal] load .dockerignore                                                                      0.2s
 => => transferring context: 150B                                                                      0.0s
 => [internal] load metadata for docker.io/oven/bun:1                                                  3.6s
 => [auth] oven/bun:pull token for registry-1.docker.io                                                0.0s
 => [base 1/2] FROM docker.io/oven/bun:1@sha256:e90cdbaf9ccdb3d4bd693aa335c3310a6004286a880f62f79b18f  3.6s
 => => resolve docker.io/oven/bun:1@sha256:e90cdbaf9ccdb3d4bd693aa335c3310a6004286a880f62f79b18f9b131  0.0s
 => => sha256:976da55174dd98142ecd4605ae841b5a0f98e4c96d1087e08ad90d88fef173af 296B / 296B             0.6s
 => => sha256:e90cdbaf9ccdb3d4bd693aa335c3310a6004286a880f62f79b18f9b1312a8ec3 1.61kB / 1.61kB         0.0s
 => => sha256:d91f0d4ef429b950f2074c38d30638fa4d4db81fcbfeeb0e4e19a16e0bc24592 1.43kB / 1.43kB         0.0s
 => => sha256:6a828f739420ec96bad6123094a07f3f234998f6cf772e34e0ba733aa8e2b347 49.65MB / 49.65MB       1.1s
 => => sha256:8a73d7555af39412e79f1616ee301db9ac8d79ad99761e68722e3c2c2e25a0c0 3.84kB / 3.84kB         0.0s
 => => sha256:8c875dd1236cb2dadf437ba5cfd46cf0e543803d876938ee147ae9a0521f6f95 39.43MB / 39.43MB       1.5s
 => => sha256:a1ac151f3bfe88961f2088887e68abf84cc89589b31764073719d4c91159f461 185B / 185B             1.0s
 => => sha256:c7ccb52487ff0bee2cd3e836db06161eee4174d8f0ae8cadcbd3b72f892f035f 3.40kB / 3.40kB         1.3s
 => => sha256:43703faa48c5ae4b0e96162c19baff72aba28814e183f91d8bcdec3bc6e3366f 139B / 139B             1.5s
 => => extracting sha256:6a828f739420ec96bad6123094a07f3f234998f6cf772e34e0ba733aa8e2b347              1.8s
 => => extracting sha256:976da55174dd98142ecd4605ae841b5a0f98e4c96d1087e08ad90d88fef173af              0.0s
 => => extracting sha256:8c875dd1236cb2dadf437ba5cfd46cf0e543803d876938ee147ae9a0521f6f95              0.4s
 => => extracting sha256:a1ac151f3bfe88961f2088887e68abf84cc89589b31764073719d4c91159f461              0.0s
 => => extracting sha256:c7ccb52487ff0bee2cd3e836db06161eee4174d8f0ae8cadcbd3b72f892f035f              0.0s
 => => extracting sha256:43703faa48c5ae4b0e96162c19baff72aba28814e183f91d8bcdec3bc6e3366f              0.0s
 => [internal] load build context                                                                      0.0s
 => => transferring context: 56.59kB                                                                   0.0s
 => [base 2/2] WORKDIR /app                                                                            0.5s
 => [builder 1/4] WORKDIR /app                                                                         0.0s
 => [deps 1/3] RUN apt-get update && apt-get install -y --no-install-recommends     python3 make g++  12.9s
 => [runner 2/5] RUN groupadd --system --gid 1001 nodejs &&     useradd --system --uid 1001 --no-log-  0.3s
 => [deps 2/3] COPY package.json bun.lock* ./                                                          0.0s 
 => [deps 3/3] RUN bun install --no-save --frozen-lockfile                                           365.2s 
 => => # bun install v1.3.5 (1e86cebd)                                                                      

 ...
```