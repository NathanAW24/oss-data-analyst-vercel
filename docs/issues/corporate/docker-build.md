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

Using debian